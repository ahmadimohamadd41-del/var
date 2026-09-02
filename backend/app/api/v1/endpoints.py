"""
API v1 Routes - Plans, Customers, Account Status
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional
from app.schemas import Plan, Customer, AccountStatus, APIResponse, ErrorResponse
from app.services.database_services import (
    get_all_active_plans,
    get_plan_by_id,
    get_customer_by_telegram_id,
    get_account_status,
    update_customer_info
)
from app.services.telegram_auth import validate_telegram_init_data, extract_user_from_init_data

router = APIRouter()


# ============== Helper Functions ==============

def validate_init_data_header(x_telegram_init_data: Optional[str] = Header(None)) -> dict:
    """Validate Telegram initData from header and return user data."""
    if not x_telegram_init_data:
        raise HTTPException(
            status_code=401,
            detail="Missing X-Telegram-Init-Data header"
        )
    
    user_data = extract_user_from_init_data(x_telegram_init_data)
    if not user_data:
        raise HTTPException(
            status_code=401,
            detail="Invalid Telegram authentication"
        )
    
    return user_data


# ============== Public Endpoints ==============

@router.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "var-api"}


@router.get("/plans", response_model=list[Plan], tags=["Plans"])
async def list_plans():
    """
    Get all active VPN plans.
    Public endpoint - no authentication required.
    """
    try:
        plans = get_all_active_plans()
        return plans
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch plans: {str(e)}")


@router.get("/plans/{plan_id}", response_model=Plan, tags=["Plans"])
async def get_plan(plan_id: int):
    """Get a specific plan by ID."""
    plan = get_plan_by_id(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan


# ============== Customer Endpoints ==============

@router.get("/customers/{telegram_id}", response_model=Customer, tags=["Customers"])
async def get_customer(telegram_id: int):
    """
    Get customer information by Telegram ID.
    Creates customer if not exists.
    """
    try:
        customer = get_customer_by_telegram_id(telegram_id)
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        return customer
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch customer: {str(e)}")


# ============== Account Status Endpoint ==============

@router.get("/account/status", response_model=AccountStatus, tags=["Account"])
async def get_user_account_status(
    user_data: dict = Depends(validate_init_data_header)
):
    """
    Get complete account status for the authenticated Telegram user.
    
    Returns:
    - Customer info
    - Current entitlement (quota, usage, expiration)
    - Purchase history count
    
    Requires valid X-Telegram-Init-Data header.
    """
    try:
        telegram_id = user_data['telegram_id']
        
        # Update user info if provided
        if user_data.get('username'):
            customer = get_customer_by_telegram_id(telegram_id)
            if customer:
                update_customer_info(
                    customer['id'],
                    username=user_data.get('username'),
                    first_name=user_data.get('first_name'),
                    last_name=user_data.get('last_name'),
                    language_code=user_data.get('language_code')
                )
        
        # Get account status
        status = get_account_status(telegram_id)
        
        return {
            'customer': status['customer'],
            'entitlement': status['entitlement'],
            'purchases_count': status['purchases_count'],
            'message': status['message']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch account status: {str(e)}")


# ============== New User Registration ==============

@router.post("/account/register", response_model=Customer, tags=["Account"])
async def register_user(
    x_telegram_init_data: str = Header(...),
):
    """
    Register/update user from Telegram Mini App.
    Called when user opens the Mini App for the first time.
    """
    user_data = extract_user_from_init_data(x_telegram_init_data)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid Telegram authentication")
    
    try:
        telegram_id = user_data['telegram_id']
        customer = get_customer_by_telegram_id(telegram_id)
        
        # Update with latest info
        update_customer_info(
            customer['id'],
            username=user_data.get('username'),
            first_name=user_data.get('first_name'),
            last_name=user_data.get('last_name'),
            language_code=user_data.get('language_code')
        )
        
        return customer
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")
