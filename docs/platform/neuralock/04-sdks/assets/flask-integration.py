from flask import Flask, request, jsonify
from neuralock import NeuralockClient, NeuralockFlask
from functools import wraps
import os

app = Flask(__name__)

# Initialize Neuralock client
client = NeuralockClient(
    application_contract=os.environ["NEURALOCK_CONTRACT"],
    private_key=os.environ["PRIVATE_KEY"],
    servers=[
        {"nft_id": 1},
        {"nft_id": 2},
        {"nft_id": 3}
    ],
    web3_provider=os.environ["WEB3_PROVIDER"]
)

# Initialize Flask integration
neuralock = NeuralockFlask(app, client)

# Custom decorator for permission checking
def require_permission(permission="read"):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            object_id = kwargs.get('object_id')
            if not neuralock.check_permission(
                request.user_address,
                object_id,
                permission
            ):
                return jsonify({"error": "Permission denied"}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@app.before_first_request
def initialize_neuralock():
    """Initialize Neuralock session on app startup"""
    client.initialize()

@app.route("/encrypt", methods=["POST"])
@neuralock.require_auth  # Built-in auth decorator
def encrypt_data():
    """Encrypt sensitive data"""
    data = request.json.get("data")
    object_id = request.json.get("object_id")
    
    try:
        encrypted = client.encrypt(data, object_id)
        return jsonify({
            "success": True,
            "encrypted": encrypted.to_dict()
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route("/decrypt/<object_id>", methods=["GET"])
@require_permission("read")
def decrypt_data(object_id):
    """Decrypt data with permission check"""
    encrypted_data = get_encrypted_from_db(object_id)
    
    try:
        decrypted = client.decrypt(encrypted_data, object_id)
        return jsonify({
            "success": True,
            "data": decrypted
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route("/grant-access", methods=["POST"])
@require_permission("admin")
def grant_access():
    """Grant access to another user"""
    object_id = request.json.get("object_id")
    user_address = request.json.get("user_address")
    permissions = request.json.get("permissions", ["read"])
    
    try:
        client.update_permissions(
            object_id,
            {"add": {user_address: permissions}}
        )
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == "__main__":
    app.run(debug=True)