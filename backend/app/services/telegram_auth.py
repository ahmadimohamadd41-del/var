"""
Telegram WebApp authentication and validation.
"""
import hmac
import hashlib
from urllib.parse import parse_qs
from datetime import datetime, timezone
from app.core.config import settings


def validate_telegram_init_data(init_data: str) -> dict | None:
    """
    Validate Telegram WebApp initData.
    
    Returns the parsed user data if valid, None otherwise.
    """
    try:
        # Parse the init data string
        parsed = parse_qs(init_data)
        
        # Extract hash
        received_hash = parsed.get('hash', [None])[0]
        if not received_hash:
            return None
        
        # Remove hash from data for signature calculation
        data_to_check = {}
        for key, values in parsed.items():
            if key != 'hash':
                data_to_check[key] = values[0]
        
        # Sort keys alphabetically
        sorted_keys = sorted(data_to_check.keys())
        
        # Create data check string
        data_check_string = '\n'.join(
            f"{key}={data_to_check[key]}" for key in sorted_keys
        )
        
        # Calculate secret key
        secret_key = hmac.new(
            b'WebAppData',
            settings.telegram_bot_token.encode(),
            hashlib.sha256
        ).digest()
        
        # Calculate hash
        calculated_hash = hmac.new(
            secret_key,
            data_check_string.encode(),
            hashlib.sha256
        ).hexdigest()
        
        # Verify hash
        if not hmac.compare_digest(calculated_hash, received_hash):
            return None
        
        # Check auth_date (valid for 24 hours)
        auth_date = int(data_to_check.get('auth_date', 0))
        now = int(datetime.now(timezone.utc).timestamp())
        if now - auth_date > 86400:  # 24 hours
            return None
        
        # Parse user data if present
        user_data = None
        if 'user' in data_to_check:
            import json
            user_data = json.loads(data_to_check['user'])
        
        return {
            'query_id': data_to_check.get('query_id'),
            'user': user_data,
            'auth_date': auth_date,
            'validated': True
        }
        
    except Exception:
        return None


def extract_user_from_init_data(init_data: str) -> dict | None:
    """
    Extract user information from validated Telegram initData.
    
    Returns user dict with telegram_id, username, first_name, last_name, language_code
    or None if validation fails.
    """
    validated_data = validate_telegram_init_data(init_data)
    if not validated_data or not validated_data.get('user'):
        return None
    
    user = validated_data['user']
    return {
        'telegram_id': user.get('id'),
        'username': user.get('username'),
        'first_name': user.get('first_name'),
        'last_name': user.get('last_name'),
        'language_code': user.get('language_code')
    }
