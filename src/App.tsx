import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { FC, ReactNode, useMemo } from 'react';
import CreateFungibleToken from './components/account/CreateFungibleToken';
import MainAccount from './components/account/MainAccount';
import SendToken from './components/account/SendToken';
import TokenAccountList from './components/account/TokenAccountList';

require('./App.css');
require('@solana/wallet-adapter-react-ui/styles.css');

const QUICKNODE_ENDPOINT =
  'https://holy-ancient-shadow.solana-mainnet.discover.quiknode.pro/43bf255cdae69133a8622553fa151052afcd301a/';

const App: FC = () => {
  return (
    <Context>
      <Content />
    </Context>
  );
};
export default App;

const Context: FC<{ children: ReactNode }> = ({ children }) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Mainnet;

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => QUICKNODE_ENDPOINT, []);

  const wallets = useMemo(
    () => [
      /**
       * Wallets that implement either of these standards will be available automatically.
       *
       *   - Solana Mobile Stack Mobile Wallet Adapter Protocol
       *     (https://github.com/solana-mobile/mobile-wallet-adapter)
       *   - Solana Wallet Standard
       *     (https://github.com/solana-labs/wallet-standard)
       *
       * If you wish to support a wallet that supports neither of those standards,
       * instantiate its legacy wallet adapter here. Common legacy adapters can be found
       * in the npm package `@solana/wallet-adapter-wallets`.
       */
      new PhantomWalletAdapter(),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

const Content: FC = () => {
  return (
    <div className="App">
      <div className="aside">
        <WalletMultiButton />
      </div>
      <div className="main">
        <MainAccount />
        <hr className="divider" />
        <TokenAccountList />
        <hr className="divider" />
        <CreateFungibleToken />
        <hr className="divider" />
        <SendToken />
      </div>
    </div>
  );
};
