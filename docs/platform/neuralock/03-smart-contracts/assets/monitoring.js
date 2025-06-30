const Web3 = require('web3');
const registryABI = require('./build/contracts/NeuralockRegistry.json').abi;

async function setupMonitoring(registryAddress, rpcUrl) {
  const web3 = new Web3(rpcUrl);
  const registry = new web3.eth.Contract(registryABI, registryAddress);
  
  // Monitor role changes
  registry.events.OwnerAdded()
    .on('data', event => {
      console.log('Owner added:', event.returnValues);
      // Send alert
    });
  
  registry.events.ServerMinted()
    .on('data', event => {
      console.log('New server registered:', event.returnValues);
      // Update database
    });
  
  registry.events.ServerVerified()
    .on('data', event => {
      console.log('Server verified:', event.returnValues);
      // Notify server operator
    });
  
  console.log('✓ Monitoring active for:', registryAddress);
}