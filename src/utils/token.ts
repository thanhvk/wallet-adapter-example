import type { Commitment, Connection, PublicKey } from '@solana/web3.js';
import { Transaction } from '@solana/web3.js';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
  createAssociatedTokenAccountInstruction,
  Account,
  getAccount,
  getAssociatedTokenAddress,
  createTransferInstruction,
} from '@solana/spl-token';

/**
 * Retrieve the associated token account, or create it if it doesn't exist
 *
 * @param connection               Connection to use
 * @param payer                    Payer of the transaction and initialization fees
 * @param mint                     Mint associated with the account to set or verify
 * @param owner                    Owner of the account to set or verify
 * @param source                   Source token account
 * @param allowOwnerOffCurve       Allow the owner account to be a PDA (Program Derived Address)
 * @param commitment               Desired level of commitment for querying the state
 * @param confirmOptions           Options for confirming the transaction
 * @param programId                SPL Token program account
 * @param associatedTokenProgramId SPL Associated Token program account
 *
 * @return Transaction to send token
 */
export async function getTxTransferToken(
    connection: Connection,
    payer: PublicKey,
    mint: PublicKey,
    desOwner: PublicKey,
    source: PublicKey,
    amount = 0,
    allowOwnerOffCurve = false,
    commitment?: Commitment,
    programId = TOKEN_PROGRAM_ID,
    associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID,
): Promise<Account | any> {
    const associatedToken = await getAssociatedTokenAddress(
        mint,
        desOwner,
        allowOwnerOffCurve,
        programId,
        associatedTokenProgramId
    );

    try {
        await getAccount(connection, associatedToken, commitment, programId);
    } catch (error: unknown) {
        // TokenAccountNotFoundError can be possible if the associated address has already received some lamports,
        // becoming a system account. Assuming program derived addressing is safe, this is the only case for the
        // TokenInvalidAccountOwnerError in this code path.
        if (error instanceof TokenAccountNotFoundError || error instanceof TokenInvalidAccountOwnerError) {
          // As this isn't atomic, it's possible others can create associated accounts meanwhile.
            try {
                return new Transaction().add(
                    createAssociatedTokenAccountInstruction(
                      payer,
                      associatedToken,
                      desOwner,
                      mint,
                      programId,
                      associatedTokenProgramId
                    ),
                    createTransferInstruction(
                      source,
                      associatedToken,
                      payer,
                      amount,
                    )
                );
            } catch (error: unknown) {
                // Ignore all errors; for now there is no API-compatible way to selectively ignore the expected
                // instruction error if the associated account exists already.
            }
        } else {
            throw error;
        }
    }    

    return new Transaction().add(
      createTransferInstruction(
        source,
        associatedToken,
        payer,
        amount,
      )
    );
}
