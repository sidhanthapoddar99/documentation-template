// Client-side share cache
class ShareCache {
  private cache = new Map();
  private ttl = 5 * 60 * 1000; // 5 minutes
  
  async get(objectId, servers) {
    const cached = this.cache.get(objectId);
    if (cached && cached.expires > Date.now()) {
      return cached.shares;
    }
    
    // Fetch from servers
    const shares = await fetchShares(objectId, servers);
    
    this.cache.set(objectId, {
      shares,
      expires: Date.now() + this.ttl
    });
    
    return shares;
  }
}