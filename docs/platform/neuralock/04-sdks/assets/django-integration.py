# settings.py
NEURALOCK_CONFIG = {
    'APPLICATION_CONTRACT': '0x1234...',
    'PRIVATE_KEY': 'encrypted:...',  # Use Django's encryption
    'SERVERS': [
        {'nft_id': 1},
        {'nft_id': 2},
        {'nft_id': 3}
    ],
    'WEB3_PROVIDER': 'https://mainnet.infura.io/v3/YOUR_KEY',
    'SESSION_STORAGE': 'redis',
    'REDIS_URL': 'redis://localhost:6379/0'
}

# middleware.py
from django.utils.deprecation import MiddlewareMixin
from neuralock import NeuralockClient, RedisStorage
from django.conf import settings
import redis

class NeuralockMiddleware(MiddlewareMixin):
    def __init__(self, get_response):
        super().__init__(get_response)
        
        # Initialize Redis storage
        redis_client = redis.from_url(settings.NEURALOCK_CONFIG['REDIS_URL'])
        storage = RedisStorage(redis_client)
        
        # Initialize Neuralock client
        self.client = NeuralockClient(
            application_contract=settings.NEURALOCK_CONFIG['APPLICATION_CONTRACT'],
            private_key=self._decrypt_key(settings.NEURALOCK_CONFIG['PRIVATE_KEY']),
            servers=settings.NEURALOCK_CONFIG['SERVERS'],
            web3_provider=settings.NEURALOCK_CONFIG['WEB3_PROVIDER'],
            session_storage=storage
        )
        
        # Initialize on startup
        self.client.initialize()
    
    def process_request(self, request):
        # Attach client to request
        request.neuralock = self.client
        return None
    
    def _decrypt_key(self, encrypted_key):
        # Decrypt private key using Django's encryption
        from django.core.signing import Signer
        signer = Signer()
        return signer.unsign(encrypted_key.replace('encrypted:', ''))

# models.py
from django.db import models
from django.contrib.auth.models import User
import json

class EncryptedDocument(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    object_id = models.CharField(max_length=255, unique=True)
    encrypted_data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def encrypt_content(self, content, request):
        """Encrypt content using Neuralock"""
        encrypted = request.neuralock.encrypt(content, self.object_id)
        self.encrypted_data = encrypted.to_dict()
        self.save()
    
    def decrypt_content(self, request):
        """Decrypt content using Neuralock"""
        from neuralock import EncryptedData
        encrypted = EncryptedData.from_dict(self.encrypted_data)
        return request.neuralock.decrypt(encrypted, self.object_id)
    
    class Meta:
        db_table = 'encrypted_documents'
        indexes = [
            models.Index(fields=['object_id']),
            models.Index(fields=['owner', 'created_at']),
        ]

# views.py
from django.views import View
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from .models import EncryptedDocument
import uuid

@method_decorator(login_required, name='dispatch')
class EncryptDocumentView(View):
    def post(self, request):
        content = request.POST.get('content')
        
        # Create document with unique ID
        doc = EncryptedDocument.objects.create(
            owner=request.user,
            object_id=str(uuid.uuid4())
        )
        
        # Encrypt and store
        try:
            doc.encrypt_content(content, request)
            return JsonResponse({
                'success': True,
                'document_id': doc.object_id
            })
        except Exception as e:
            doc.delete()
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)

@method_decorator(login_required, name='dispatch')
class DecryptDocumentView(View):
    def get(self, request, document_id):
        try:
            doc = EncryptedDocument.objects.get(
                object_id=document_id,
                owner=request.user
            )
            
            content = doc.decrypt_content(request)
            return JsonResponse({
                'success': True,
                'content': content
            })
        except EncryptedDocument.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Document not found'
            }, status=404)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)

# admin.py
from django.contrib import admin
from .models import EncryptedDocument

@admin.register(EncryptedDocument)
class EncryptedDocumentAdmin(admin.ModelAdmin):
    list_display = ['object_id', 'owner', 'created_at']
    list_filter = ['created_at', 'owner']
    search_fields = ['object_id', 'owner__username']
    readonly_fields = ['encrypted_data', 'created_at', 'updated_at']