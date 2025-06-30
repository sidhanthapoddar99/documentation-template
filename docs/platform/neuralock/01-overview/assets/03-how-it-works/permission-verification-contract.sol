// Server calls the application contract
uint8 permission = INeuralock(appContract).neuralock(
    userAddress,
    objectId
);

// Permission levels:
// 0 = No access
// 1 = Read only
// 2 = Write only
// 3 = Read + Write

require(permission >= 2, "Write permission required");