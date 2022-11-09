import { Transaction, SystemProgram, Keypair, Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { MINT_SIZE, TOKEN_PROGRAM_ID, createInitializeMintInstruction, getMinimumBalanceForRentExemptMint, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createMintToInstruction } from '@solana/spl-token';
import { DataV2, createCreateMetadataAccountV2Instruction } from '@metaplex-foundation/mpl-token-metadata';
import { bundlrStorage, Metaplex, UploadMetadataInput, walletAdapterIdentity } from '@metaplex-foundation/js';
import { useCallback, useMemo } from 'react';
import { useConnection, useWallet, WalletContextState } from '@solana/wallet-adapter-react';

const MINT_CONFIG = {
  numDecimals: 0,
  numberTokens: 1000
}

const MY_TOKEN_METADATA: UploadMetadataInput = {
  name: "Test Token",
  symbol: "TEST",
  description: "This is a test token!",
  image: "https://aptos-api.bluemove.net/uploads/Blue_Move_Bull_1_9938c44622.png" //add public URL to image you'd like to use
}

const ON_CHAIN_METADATA = {
  name: MY_TOKEN_METADATA.name, 
  symbol: MY_TOKEN_METADATA.symbol,
  uri: 'TO_UPDATE_LATER',
  sellerFeeBasisPoints: 0,
  creators: null,
  collection: null,
  uses: null
} as DataV2;

/**
 * 
 * @param wallet Solana Keypair
 * @param tokenMetadata Metaplex Fungible Token Standard object 
 * @returns Arweave url for our metadata json file
 */
 const uploadMetadata = async(metaplex: Metaplex, connection: Connection, wallet: WalletContextState, tokenMetadata: UploadMetadataInput):Promise<string> => {
  //Upload to Arweave
  const { uri } = await metaplex.nfts().uploadMetadata(tokenMetadata);
  console.log(`Arweave URL: `, uri);
  return uri;
}

const createNewMintTransaction = async (metaplex: Metaplex, connection:Connection, payer: WalletContextState, mintKeypair: Keypair, destinationWallet: PublicKey, mintAuthority: PublicKey, freezeAuthority: PublicKey)=>{
  if (!payer.publicKey) return null;  

  //Get the minimum lamport balance to create a new account and avoid rent payments
  const requiredBalance = await getMinimumBalanceForRentExemptMint(connection);
  //metadata account associated with mint
  const metadataPDA = await metaplex.nfts().pdas().metadata({mint: mintKeypair.publicKey});
  //get associated token account of your wallet
  const tokenATA = await getAssociatedTokenAddress(mintKeypair.publicKey, destinationWallet);

  const createNewTokenTransaction = new Transaction()
    .add(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: MINT_SIZE,
        lamports: requiredBalance,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(
        mintKeypair.publicKey, //Mint Address
        MINT_CONFIG.numDecimals, //Number of Decimals of New mint
        mintAuthority, //Mint Authority
        freezeAuthority, //Freeze Authority
        TOKEN_PROGRAM_ID),
      createAssociatedTokenAccountInstruction(
        payer.publicKey, //Payer 
        tokenATA, //Associated token account 
        payer.publicKey, //Token account owner
        mintKeypair.publicKey, //Mint
      ),
      createMintToInstruction(
        mintKeypair.publicKey, //Mint
        tokenATA, //Destination Token Account
        mintAuthority, //Authority
        MINT_CONFIG.numberTokens * Math.pow(10, MINT_CONFIG.numDecimals),//number of tokens
      ),
      createCreateMetadataAccountV2Instruction(
        {
          metadata: metadataPDA, 
          mint: mintKeypair.publicKey, 
          mintAuthority: mintAuthority,
          payer: payer.publicKey,
          updateAuthority: mintAuthority,
        },
        { createMetadataAccountArgsV2: 
          { 
            data: ON_CHAIN_METADATA, 
            isMutable: true 
          } 
        }
      )
    )

    return createNewTokenTransaction;
}

const CreateFungibleToken = () => {
  const { connection } = useConnection();
  const wallet = useWallet();

  //create metaplex instance on devnet using this wallet
  const metaplex = useMemo(() => {
    return Metaplex.make(connection)
      .use(walletAdapterIdentity(wallet))
      .use(bundlrStorage({
        address: 'https://devnet.bundlr.network',
        providerUrl: clusterApiUrl("devnet"),
        timeout: 60000, 
      }));
  }, [connection, wallet]);

  const createFungibleToken = useCallback(async () => {
    if (!wallet.publicKey) return;

    console.log(`---STEP 1: Uploading MetaData---`);
    let metadataUri = await uploadMetadata(metaplex, connection, wallet, MY_TOKEN_METADATA);
    ON_CHAIN_METADATA.uri = metadataUri;

    console.log(`---STEP 2: Creating Mint Transaction---`);
    let mintKeypair = Keypair.generate();   
    console.log(`New Mint Address: `, mintKeypair.publicKey.toString());

    const newMintTransaction:Transaction | null = await createNewMintTransaction(
      metaplex,
      connection,
      wallet,
      mintKeypair,
      wallet.publicKey,
      wallet.publicKey,
      wallet.publicKey
    );

    console.log(`---STEP 3: Executing Mint Transaction---`);
    if (newMintTransaction) {
      const {
        context: { slot: minContextSlot },
        value: { blockhash, lastValidBlockHeight },
      } = await connection.getLatestBlockhashAndContext();
      
      newMintTransaction.feePayer = wallet.publicKey;
      newMintTransaction.recentBlockhash = blockhash;
      const transactionId =  await wallet.sendTransaction(newMintTransaction, connection, { minContextSlot });
      
      console.log(`Transaction ID: `, transactionId);
      console.log(`Succesfully minted ${MINT_CONFIG.numberTokens} ${ON_CHAIN_METADATA.symbol} to ${wallet.publicKey?.toString()}.`);
      console.log(`View Transaction: https://solscan.io/tx/${transactionId}?cluster=devnet`);
      console.log(`View Token Mint: https://solscan.io/token/${mintKeypair.publicKey.toString()}?cluster=devnet`)
    }
  }, [connection, metaplex, wallet])

  return (
    <div>
      <button onClick={createFungibleToken}>Create Fungible Token</button>
    </div>
  );
}

export default CreateFungibleToken;