# Server-side permission cache
class PermissionCache:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.ttl = 300  # 5 minutes
    
    async def check_permission(self, user, object_id, contract):
        # Check cache first
        cache_key = f"perm:{user}:{object_id}:{contract}"
        cached = await self.redis.get(cache_key)
        
        if cached is not None:
            return int(cached)
        
        # Query blockchain
        permission = await query_blockchain(user, object_id, contract)
        
        # Cache result
        await self.redis.setex(cache_key, self.ttl, permission)
        
        return permission