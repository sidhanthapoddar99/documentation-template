from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List, Dict
from neuralock import NeuralockClient, SessionExpiredError, PermissionDeniedError
import os
import asyncio

app = FastAPI(title="Neuralock API")
security = HTTPBearer()

# Initialize Neuralock client with async support
client = NeuralockClient(
    application_contract=os.environ["NEURALOCK_CONTRACT"],
    private_key=os.environ["PRIVATE_KEY"],
    servers=[
        {"nft_id": 1},
        {"nft_id": 2},
        {"nft_id": 3}
    ],
    web3_provider=os.environ["WEB3_PROVIDER"],
    async_mode=True
)

# Pydantic models
class EncryptRequest(BaseModel):
    data: str
    object_id: str
    compress: Optional[bool] = False

class DecryptRequest(BaseModel):
    object_id: str

class PermissionUpdate(BaseModel):
    object_id: str
    add_users: Optional[Dict[str, List[str]]] = None
    remove_users: Optional[List[str]] = None

class EncryptedResponse(BaseModel):
    success: bool
    ciphertext: Optional[str] = None
    object_id: Optional[str] = None
    error: Optional[str] = None

# Dependency for getting current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    # Verify JWT token and extract user address
    # This is a simplified example
    return {"address": "0x1234..."}

# Startup event
@app.on_event("startup")
async def startup_event():
    await client.ainitialize()
    print("Neuralock client initialized")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    await client.aclose()
    print("Neuralock client closed")

@app.post("/encrypt", response_model=EncryptedResponse)
async def encrypt_data(
    request: EncryptRequest,
    current_user: dict = Depends(get_current_user)
):
    """Encrypt sensitive data"""
    try:
        encrypted = await client.aencrypt(
            data=request.data,
            object_id=request.object_id,
            compress=request.compress
        )
        
        # Store encrypted data in database
        await store_encrypted_data(
            object_id=request.object_id,
            encrypted_data=encrypted,
            owner=current_user["address"]
        )
        
        return EncryptedResponse(
            success=True,
            ciphertext=encrypted.ciphertext,
            object_id=request.object_id
        )
    except Exception as e:
        return EncryptedResponse(
            success=False,
            error=str(e)
        )

@app.get("/decrypt/{object_id}")
async def decrypt_data(
    object_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Decrypt data with permission check"""
    try:
        # Check permissions
        if not await check_user_permission(current_user["address"], object_id):
            raise HTTPException(status_code=403, detail="Permission denied")
        
        # Retrieve encrypted data from database
        encrypted_data = await get_encrypted_data(object_id)
        
        # Decrypt
        decrypted = await client.adecrypt(
            encrypted_data=encrypted_data,
            object_id=object_id
        )
        
        return {
            "success": True,
            "data": decrypted,
            "object_id": object_id
        }
    except PermissionDeniedError:
        raise HTTPException(status_code=403, detail="Permission denied")
    except SessionExpiredError:
        # Try to refresh session
        await client.ainitialize()
        # Retry operation
        return await decrypt_data(object_id, current_user)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/permissions/update")
async def update_permissions(
    update: PermissionUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update access permissions for an object"""
    try:
        # Verify owner
        if not await is_object_owner(current_user["address"], update.object_id):
            raise HTTPException(status_code=403, detail="Only owner can update permissions")
        
        permissions = {}
        if update.add_users:
            permissions["add"] = update.add_users
        if update.remove_users:
            permissions["remove"] = update.remove_users
        
        await client.aupdate_permissions(
            object_id=update.object_id,
            permissions=permissions
        )
        
        return {"success": True, "message": "Permissions updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/batch/encrypt")
async def batch_encrypt(
    items: List[EncryptRequest],
    current_user: dict = Depends(get_current_user)
):
    """Encrypt multiple items efficiently"""
    try:
        # Prepare items for batch encryption
        batch_items = [
            (item.data, item.object_id)
            for item in items
        ]
        
        # Perform batch encryption
        results = await client.abatch_encrypt(batch_items)
        
        # Store all results
        store_tasks = []
        for i, encrypted in enumerate(results):
            task = store_encrypted_data(
                object_id=items[i].object_id,
                encrypted_data=encrypted,
                owner=current_user["address"]
            )
            store_tasks.append(task)
        
        await asyncio.gather(*store_tasks)
        
        return {
            "success": True,
            "encrypted_count": len(results),
            "object_ids": [item.object_id for item in items]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Check if Neuralock client is healthy"""
    try:
        session = await client.aget_session()
        return {
            "status": "healthy",
            "session_valid": session.is_valid,
            "time_remaining": session.time_remaining
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

# Helper functions (implement based on your database)
async def store_encrypted_data(object_id: str, encrypted_data, owner: str):
    # Store in your database
    pass

async def get_encrypted_data(object_id: str):
    # Retrieve from your database
    pass

async def check_user_permission(user_address: str, object_id: str) -> bool:
    # Check permissions in your system
    return True

async def is_object_owner(user_address: str, object_id: str) -> bool:
    # Check ownership in your system
    return True