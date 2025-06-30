async function setupRoles(registry, config) {
  console.log("Setting up roles...");
  
  // Add administrators
  for (const admin of config.admins) {
    await registry.addAdmin(admin);
    console.log(`✓ Admin added: ${admin}`);
  }
  
  // Add managers
  for (const manager of config.managers) {
    await registry.addManager(manager);
    console.log(`✓ Manager added: ${manager}`);
  }
  
  // Set verification threshold
  await registry.setVerificationThreshold(config.verificationThreshold);
  console.log(`✓ Verification threshold set to: ${config.verificationThreshold}`);
  
  // Transfer ownership to multi-sig
  if (config.multiSigOwner) {
    await registry.transferOwnership(config.multiSigOwner);
    console.log(`✓ Ownership transferred to: ${config.multiSigOwner}`);
  }
}