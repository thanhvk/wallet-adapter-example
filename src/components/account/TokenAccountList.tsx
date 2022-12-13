import { useEffect, useState, useCallback, useMemo } from 'react';
import ReactJson from 'react-json-view';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

import './styles.css';

const parser = (tokenAccount: any) => {
  if (!tokenAccount) return tokenAccount;

  const parsedAccountInfo = {
    ...tokenAccount.account.data.parsed.info,
    programOwner: tokenAccount.account.owner.toBase58(),
    pubkey: tokenAccount.pubkey.toBase58(),
  };

  return parsedAccountInfo;
};

const TokenAccountList = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [tokenAccountResult, setTokenAccountResult] = useState<any>(null);

  const getTokenAccounts = useCallback(async () => {
    if (!publicKey) return null;

    const result = await connection.getParsedTokenAccountsByOwner(publicKey, {
      programId: TOKEN_PROGRAM_ID,
    });

    setTokenAccountResult(result);
  }, [connection, publicKey]);

  useEffect(() => {
    getTokenAccounts();
  }, [getTokenAccounts]);

  const parsedTokenAccounts = useMemo(() => {
    if (!tokenAccountResult) return tokenAccountResult;

    let tokens = tokenAccountResult.value.map((token: any) => {
      return parser(token);
    });

    tokens = tokens.sort((a: any, b: any) => b.tokenAmount.uiAmount - a.tokenAmount.uiAmount)

    return tokens;
  }, [tokenAccountResult]);

  if (!tokenAccountResult) return null;

  return (
    <div>
      <div className="section-header">
        <code className="method highlight">getParsedTokenAccountsByOwner</code>
        <code>&#40;total: {parsedTokenAccounts.length} items&#41;</code>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="token-account-list">
            {parsedTokenAccounts.map((token: any, idx: number) => {
              return (
                <div key={idx} className="token-account-item">
                  <div>
                    <code>&#40;{idx + 1}&#41;</code>
                  </div>
                  <div>
                    <div>
                      <code>token account:</code>&nbsp;
                      <a
                        href={`https://solscan.io/account/${token.pubkey}?cluster=devnet`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <code>{token.pubkey}</code>
                      </a>
                    </div>
                    <div>
                      <code>mint:</code>&nbsp;
                      <a
                        href={`https://solscan.io/account/${token.mint}?cluster=devnet`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <code>{token.mint}</code>
                      </a>
                    </div>
                    <div>
                      <code>balance: {token.tokenAmount.uiAmount}</code>
                    </div>
                    <div>
                      <code>decimals: {token.tokenAmount.decimals}</code>
                    </div>
                    <div>
                      <code>program: {token.programOwner}</code>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="col-12">
          <ReactJson displayObjectSize={false} name={false} collapsed={1} src={tokenAccountResult} />
        </div>
      </div>
    </div>
  );
};

export default TokenAccountList;
