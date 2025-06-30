const NeuralockRegistry = artifacts.require("NeuralockRegistry");
const NeuralockAccessControl = artifacts.require("NeuralockAccessControl");
const NeuralockMetadata = artifacts.require("NeuralockMetadata");

// Example contracts (optional)
const SimpleNFTVault = artifacts.require("SimpleNFTVault");
const MultiSigVault = artifacts.require("MultiSigVault");
const TimeLockVault = artifacts.require("TimeLockVault");

module.exports = async function(deployer, network, accounts) {
  console.log(`Deploying to ${network} network...`);
  console.log(`Deployer account: ${accounts[0]}`);
  
  // Deploy configuration
  const config = {
    initialOwner: process.env.INITIAL_OWNER || accounts[0],
    verificationThreshold: process.env.VERIFICATION_THRESHOLD || 2,
    baseMetadataURI: process.env.BASE_METADATA_URI || "https://api.neuralock.io/metadata/",
    admins: process.env.INITIAL_ADMINS ? process.env.INITIAL_ADMINS.split(',') : [],
    managers: process.env.INITIAL_MANAGERS ? process.env.INITIAL_MANAGERS.split(',') : []
  };
  
  try {
    // 1. Deploy AccessControl
    console.log("\n1. Deploying AccessControl...");
    await deployer.deploy(NeuralockAccessControl);
    const accessControl = await NeuralockAccessControl.deployed();
    console.log(`✓ AccessControl deployed at: ${accessControl.address}`);
    
    // 2. Deploy Metadata contract
    console.log("\n2. Deploying Metadata...");
    await deployer.deploy(NeuralockMetadata, config.baseMetadataURI);
    const metadata = await NeuralockMetadata.deployed();
    console.log(`✓ Metadata deployed at: ${metadata.address}`);
    
    // 3. Deploy Registry (main contract)
    console.log("\n3. Deploying Registry...");
    await deployer.deploy(
      NeuralockRegistry,
      config.initialOwner,
      metadata.address,
      config.verificationThreshold
    );
    const registry = await NeuralockRegistry.deployed();
    console.log(`✓ Registry deployed at: ${registry.address}`);
    
    // 4. Link contracts
    console.log("\n4. Linking contracts...");
    await metadata.setRegistry(registry.address);
    console.log("✓ Metadata linked to Registry");
    
    // 5. Set up initial roles
    console.log("\n5. Setting up roles...");
    
    // Add admins
    for (const admin of config.admins) {
      if (admin && admin !== '0x0000000000000000000000000000000000000000') {
        await registry.addAdmin(admin);
        console.log(`✓ Admin added: ${admin}`);
      }
    }
    
    // Add managers
    for (const manager of config.managers) {
      if (manager && manager !== '0x0000000000000000000000000000000000000000') {
        await registry.addManager(manager);
        console.log(`✓ Manager added: ${manager}`);
      }
    }
    
    // 6. Deploy example contracts (if requested)
    if (process.env.DEPLOY_EXAMPLES === 'true') {
      console.log("\n6. Deploying example contracts...");
      
      await deployer.deploy(SimpleNFTVault);
      const nftVault = await SimpleNFTVault.deployed();
      console.log(`✓ SimpleNFTVault deployed at: ${nftVault.address}`);
      
      await deployer.deploy(
        MultiSigVault, 
        [accounts[0], accounts[1], accounts[2]], 
        2
      );
      const multiSig = await MultiSigVault.deployed();
      console.log(`✓ MultiSigVault deployed at: ${multiSig.address}`);
      
      await deployer.deploy(TimeLockVault);
      const timeLock = await TimeLockVault.deployed();
      console.log(`✓ TimeLockVault deployed at: ${timeLock.address}`);
    }
    
    // 7. Save deployment info
    const deploymentInfo = {
      network: network,
      contracts: {
        registry: registry.address,
        accessControl: accessControl.address,
        metadata: metadata.address,
        examples: process.env.DEPLOY_EXAMPLES === 'true' ? {
          simpleNFTVault: nftVault?.address,
          multiSigVault: multiSig?.address,
          timeLockVault: timeLock?.address
        } : {}
      },
      configuration: {
        initialOwner: config.initialOwner,
        verificationThreshold: config.verificationThreshold,
        baseMetadataURI: config.baseMetadataURI,
        admins: config.admins,
        managers: config.managers
      },
      deployedAt: new Date().toISOString(),
      deployedBy: accounts[0],
      blockNumber: await web3.eth.getBlockNumber()
    };
    
    const fs = require('fs');
    const path = require('path');
    const deploymentsDir = path.join(__dirname, '../deployments');
    
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir);
    }
    
    fs.writeFileSync(
      path.join(deploymentsDir, `${network}.json`),
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\n=================================");
    console.log("Deployment Summary");
    console.log("=================================");
    console.log(`Network: ${network}`);
    console.log(`Registry: ${registry.address}`);
    console.log(`Metadata: ${metadata.address}`);
    console.log(`Owner: ${config.initialOwner}`);
    console.log(`Admins: ${config.admins.length}`);
    console.log(`Managers: ${config.managers.length}`);
    console.log("=================================\n");
    
  } catch (error) {
    console.error("Deployment failed:", error);
    throw error;
  }
};