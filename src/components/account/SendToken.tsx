import { ChangeEvent, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';

import './styles.css';
import { getTxTransferToken } from '../../utils/token';

type FormValue = {
  receiver: string;
  tokenAccount: string;
  mint: string;
  amount: number;
  decimals: number;
};

const SendToken = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [signature, setSignature] = useState<string | undefined>();

  const [formValue, setFormValue] = useState<FormValue>({
    receiver: '',
    tokenAccount: '5EuQkARF6bZjTTWaEp1UfUcmdjGx2vQYpVDG5aMiakTs',
    mint: 'DSkswkeLKPL8coYXq6bggU7VyC8bXstXo8RDPm8pYLno',
    amount: 1,
    decimals: 6,
  });

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormValue((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const onSendToken = async () => {
    if (!publicKey) return;

    try {
      const tx: Transaction = await getTxTransferToken(
        connection,
        publicKey,
        new PublicKey(formValue.mint),
        new PublicKey(formValue.receiver),
        new PublicKey(formValue.tokenAccount),
        formValue.amount * 10 ** formValue.decimals
      );

      const {
        context: { slot: minContextSlot },
        value: { blockhash },
      } = await connection.getLatestBlockhashAndContext();

      tx.feePayer = publicKey;
      tx.recentBlockhash = blockhash;

      const sig = await sendTransaction(tx, connection, { minContextSlot });
      setSignature(sig);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="send-token">
      <div className="section-header">
        <code className="method highlight">Send token</code>
      </div>

      {!!signature && (
        <div>
          <code>
            View tx:{' '}
            <a href={`https://solscan.io/tx/${signature}?cluster=devnet`} target="_blank" rel="noreferrer">
              {signature}
            </a>
          </code>
        </div>
      )}

      <div>
        <code className="input-label">Receiver</code>
        <input
          name="receiver"
          className="input-styled"
          placeholder="receiver"
          value={formValue.receiver}
          onChange={onChange}
        />
      </div>

      <div>
        <code className="input-label">Token Amount</code>
        <input
          name="tokenAmount"
          className="input-styled"
          placeholder="token account"
          value={formValue.tokenAccount}
          onChange={onChange}
        />
      </div>

      <div>
        <code className="input-label">Mint</code>
        <input name="mint" className="input-styled" placeholder="mint" value={formValue.mint} onChange={onChange} />
      </div>

      <div>
        <code className="input-label">Amount</code>
        <input
          name="amount"
          type="number"
          className="input-styled"
          placeholder="amount"
          value={formValue.amount}
          onChange={onChange}
        />
      </div>

      <div>
        <code className="input-label">Decimals</code>
        <input
          name="decimals"
          type="number"
          className="input-styled"
          placeholder="decimals"
          value={formValue.decimals}
          onChange={onChange}
        />
      </div>

      <div>
        <button className="btn" onClick={onSendToken}>
          Send Token
        </button>
      </div>
    </div>
  );
};

export default SendToken;
