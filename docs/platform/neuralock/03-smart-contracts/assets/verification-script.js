const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Verification script for multiple networks
async function verifyContracts(network) {
  console.log(`Verifying contracts on ${network}...`);
  
  // Load deployment info
  const deploymentPath = path.join(__dirname, `../deployments/${network}.json`);
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`No deployment found for ${network}`);
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  
  // API endpoints
  const apiEndpoints = {
    mainnet: 'https://api.etherscan.io/api',
    sepolia: 'https://api-sepolia.etherscan.io/api',
    goerli: 'https://api-goerli.etherscan.io/api',
    polygon: 'https://api.polygonscan.com/api',
    'polygon-mumbai': 'https://api-testnet.polygonscan.com/api',
    arbitrum: 'https://api.arbiscan.io/api',
    'arbitrum-goerli': 'https://api-goerli.arbiscan.io/api'
  };
  
  const apiUrl = apiEndpoints[network];
  const apiKey = process.env[`${network.toUpperCase().replace('-', '_')}_SCAN_API_KEY`] || 
                 process.env.ETHERSCAN_API_KEY;
  
  if (!apiUrl || !apiKey) {
    throw new Error(`No API configuration for ${network}`);
  }
  
  // Contracts to verify
  const contracts = [
    {
      name: 'NeuralockRegistry',
      address: deployment.contracts.registry,
      constructorArgs: [
        deployment.configuration.initialOwner,
        deployment.contracts.metadata,
        deployment.configuration.verificationThreshold
      ]
    },
    {
      name: 'NeuralockMetadata',
      address: deployment.contracts.metadata,
      constructorArgs: [deployment.configuration.baseMetadataURI]
    },
    {
      name: 'NeuralockAccessControl',
      address: deployment.contracts.accessControl,
      constructorArgs: []
    }
  ];
  
  // Add example contracts if deployed
  if (deployment.contracts.examples) {
    if (deployment.contracts.examples.simpleNFTVault) {
      contracts.push({
        name: 'SimpleNFTVault',
        address: deployment.contracts.examples.simpleNFTVault,
        constructorArgs: []
      });
    }
  }
  
  // Verify each contract
  for (const contract of contracts) {
    console.log(`\nVerifying ${contract.name} at ${contract.address}...`);
    
    try {
      // Get contract source code and metadata
      const contractPath = path.join(__dirname, `../build/contracts/${contract.name}.json`);
      const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
      
      // Prepare verification request
      const verificationData = {
        apikey: apiKey,
        module: 'contract',
        action: 'verifysourcecode',
        contractaddress: contract.address,
        sourceCode: JSON.stringify({
          language: 'Solidity',
          sources: await getSourceCode(contract.name),
          settings: {
            optimizer: {
              enabled: true,
              runs: 1000
            },
            outputSelection: {
              '*': {
                '*': ['metadata', 'evm.bytecode', 'evm.deployedBytecode']
              }
            }
          }
        }),
        codeformat: 'solidity-standard-json-input',
        contractname: `contracts/${getContractPath(contract.name)}:${contract.name}`,
        compilerversion: `v${contractData.compiler.version}`,
        optimizationUsed: '1',
        runs: '1000',
        constructorArguements: encodeConstructorArgs(contract.constructorArgs, contractData.abi)
      };
      
      // Submit verification
      const response = await axios.post(apiUrl, null, { params: verificationData });
      
      if (response.data.status === '1') {
        console.log(`✓ Verification submitted. GUID: ${response.data.result}`);
        
        // Check verification status
        await checkVerificationStatus(apiUrl, apiKey, response.data.result, contract.name);
      } else {
        console.error(`✗ Verification failed: ${response.data.result}`);
      }
      
    } catch (error) {
      console.error(`✗ Error verifying ${contract.name}:`, error.message);
    }
  }
}

// Get source code for contract
async function getSourceCode(contractName) {
  const sources = {};
  const contractsDir = path.join(__dirname, '../contracts');
  
  // Map contract names to file paths
  const contractPaths = {
    'NeuralockRegistry': 'core/NeuralockRegistry.sol',
    'NeuralockAccessControl': 'core/NeuralockAccessControl.sol',
    'NeuralockMetadata': 'core/NeuralockMetadata.sol',
    'SimpleNFTVault': 'examples/SimpleNFTVault.sol',
    'MultiSigVault': 'examples/MultiSigVault.sol',
    'TimeLockVault': 'examples/TimeLockVault.sol'
  };
  
  // Read all required source files
  const filesToRead = [
    contractPaths[contractName],
    'interfaces/INeuralock.sol',
    'interfaces/INeuralockRegistry.sol',
    'interfaces/INeuralockMetadata.sol',
    'libraries/NeuralockConstants.sol',
    'libraries/NeuralockErrors.sol'
  ];
  
  for (const file of filesToRead) {
    const filePath = path.join(contractsDir, file);
    if (fs.existsSync(filePath)) {
      sources[`contracts/${file}`] = {
        content: fs.readFileSync(filePath, 'utf8')
      };
    }
  }
  
  // Add OpenZeppelin imports if needed
  const ozDir = path.join(__dirname, '../node_modules/@openzeppelin/contracts');
  const ozImports = [
    'token/ERC721/ERC721.sol',
    'access/Ownable.sol',
    'security/ReentrancyGuard.sol',
    'proxy/utils/UUPSUpgradeable.sol'
  ];
  
  for (const ozFile of ozImports) {
    const ozPath = path.join(ozDir, ozFile);
    if (fs.existsSync(ozPath)) {
      sources[`@openzeppelin/contracts/${ozFile}`] = {
        content: fs.readFileSync(ozPath, 'utf8')
      };
    }
  }
  
  return sources;
}

// Get contract file path
function getContractPath(contractName) {
  const paths = {
    'NeuralockRegistry': 'core/NeuralockRegistry.sol',
    'NeuralockAccessControl': 'core/NeuralockAccessControl.sol',
    'NeuralockMetadata': 'core/NeuralockMetadata.sol',
    'SimpleNFTVault': 'examples/SimpleNFTVault.sol',
    'MultiSigVault': 'examples/MultiSigVault.sol',
    'TimeLockVault': 'examples/TimeLockVault.sol'
  };
  return paths[contractName] || `${contractName}.sol`;
}

// Encode constructor arguments
function encodeConstructorArgs(args, abi) {
  const Web3 = require('web3');
  const web3 = new Web3();
  
  const constructor = abi.find(item => item.type === 'constructor');
  if (!constructor || args.length === 0) return '';
  
  return web3.eth.abi.encodeParameters(
    constructor.inputs.map(input => input.type),
    args
  ).slice(2); // Remove 0x prefix
}

// Check verification status
async function checkVerificationStatus(apiUrl, apiKey, guid, contractName) {
  console.log(`Checking verification status for ${contractName}...`);
  
  let attempts = 0;
  const maxAttempts = 30;
  const delay = 5000; // 5 seconds
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, delay));
    
    const response = await axios.get(apiUrl, {
      params: {
        apikey: apiKey,
        module: 'contract',
        action: 'checkverifystatus',
        guid: guid
      }
    });
    
    if (response.data.status === '1') {
      console.log(`✓ ${contractName} verified successfully!`);
      return true;
    } else if (response.data.result.includes('Pending')) {
      process.stdout.write('.');
      attempts++;
    } else {
      console.error(`\n✗ Verification failed: ${response.data.result}`);
      return false;
    }
  }
  
  console.error(`\n✗ Verification timeout for ${contractName}`);
  return false;
}

// Main execution
if (require.main === module) {
  const network = process.argv[2];
  
  if (!network) {
    console.error('Usage: node verify.js <network>');
    console.error('Example: node verify.js sepolia');
    process.exit(1);
  }
  
  verifyContracts(network)
    .then(() => console.log('\nVerification complete!'))
    .catch(error => {
      console.error('\nVerification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyContracts };