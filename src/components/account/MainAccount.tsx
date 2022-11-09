import { useEffect, useState, useCallback } from 'react';
import ReactJson from 'react-json-view';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

import './styles.css';

const parser = (accountInfo: any) => {
  if (!accountInfo) return accountInfo;

  const parsedAccountInfo = {...accountInfo};
  parsedAccountInfo.owner = parsedAccountInfo?.owner?.toBase58();  
  return parsedAccountInfo;
}

const MainAccount = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [accountInfo, setAccountInfo] = useState<any>(null);

  const getAccountInfo = useCallback(async () => {
    if (!publicKey) return null;

    const result = await connection.getAccountInfo(publicKey);
    setAccountInfo(result);
  }, [connection, publicKey]);

  useEffect(() => {
    getAccountInfo();
  }, [getAccountInfo]);

  if (!accountInfo) return null;

  return (
  <div>
    <div className='method'><code className='method highlight'>getAccountInfo</code></div>

    <div className='row'>
      <div className='col-12'>
        <ReactJson displayObjectSize={false} name={false} collapsed={1} src={parser(accountInfo)} />
      </div>
      <div className='col-12'>
        <ReactJson displayObjectSize={false} name={false} collapsed={1} src={accountInfo} />
      </div>
    </div>
  </div>
  );
};

export default MainAccount;
