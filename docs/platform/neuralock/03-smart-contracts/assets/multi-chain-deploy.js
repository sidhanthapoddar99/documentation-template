const networks = [
  { name: 'ethereum', rpc: process.env.ETH_RPC },
  { name: 'polygon', rpc: process.env.POLYGON_RPC },
  { name: 'arbitrum', rpc: process.env.ARB_RPC },
];

async function deployMultiChain() {
  const deployments = {};
  
  for (const network of networks) {
    console.log(`Deploying to ${network.name}...`);
    
    const result = await deploy(network);
    deployments[network.name] = {
      registry: result.registry,
      metadata: result.metadata,
      blockNumber: result.blockNumber,
      txHash: result.txHash
    };
    
    console.log(`✓ Deployed to ${network.name}`);
  }
  
  // Save deployment addresses
  fs.writeFileSync(
    'deployments.json',
    JSON.stringify(deployments, null, 2)
  );
  
  return deployments;
}