import React from 'react';
import ReactDOM from 'react-dom/client';
import { NeuralockProvider } from '@neuralock/react';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';
import App from './App';

// Configure chains & providers
const { chains, publicClient } = configureChains(
  [mainnet],
  [publicProvider()]
);

// Create wagmi config
const wagmiConfig = createConfig(
  getDefaultConfig({
    appName: 'My Secure App',
    chains,
    publicClient,
  })
);

// Neuralock configuration
const neuralockConfig = {
  applicationContract: process.env.REACT_APP_CONTRACT_ADDRESS,
  servers: [
    { nftId: 1, importanceFactor: 1.0 },
    { nftId: 2, importanceFactor: 0.8 },
    { nftId: 3, importanceFactor: 0.6 }
  ],
  options: {
    ttl: 600, // 10 minute sessions
    threshold: {
      mode: 'flexible',
      minimum: 2,
      tolerance: 0.2
    },
    cacheEnabled: true,
    autoRefresh: true
  }
};

// Root component with all providers
function Root() {
  return (
    <WagmiConfig config={wagmiConfig}>
      <ConnectKitProvider>
        <NeuralockProvider config={neuralockConfig}>
          <App />
        </NeuralockProvider>
      </ConnectKitProvider>
    </WagmiConfig>
  );
}

// Render app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);

// App.jsx - Main application component
function App() {
  const { initialize, isInitialized } = useNeuralock();
  const { address, isConnected } = useAccount();
  
  useEffect(() => {
    // Auto-initialize when wallet connects
    if (isConnected && !isInitialized) {
      initialize();
    }
  }, [isConnected, isInitialized, initialize]);
  
  return (
    <div className="app">
      <header>
        <h1>My Secure Application</h1>
        <ConnectKitButton />
      </header>
      
      {isConnected ? (
        isInitialized ? (
          <MainContent />
        ) : (
          <div>Initializing Neuralock...</div>
        )
      ) : (
        <div>Please connect your wallet to continue</div>
      )}
    </div>
  );
}