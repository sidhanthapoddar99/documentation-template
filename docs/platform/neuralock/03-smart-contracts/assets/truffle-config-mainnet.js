// truffle-config.js - Mainnet configuration
module.exports = {
  networks: {
    mainnet: {
      provider: () => new HDWalletProvider({
        mnemonic: process.env.MAINNET_MNEMONIC,
        providerOrUrl: process.env.MAINNET_RPC_URL,
        addressIndex: 0,
        numberOfAddresses: 3, // Limited for security
      }),
      network_id: 1,
      gas: 8000000,
      gasPrice: 30000000000, // 30 gwei
      confirmations: 2,      // Wait for 2 confirmations
      timeoutBlocks: 200,    // # of blocks before timeout
      skipDryRun: false,     // Always do dry run first
      production: true,
    }
  },
  
  // Compiler settings for production
  compilers: {
    solc: {
      version: "0.8.19",
      settings: {
        optimizer: {
          enabled: true,
          runs: 1000, // Optimized for function calls
        },
        viaIR: true, // Enable IR-based optimizer
      }
    }
  }
};