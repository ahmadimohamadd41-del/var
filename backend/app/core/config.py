"""
VAR VPN API - Configuration and Settings
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # FastAPI Configuration
    fastapi_host: str = "0.0.0.0"
    fastapi_port: int = 9000
    fastapi_env: str = "production"
    
    # Database
    database_url: str
    
    # Telegram
    telegram_bot_token: str
    telegram_webhook_secret: str
    
    # Frontend
    frontend_url: str = "https://varminiapp.popserver.shop"
    
    # Security
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Logging
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
