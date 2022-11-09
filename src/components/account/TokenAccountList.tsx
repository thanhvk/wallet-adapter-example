import { useEffect, useState, useCallback, useMemo } from 'react';
import ReactJson from 'react-json-view';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'

import './styles.css';

const parser = (tokenAccount: any) => {
  if (!tokenAccount) return tokenAccount;

  const parsedAccountInfo = {
    ...tokenAccount.account.data.parsed.info,
    programOwner: tokenAccount.account.owner.toBase58(),
  };

  return parsedAccountInfo;
}

const TokenAccountList = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [tokenAccountResult, setTokenAccountResult] = useState<any>(null);

  const getTokenAccounts = useCallback(async () => {
    if (!publicKey) return null;

    const result = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      {
        programId: TOKEN_PROGRAM_ID,
      }
    );

    setTokenAccountResult(result);
  }, [connection, publicKey]);

  useEffect(() => {
    getTokenAccounts();
  }, [getTokenAccounts]);

  const parsedTokenAccounts = useMemo(() => {
    if (!tokenAccountResult) return tokenAccountResult;

    return tokenAccountResult.value.map((token: any) => {
      return parser(token);
    })
  }, [tokenAccountResult]);

  if (!tokenAccountResult) return null;

  return (
  <div>
    <div className='method'><code className='method highlight'>getParsedTokenAccountsByOwner</code></div>

    <div className='row'>
      <div className='col-12'>
        {parsedTokenAccounts.map((token: any, idx: number) => {
          return (
            <div key={idx} className='token-account-item'>
              <div><code>{token.mint}</code></div>
              <div><code>{token.tokenAmount.uiAmount}</code></div>
            </div>
          );
        })}
      </div>
      <div className='col-12'>
        <ReactJson displayObjectSize={false} name={false} collapsed={1} src={tokenAccountResult} />
      </div>
    </div>
  </div>
  );
};

export default TokenAccountList;
