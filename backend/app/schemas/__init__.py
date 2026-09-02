"""
Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


# ============== Plan Schemas ==============

class PlanBase(BaseModel):
    """Base plan schema."""
    name: str
    quota_gb: int
    duration_days: int
    price: Decimal
    is_active: bool = True


class Plan(PlanBase):
    """Plan response schema."""
    id: int
    
    class Config:
        from_attributes = True


# ============== Customer Schemas ==============

class CustomerBase(BaseModel):
    """Base customer schema."""
    telegram_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    language_code: Optional[str] = None


class Customer(CustomerBase):
    """Customer response schema."""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============== Subscription/Entitlement Schemas ==============

class EntitlementStatus(BaseModel):
    """User's current entitlement status."""
    has_active_subscription: bool
    total_quota_gb: float
    used_quota_gb: float
    remaining_quota_gb: float
    expiration_date: Optional[datetime] = None
    days_remaining: Optional[int] = None
    is_expired: bool = False


class AccountStatus(BaseModel):
    """Complete account status for a Telegram user."""
    customer: Optional[Customer] = None
    entitlement: Optional[EntitlementStatus] = None
    purchases_count: int = 0
    message: str = ""


# ============== Telegram InitData Schema ==============

class TelegramInitData(BaseModel):
    """Telegram WebApp initData validation schema."""
    query_id: Optional[str] = None
    user: Optional[dict] = None
    auth_date: int
    hash: str


# ============== Purchase Schemas ==============

class PurchaseRequest(BaseModel):
    """Request to purchase a plan."""
    plan_id: int
    telegram_init_data: str


class PurchaseResponse(BaseModel):
    """Response after purchase attempt."""
    success: bool
    message: str
    new_quota_gb: Optional[float] = None
    new_expiration: Optional[datetime] = None
    transaction_id: Optional[int] = None


# ============== Generic Response Schemas ==============

class APIResponse(BaseModel):
    """Generic API response wrapper."""
    success: bool
    data: Optional[dict] = None
    message: Optional[str] = None
    error: Optional[str] = None


class ErrorResponse(BaseModel):
    """Error response schema."""
    success: bool = False
    error: str
    detail: Optional[str] = None
