from neuralock import NeuralockClient, ThresholdConfig
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import asyncio
import json
import uuid
from enum import Enum

# Document types for financial vault
class DocumentType(str, Enum):
    TAX_RETURN = "tax_return"
    BANK_STATEMENT = "bank_statement"
    INVESTMENT_REPORT = "investment_report"
    CONTRACT = "contract"
    AUDIT_REPORT = "audit_report"
    FINANCIAL_STATEMENT = "financial_statement"

# Document classification
class DocumentClassification(str, Enum):
    PUBLIC = "public"
    CONFIDENTIAL = "confidential"
    HIGHLY_CONFIDENTIAL = "highly_confidential"
    RESTRICTED = "restricted"

# Initialize Neuralock with high-security configuration
client = NeuralockClient(
    application_contract="0x...",  # Financial vault contract
    private_key=get_secure_key(),  # From HSM or secure storage
    servers=[
        {"nft_id": 1, "importance_factor": 1.0, "required": True},  # Primary financial server
        {"nft_id": 2, "importance_factor": 1.0, "required": True},  # Secondary financial server
        {"nft_id": 3, "importance_factor": 0.9},
        {"nft_id": 4, "importance_factor": 0.8},
        {"nft_id": 5, "importance_factor": 0.7}
    ],
    web3_provider="https://mainnet.infura.io/v3/YOUR_KEY",
    threshold_config=ThresholdConfig(
        mode="strict",  # Strict mode for financial data
        minimum=4       # Require 4 out of 5 servers
    ),
    session_storage=RedisStorage(
        host="localhost",
        port=6379,
        encryption_key=get_redis_encryption_key()
    ),
    async_mode=True
)

# Financial document model
class FinancialDocument(BaseModel):
    id: str
    type: DocumentType
    classification: DocumentClassification
    title: str
    content: str
    metadata: Dict
    tags: List[str]
    created_by: str
    created_at: datetime
    expires_at: Optional[datetime]
    approval_required: bool = False
    approvers: List[str] = []

# Approval workflow model
class ApprovalRequest(BaseModel):
    document_id: str
    requested_by: str
    requested_at: datetime
    reason: str
    approved_by: List[str] = []
    rejected_by: List[str] = []
    status: str = "pending"  # pending, approved, rejected

# Financial vault service
class FinancialVaultService:
    def __init__(self, neuralock_client):
        self.client = neuralock_client
        self.approval_queue = {}
        self.retention_policies = {
            DocumentType.TAX_RETURN: timedelta(days=2555),      # 7 years
            DocumentType.BANK_STATEMENT: timedelta(days=1825),  # 5 years
            DocumentType.INVESTMENT_REPORT: timedelta(days=2555),
            DocumentType.CONTRACT: timedelta(days=3650),        # 10 years
            DocumentType.AUDIT_REPORT: timedelta(days=2555),
            DocumentType.FINANCIAL_STATEMENT: timedelta(days=3650)
        }
    
    async def store_document(
        self, 
        document: FinancialDocument, 
        requester_id: str,
        require_approval: bool = False
    ) -> str:
        """Store a financial document with encryption"""
        
        # Validate classification requirements
        if document.classification == DocumentClassification.RESTRICTED:
            if len(document.approvers) < 2:
                raise ValueError("Restricted documents require at least 2 approvers")
        
        # Generate unique document ID
        document.id = f"fin-doc-{uuid.uuid4()}"
        
        # Serialize document
        doc_data = document.json()
        
        # Encrypt based on classification
        if document.classification in [
            DocumentClassification.HIGHLY_CONFIDENTIAL,
            DocumentClassification.RESTRICTED
        ]:
            # Use enhanced encryption for sensitive documents
            encrypted = await self.client.aencrypt(
                doc_data,
                document.id,
                compress=True  # Compress large financial documents
            )
        else:
            encrypted = await self.client.aencrypt(doc_data, document.id)
        
        # Store encrypted document with metadata
        await self.store_encrypted_document({
            "id": document.id,
            "type": document.type,
            "classification": document.classification,
            "encrypted_data": encrypted.to_dict(),
            "metadata": {
                "title": document.title,
                "tags": document.tags,
                "created_by": document.created_by,
                "created_at": document.created_at.isoformat(),
                "expires_at": document.expires_at.isoformat() if document.expires_at else None,
                "approval_required": require_approval
            }
        })
        
        # Set up approval workflow if required
        if require_approval:
            await self.create_approval_request(document.id, requester_id)
        
        # Set retention policy
        await self.schedule_retention(document)
        
        # Audit log
        await self.audit_log("DOCUMENT_STORED", {
            "document_id": document.id,
            "type": document.type,
            "classification": document.classification,
            "user": requester_id
        })
        
        return document.id
    
    async def retrieve_document(
        self, 
        document_id: str, 
        requester_id: str,
        requester_role: str
    ) -> Optional[FinancialDocument]:
        """Retrieve and decrypt a financial document"""
        
        # Fetch encrypted document
        encrypted_doc = await self.fetch_encrypted_document(document_id)
        if not encrypted_doc:
            return None
        
        # Check access permissions based on classification
        classification = encrypted_doc["classification"]
        
        if classification == DocumentClassification.RESTRICTED:
            # Check if user is in approvers list
            if requester_id not in encrypted_doc["metadata"].get("approvers", []):
                # Check if there's an approved request
                if not await self.check_approval_status(document_id, requester_id):
                    raise PermissionError("Access denied - approval required")
        
        elif classification == DocumentClassification.HIGHLY_CONFIDENTIAL:
            # Check role-based access
            if requester_role not in ["executive", "auditor", "compliance"]:
                raise PermissionError("Insufficient privileges")
        
        # Decrypt document
        try:
            encrypted_data = EncryptedData.from_dict(encrypted_doc["encrypted_data"])
            decrypted = await self.client.adecrypt(encrypted_data, document_id)
            
            # Parse and return document
            doc_data = json.loads(decrypted)
            document = FinancialDocument(**doc_data)
            
            # Audit log
            await self.audit_log("DOCUMENT_ACCESSED", {
                "document_id": document_id,
                "type": document.type,
                "user": requester_id,
                "role": requester_role
            })
            
            return document
            
        except Exception as e:
            await self.audit_log("DOCUMENT_ACCESS_FAILED", {
                "document_id": document_id,
                "user": requester_id,
                "error": str(e)
            })
            raise
    
    async def create_approval_request(
        self, 
        document_id: str, 
        requester_id: str,
        reason: str = ""
    ) -> str:
        """Create an approval request for document access"""
        
        request = ApprovalRequest(
            document_id=document_id,
            requested_by=requester_id,
            requested_at=datetime.utcnow(),
            reason=reason
        )
        
        request_id = f"approval-{uuid.uuid4()}"
        self.approval_queue[request_id] = request
        
        # Notify approvers
        await self.notify_approvers(document_id, request_id)
        
        return request_id
    
    async def approve_request(
        self, 
        request_id: str, 
        approver_id: str,
        grant_duration: int = 86400  # 24 hours default
    ):
        """Approve a document access request"""
        
        if request_id not in self.approval_queue:
            raise ValueError("Invalid request ID")
        
        request = self.approval_queue[request_id]
        
        # Check if approver is authorized
        encrypted_doc = await self.fetch_encrypted_document(request.document_id)
        if approver_id not in encrypted_doc["metadata"].get("approvers", []):
            raise PermissionError("Not authorized to approve")
        
        # Add approval
        request.approved_by.append(approver_id)
        
        # Check if we have enough approvals (multi-sig style)
        required_approvals = 2 if encrypted_doc["classification"] == DocumentClassification.RESTRICTED else 1
        
        if len(request.approved_by) >= required_approvals:
            request.status = "approved"
            
            # Grant temporary access
            await self.client.aupdate_permissions(
                request.document_id,
                {
                    "add": {
                        request.requested_by: ["read"],
                        "expires_at": datetime.utcnow() + timedelta(seconds=grant_duration)
                    }
                }
            )
            
            # Audit log
            await self.audit_log("ACCESS_APPROVED", {
                "request_id": request_id,
                "document_id": request.document_id,
                "approved_by": approver_id,
                "granted_to": request.requested_by,
                "duration": grant_duration
            })
    
    async def batch_encrypt_documents(
        self,
        documents: List[FinancialDocument],
        requester_id: str
    ) -> List[str]:
        """Batch encrypt multiple financial documents"""
        
        # Prepare documents for batch encryption
        items = []
        for doc in documents:
            doc.id = f"fin-doc-{uuid.uuid4()}"
            items.append((doc.json(), doc.id))
        
        # Batch encrypt
        encrypted_results = await self.client.abatch_encrypt(items)
        
        # Store all documents
        document_ids = []
        for doc, encrypted in zip(documents, encrypted_results):
            await self.store_encrypted_document({
                "id": doc.id,
                "type": doc.type,
                "classification": doc.classification,
                "encrypted_data": encrypted.to_dict(),
                "metadata": {
                    "title": doc.title,
                    "tags": doc.tags,
                    "created_by": requester_id,
                    "created_at": datetime.utcnow().isoformat()
                }
            })
            document_ids.append(doc.id)
        
        # Audit log
        await self.audit_log("BATCH_DOCUMENTS_STORED", {
            "count": len(documents),
            "document_ids": document_ids,
            "user": requester_id
        })
        
        return document_ids
    
    async def search_documents(
        self,
        requester_id: str,
        requester_role: str,
        filters: Dict
    ) -> List[Dict]:
        """Search documents with permission filtering"""
        
        # Fetch all document metadata (not decrypted content)
        all_documents = await self.fetch_all_document_metadata()
        
        # Filter based on permissions and criteria
        filtered = []
        for doc_meta in all_documents:
            # Check classification permissions
            if doc_meta["classification"] == DocumentClassification.RESTRICTED:
                if requester_id not in doc_meta["metadata"].get("approvers", []):
                    continue
            elif doc_meta["classification"] == DocumentClassification.HIGHLY_CONFIDENTIAL:
                if requester_role not in ["executive", "auditor", "compliance"]:
                    continue
            
            # Apply filters
            if filters.get("type") and doc_meta["type"] != filters["type"]:
                continue
            
            if filters.get("tags"):
                if not any(tag in doc_meta["metadata"]["tags"] for tag in filters["tags"]):
                    continue
            
            if filters.get("created_after"):
                created_at = datetime.fromisoformat(doc_meta["metadata"]["created_at"])
                if created_at < filters["created_after"]:
                    continue
            
            filtered.append({
                "id": doc_meta["id"],
                "type": doc_meta["type"],
                "title": doc_meta["metadata"]["title"],
                "tags": doc_meta["metadata"]["tags"],
                "created_at": doc_meta["metadata"]["created_at"],
                "classification": doc_meta["classification"]
            })
        
        return filtered
    
    async def schedule_retention(self, document: FinancialDocument):
        """Schedule document deletion based on retention policy"""
        
        retention_period = self.retention_policies.get(document.type)
        if not retention_period:
            return
        
        deletion_date = document.created_at + retention_period
        
        # Schedule deletion task
        asyncio.create_task(self.delete_document_at(document.id, deletion_date))
    
    async def delete_document_at(self, document_id: str, deletion_date: datetime):
        """Delete document at specified date"""
        
        # Wait until deletion date
        wait_seconds = (deletion_date - datetime.utcnow()).total_seconds()
        if wait_seconds > 0:
            await asyncio.sleep(wait_seconds)
        
        # Revoke all access
        await self.client.arevoke_access(document_id)
        
        # Delete from storage
        await self.delete_encrypted_document(document_id)
        
        # Audit log
        await self.audit_log("DOCUMENT_DELETED_RETENTION", {
            "document_id": document_id,
            "deletion_date": deletion_date.isoformat()
        })
    
    async def export_audit_trail(
        self,
        start_date: datetime,
        end_date: datetime,
        export_format: str = "json"
    ) -> str:
        """Export audit trail for compliance"""
        
        logs = await self.fetch_audit_logs(start_date, end_date)
        
        if export_format == "json":
            return json.dumps(logs, indent=2)
        elif export_format == "csv":
            # Convert to CSV format
            import csv
            import io
            
            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=logs[0].keys())
            writer.writeheader()
            writer.writerows(logs)
            
            return output.getvalue()
        
        raise ValueError(f"Unsupported export format: {export_format}")
    
    # Helper methods (implement based on your storage backend)
    async def store_encrypted_document(self, document): pass
    async def fetch_encrypted_document(self, document_id): pass
    async def fetch_all_document_metadata(self): pass
    async def delete_encrypted_document(self, document_id): pass
    async def audit_log(self, action, details): pass
    async def fetch_audit_logs(self, start_date, end_date): pass
    async def notify_approvers(self, document_id, request_id): pass
    async def check_approval_status(self, document_id, requester_id): pass

# FastAPI application
app = FastAPI(title="Financial Vault API")
vault_service = FinancialVaultService(client)

@app.on_event("startup")
async def startup():
    await client.ainitialize()

@app.post("/documents")
async def store_document(
    document: FinancialDocument,
    user_id: str = Depends(get_current_user)
):
    """Store a new financial document"""
    doc_id = await vault_service.store_document(document, user_id)
    return {"document_id": doc_id}

@app.get("/documents/{document_id}")
async def retrieve_document(
    document_id: str,
    user_id: str = Depends(get_current_user),
    user_role: str = Depends(get_user_role)
):
    """Retrieve a financial document"""
    document = await vault_service.retrieve_document(document_id, user_id, user_role)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@app.post("/documents/batch")
async def batch_store_documents(
    documents: List[FinancialDocument],
    user_id: str = Depends(get_current_user)
):
    """Store multiple documents at once"""
    doc_ids = await vault_service.batch_encrypt_documents(documents, user_id)
    return {"document_ids": doc_ids}

@app.get("/documents")
async def search_documents(
    type: Optional[DocumentType] = None,
    tags: Optional[List[str]] = None,
    created_after: Optional[datetime] = None,
    user_id: str = Depends(get_current_user),
    user_role: str = Depends(get_user_role)
):
    """Search documents with filters"""
    filters = {
        "type": type,
        "tags": tags,
        "created_after": created_after
    }
    results = await vault_service.search_documents(user_id, user_role, filters)
    return {"results": results, "count": len(results)}

@app.post("/approvals/request")
async def request_approval(
    document_id: str,
    reason: str,
    user_id: str = Depends(get_current_user)
):
    """Request access to a restricted document"""
    request_id = await vault_service.create_approval_request(
        document_id, user_id, reason
    )
    return {"request_id": request_id}

@app.post("/approvals/{request_id}/approve")
async def approve_request(
    request_id: str,
    grant_duration: int = 86400,
    approver_id: str = Depends(get_current_user)
):
    """Approve a document access request"""
    await vault_service.approve_request(request_id, approver_id, grant_duration)
    return {"status": "approved"}

@app.get("/audit/export")
async def export_audit_trail(
    start_date: datetime,
    end_date: datetime,
    format: str = "json",
    user_role: str = Depends(get_user_role)
):
    """Export audit trail for compliance"""
    if user_role not in ["auditor", "compliance", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient privileges")
    
    export = await vault_service.export_audit_trail(start_date, end_date, format)
    
    return {
        "data": export,
        "format": format,
        "period": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat()
        }
    }