// Connection pool for server communication
class ServerConnectionPool {
  private pools = new Map();
  
  getConnection(server) {
    if (!this.pools.has(server.id)) {
      this.pools.set(server.id, {
        connections: [],
        maxSize: 10,
        timeout: 30000
      });
    }
    
    const pool = this.pools.get(server.id);
    
    // Reuse existing connection or create new
    return pool.connections.pop() || 
           this.createConnection(server);
  }
}