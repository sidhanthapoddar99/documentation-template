from neuralock import NeuralockClient, ThresholdConfig, SessionStorage
from typing import Dict, List, Optional, Set
import asyncio
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import json
import uuid

# Multi-tenant configuration
class TenantIsolationLevel(Enum):
    STRICT = "strict"          # Complete isolation
    SHARED = "shared"          # Can share with consent
    FEDERATED = "federated"    # Cross-tenant federation

@dataclass
class Tenant:
    id: str
    name: str
    isolation_level: TenantIsolationLevel
    encryption_servers: List[int]  # NFT IDs for this tenant
    created_at: datetime
    settings: Dict

@dataclass
class TenantUser:
    id: str
    tenant_id: str
    email: str
    role: str
    permissions: Set[str]

# Multi-tenant Neuralock manager
class MultiTenantNeuralock:
    def __init__(self, base_config: Dict):
        self.base_config = base_config
        self.tenant_clients: Dict[str, NeuralockClient] = {}
        self.tenant_registry: Dict[str, Tenant] = {}
        self.cross_tenant_shares: Dict[str, List[str]] = {}
        
    async def create_tenant(
        self, 
        tenant_name: str,
        isolation_level: TenantIsolationLevel = TenantIsolationLevel.STRICT,
        server_allocation: Optional[List[int]] = None
    ) -> Tenant:
        """Create a new tenant with dedicated encryption configuration"""
        
        tenant_id = f"tenant-{uuid.uuid4()}"
        
        # Allocate servers for this tenant
        if not server_allocation:
            # Auto-allocate from available pool
            server_allocation = await self.allocate_servers_for_tenant(isolation_level)
        
        tenant = Tenant(
            id=tenant_id,
            name=tenant_name,
            isolation_level=isolation_level,
            encryption_servers=server_allocation,
            created_at=datetime.utcnow(),
            settings={
                "data_retention_days": 365,
                "require_mfa": True,
                "audit_enabled": True,
                "encryption_key_rotation_days": 90
            }
        )
        
        # Create tenant-specific Neuralock client
        tenant_client = await self._create_tenant_client(tenant)
        
        self.tenant_clients[tenant_id] = tenant_client
        self.tenant_registry[tenant_id] = tenant
        
        # Initialize tenant storage
        await self._initialize_tenant_storage(tenant_id)
        
        return tenant
    
    async def _create_tenant_client(self, tenant: Tenant) -> NeuralockClient:
        """Create isolated Neuralock client for tenant"""
        
        # Tenant-specific configuration
        servers = [
            {"nft_id": nft_id, "importance_factor": 1.0}
            for nft_id in tenant.encryption_servers
        ]
        
        # Create isolated session storage
        session_storage = await self._create_tenant_session_storage(tenant.id)
        
        client = NeuralockClient(
            application_contract=f"{self.base_config['contract_base']}-{tenant.id}",
            private_key=await self._get_tenant_private_key(tenant.id),
            servers=servers,
            web3_provider=self.base_config['web3_provider'],
            threshold_config=ThresholdConfig(
                mode="flexible" if tenant.isolation_level != TenantIsolationLevel.STRICT else "strict",
                minimum=len(servers) - 1  # N-1 threshold
            ),
            session_storage=session_storage,
            async_mode=True
        )
        
        await client.ainitialize()
        return client
    
    async def get_tenant_client(self, tenant_id: str) -> NeuralockClient:
        """Get Neuralock client for specific tenant"""
        
        if tenant_id not in self.tenant_clients:
            raise ValueError(f"Tenant {tenant_id} not found")
        
        return self.tenant_clients[tenant_id]
    
    # Tenant data operations
    async def encrypt_tenant_data(
        self,
        tenant_id: str,
        user_id: str,
        data: str,
        object_type: str,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """Encrypt data for a specific tenant"""
        
        client = await self.get_tenant_client(tenant_id)
        
        # Generate tenant-scoped object ID
        object_id = f"{tenant_id}:{object_type}:{uuid.uuid4()}"
        
        # Add tenant metadata
        full_data = {
            "data": data,
            "metadata": {
                "tenant_id": tenant_id,
                "user_id": user_id,
                "object_type": object_type,
                "created_at": datetime.utcnow().isoformat(),
                **(metadata or {})
            }
        }
        
        # Encrypt with tenant's client
        encrypted = await client.aencrypt(
            json.dumps(full_data),
            object_id
        )
        
        # Store reference in tenant's database
        await self._store_tenant_object(tenant_id, {
            "object_id": object_id,
            "type": object_type,
            "user_id": user_id,
            "encrypted_data": encrypted.to_dict(),
            "created_at": datetime.utcnow()
        })
        
        return {
            "object_id": object_id,
            "tenant_id": tenant_id,
            "encrypted": True
        }
    
    async def decrypt_tenant_data(
        self,
        tenant_id: str,
        user_id: str,
        object_id: str
    ) -> Dict:
        """Decrypt data ensuring tenant isolation"""
        
        # Verify object belongs to tenant
        if not object_id.startswith(f"{tenant_id}:"):
            raise PermissionError("Access denied - wrong tenant")
        
        # Verify user belongs to tenant
        if not await self._verify_user_tenant(user_id, tenant_id):
            raise PermissionError("User not in tenant")
        
        client = await self.get_tenant_client(tenant_id)
        
        # Fetch encrypted data
        encrypted_obj = await self._fetch_tenant_object(tenant_id, object_id)
        encrypted_data = EncryptedData.from_dict(encrypted_obj["encrypted_data"])
        
        # Decrypt
        decrypted_json = await client.adecrypt(encrypted_data, object_id)
        decrypted = json.loads(decrypted_json)
        
        return decrypted["data"]
    
    # Cross-tenant sharing
    async def share_across_tenants(
        self,
        source_tenant_id: str,
        target_tenant_id: str,
        object_id: str,
        sharer_user_id: str,
        permissions: List[str] = ["read"],
        expires_at: Optional[datetime] = None
    ) -> str:
        """Share data between tenants with consent"""
        
        source_tenant = self.tenant_registry[source_tenant_id]
        target_tenant = self.tenant_registry[target_tenant_id]
        
        # Check isolation levels
        if source_tenant.isolation_level == TenantIsolationLevel.STRICT:
            raise ValueError("Source tenant has strict isolation")
        
        if target_tenant.isolation_level == TenantIsolationLevel.STRICT:
            raise ValueError("Target tenant has strict isolation")
        
        # Create share record
        share_id = f"share-{uuid.uuid4()}"
        share_record = {
            "id": share_id,
            "source_tenant": source_tenant_id,
            "target_tenant": target_tenant_id,
            "object_id": object_id,
            "shared_by": sharer_user_id,
            "permissions": permissions,
            "created_at": datetime.utcnow(),
            "expires_at": expires_at
        }
        
        # If federated, create a federated copy
        if source_tenant.isolation_level == TenantIsolationLevel.FEDERATED:
            # Decrypt with source tenant
            source_client = await self.get_tenant_client(source_tenant_id)
            encrypted_obj = await self._fetch_tenant_object(source_tenant_id, object_id)
            decrypted = await source_client.adecrypt(
                EncryptedData.from_dict(encrypted_obj["encrypted_data"]),
                object_id
            )
            
            # Re-encrypt with target tenant
            target_client = await self.get_tenant_client(target_tenant_id)
            federated_object_id = f"{target_tenant_id}:federated:{object_id}"
            federated_encrypted = await target_client.aencrypt(
                decrypted,
                federated_object_id
            )
            
            # Store federated copy
            await self._store_tenant_object(target_tenant_id, {
                "object_id": federated_object_id,
                "type": "federated",
                "original_object_id": object_id,
                "source_tenant": source_tenant_id,
                "encrypted_data": federated_encrypted.to_dict(),
                "share_id": share_id
            })
        else:
            # For shared isolation, grant cross-tenant permissions
            source_client = await self.get_tenant_client(source_tenant_id)
            
            # Grant permissions to target tenant's service account
            target_service_account = await self._get_tenant_service_account(target_tenant_id)
            await source_client.aupdate_permissions(object_id, {
                "add": {
                    target_service_account: permissions
                }
            })
        
        # Store share record
        await self._store_share_record(share_record)
        
        return share_id
    
    # Tenant management
    async def migrate_tenant_data(
        self,
        tenant_id: str,
        new_servers: List[int],
        migration_strategy: str = "gradual"
    ):
        """Migrate tenant data to new encryption servers"""
        
        tenant = self.tenant_registry[tenant_id]
        old_client = self.tenant_clients[tenant_id]
        
        # Create new client with new servers
        new_tenant = Tenant(
            **{**tenant.__dict__, "encryption_servers": new_servers}
        )
        new_client = await self._create_tenant_client(new_tenant)
        
        # Fetch all tenant objects
        objects = await self._list_tenant_objects(tenant_id)
        
        if migration_strategy == "gradual":
            # Migrate in batches
            batch_size = 100
            for i in range(0, len(objects), batch_size):
                batch = objects[i:i + batch_size]
                await self._migrate_batch(
                    tenant_id, 
                    batch, 
                    old_client, 
                    new_client
                )
                
                # Update progress
                progress = (i + len(batch)) / len(objects) * 100
                await self._update_migration_progress(tenant_id, progress)
                
        elif migration_strategy == "immediate":
            # Migrate all at once
            await self._migrate_batch(
                tenant_id,
                objects,
                old_client,
                new_client
            )
        
        # Update tenant registry
        self.tenant_registry[tenant_id] = new_tenant
        self.tenant_clients[tenant_id] = new_client
        
        # Cleanup old client
        await old_client.aclose()
    
    async def _migrate_batch(
        self,
        tenant_id: str,
        objects: List[Dict],
        old_client: NeuralockClient,
        new_client: NeuralockClient
    ):
        """Migrate a batch of objects between clients"""
        
        for obj in objects:
            try:
                # Decrypt with old client
                encrypted_data = EncryptedData.from_dict(obj["encrypted_data"])
                decrypted = await old_client.adecrypt(
                    encrypted_data,
                    obj["object_id"]
                )
                
                # Re-encrypt with new client
                new_encrypted = await new_client.aencrypt(
                    decrypted,
                    obj["object_id"]
                )
                
                # Update stored object
                obj["encrypted_data"] = new_encrypted.to_dict()
                await self._update_tenant_object(tenant_id, obj)
                
                # Revoke access from old encryption
                await old_client.arevoke_access(obj["object_id"])
                
            except Exception as e:
                # Log migration error
                await self._log_migration_error(tenant_id, obj["object_id"], str(e))
    
    # Compliance and auditing
    async def audit_tenant_access(
        self,
        tenant_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict]:
        """Generate access audit report for tenant"""
        
        audit_logs = await self._fetch_tenant_audit_logs(
            tenant_id,
            start_date,
            end_date
        )
        
        # Analyze access patterns
        access_summary = {
            "total_accesses": len(audit_logs),
            "unique_users": len(set(log["user_id"] for log in audit_logs)),
            "access_by_type": {},
            "cross_tenant_shares": [],
            "failed_attempts": []
        }
        
        for log in audit_logs:
            # Count by type
            access_type = log.get("type", "unknown")
            access_summary["access_by_type"][access_type] = \
                access_summary["access_by_type"].get(access_type, 0) + 1
            
            # Track cross-tenant shares
            if log.get("cross_tenant"):
                access_summary["cross_tenant_shares"].append({
                    "object_id": log["object_id"],
                    "shared_with": log["target_tenant"],
                    "timestamp": log["timestamp"]
                })
            
            # Track failures
            if log.get("status") == "failed":
                access_summary["failed_attempts"].append({
                    "user_id": log["user_id"],
                    "object_id": log["object_id"],
                    "reason": log["error"],
                    "timestamp": log["timestamp"]
                })
        
        return access_summary
    
    async def enforce_data_retention(self, tenant_id: str):
        """Enforce data retention policies for tenant"""
        
        tenant = self.tenant_registry[tenant_id]
        retention_days = tenant.settings.get("data_retention_days", 365)
        cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
        
        # Find objects older than retention period
        old_objects = await self._find_tenant_objects_before(
            tenant_id,
            cutoff_date
        )
        
        client = await self.get_tenant_client(tenant_id)
        
        for obj in old_objects:
            try:
                # Revoke access
                await client.arevoke_access(obj["object_id"])
                
                # Delete from storage
                await self._delete_tenant_object(tenant_id, obj["object_id"])
                
                # Log deletion
                await self._log_retention_deletion(
                    tenant_id,
                    obj["object_id"],
                    obj["created_at"]
                )
                
            except Exception as e:
                # Log error but continue
                print(f"Error deleting {obj['object_id']}: {e}")
    
    # Helper methods
    async def allocate_servers_for_tenant(
        self,
        isolation_level: TenantIsolationLevel
    ) -> List[int]:
        """Allocate encryption servers based on isolation level"""
        
        available_servers = await self._get_available_servers()
        
        if isolation_level == TenantIsolationLevel.STRICT:
            # Allocate dedicated servers
            return available_servers[:4]  # 4 dedicated servers
        elif isolation_level == TenantIsolationLevel.SHARED:
            # Use shared pool
            return [1, 2, 3]  # Shared servers
        else:  # FEDERATED
            # Use federation servers
            return [10, 11, 12, 13]  # Federation pool
    
    async def _create_tenant_session_storage(self, tenant_id: str):
        """Create isolated session storage for tenant"""
        from neuralock import RedisStorage
        
        return RedisStorage(
            host="localhost",
            port=6379,
            db=hash(tenant_id) % 16,  # Separate Redis DB per tenant
            key_prefix=f"tenant:{tenant_id}:"
        )
    
    async def _get_tenant_private_key(self, tenant_id: str) -> str:
        """Get or generate tenant-specific private key"""
        # In production, use HSM or key management service
        # This is a simplified example
        return f"0x{tenant_id.replace('-', '')[:64]}"
    
    async def _verify_user_tenant(self, user_id: str, tenant_id: str) -> bool:
        """Verify user belongs to tenant"""
        # Implementation depends on your user management system
        return True
    
    # Storage methods (implement based on your backend)
    async def _initialize_tenant_storage(self, tenant_id: str): pass
    async def _store_tenant_object(self, tenant_id: str, obj: Dict): pass
    async def _fetch_tenant_object(self, tenant_id: str, object_id: str): pass
    async def _update_tenant_object(self, tenant_id: str, obj: Dict): pass
    async def _delete_tenant_object(self, tenant_id: str, object_id: str): pass
    async def _list_tenant_objects(self, tenant_id: str): pass
    async def _find_tenant_objects_before(self, tenant_id: str, date: datetime): pass
    async def _store_share_record(self, record: Dict): pass
    async def _get_tenant_service_account(self, tenant_id: str): pass
    async def _fetch_tenant_audit_logs(self, tenant_id: str, start: datetime, end: datetime): pass
    async def _log_migration_error(self, tenant_id: str, object_id: str, error: str): pass
    async def _log_retention_deletion(self, tenant_id: str, object_id: str, created_at: datetime): pass
    async def _update_migration_progress(self, tenant_id: str, progress: float): pass
    async def _get_available_servers(self): pass

# Example usage with FastAPI
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Multi-Tenant Neuralock API")

# Initialize multi-tenant manager
mt_manager = MultiTenantNeuralock({
    "contract_base": "0x1234",
    "web3_provider": "https://mainnet.infura.io/v3/YOUR_KEY"
})

class TenantCreate(BaseModel):
    name: str
    isolation_level: str = "strict"

class DataEncrypt(BaseModel):
    data: str
    object_type: str
    metadata: Optional[Dict] = None

@app.post("/tenants")
async def create_tenant(tenant_data: TenantCreate):
    """Create a new tenant"""
    tenant = await mt_manager.create_tenant(
        tenant_data.name,
        TenantIsolationLevel(tenant_data.isolation_level)
    )
    return {
        "tenant_id": tenant.id,
        "name": tenant.name,
        "servers": tenant.encryption_servers
    }

@app.post("/tenants/{tenant_id}/encrypt")
async def encrypt_data(
    tenant_id: str,
    data: DataEncrypt,
    user_id: str = Depends(get_current_user)
):
    """Encrypt data for a tenant"""
    result = await mt_manager.encrypt_tenant_data(
        tenant_id,
        user_id,
        data.data,
        data.object_type,
        data.metadata
    )
    return result

@app.get("/tenants/{tenant_id}/decrypt/{object_id}")
async def decrypt_data(
    tenant_id: str,
    object_id: str,
    user_id: str = Depends(get_current_user)
):
    """Decrypt tenant data"""
    try:
        data = await mt_manager.decrypt_tenant_data(
            tenant_id,
            user_id,
            object_id
        )
        return {"data": data}
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

@app.post("/tenants/{source_tenant}/share/{target_tenant}")
async def share_across_tenants(
    source_tenant: str,
    target_tenant: str,
    object_id: str,
    permissions: List[str] = ["read"],
    user_id: str = Depends(get_current_user)
):
    """Share data between tenants"""
    share_id = await mt_manager.share_across_tenants(
        source_tenant,
        target_tenant,
        object_id,
        user_id,
        permissions
    )
    return {"share_id": share_id}

@app.get("/tenants/{tenant_id}/audit")
async def get_audit_report(
    tenant_id: str,
    start_date: datetime,
    end_date: datetime,
    user_role: str = Depends(get_user_role)
):
    """Get tenant audit report"""
    if user_role not in ["admin", "auditor"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    report = await mt_manager.audit_tenant_access(
        tenant_id,
        start_date,
        end_date
    )
    return report