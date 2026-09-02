"""
Services for interacting with the varvpn database.
Handles customers, plans, entitlements, and RADIUS integration.
"""
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional, List, Tuple
from app.db.database import get_db_cursor


# ============== Plan Services ==============

def get_all_active_plans() -> List[dict]:
    """Get all active plans from the database."""
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT id, name, quota_gb, duration_days, price, is_active
            FROM plans
            WHERE is_active = TRUE
            ORDER BY price ASC
        """)
        columns = ['id', 'name', 'quota_gb', 'duration_days', 'price', 'is_active']
        return [dict(zip(columns, row)) for row in cursor.fetchall()]


def get_plan_by_id(plan_id: int) -> Optional[dict]:
    """Get a specific plan by ID."""
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT id, name, quota_gb, duration_days, price, is_active
            FROM plans
            WHERE id = %s AND is_active = TRUE
        """, (plan_id,))
        row = cursor.fetchone()
        if row:
            columns = ['id', 'name', 'quota_gb', 'duration_days', 'price', 'is_active']
            return dict(zip(columns, row))
        return None


# ============== Customer Services ==============

def get_customer_by_telegram_id(telegram_id: int) -> Optional[dict]:
    """Get or create customer by Telegram ID."""
    with get_db_cursor(commit=True) as cursor:
        # Try to get existing customer
        cursor.execute("""
            SELECT id, telegram_id, username, first_name, last_name, language_code, created_at
            FROM customers
            WHERE telegram_id = %s
        """, (telegram_id,))
        row = cursor.fetchone()
        
        if row:
            columns = ['id', 'telegram_id', 'username', 'first_name', 'last_name', 'language_code', 'created_at']
            return dict(zip(columns, row))
        
        # Create new customer if not found
        cursor.execute("""
            INSERT INTO customers (telegram_id, created_at)
            VALUES (%s, NOW())
            RETURNING id, telegram_id, username, first_name, last_name, language_code, created_at
        """, (telegram_id,))
        row = cursor.fetchone()
        columns = ['id', 'telegram_id', 'username', 'first_name', 'last_name', 'language_code', 'created_at']
        return dict(zip(columns, row))


def update_customer_info(customer_id: int, username: str = None, 
                         first_name: str = None, last_name: str = None,
                         language_code: str = None) -> bool:
    """Update customer information."""
    updates = []
    values = []
    
    if username is not None:
        updates.append("username = %s")
        values.append(username)
    if first_name is not None:
        updates.append("first_name = %s")
        values.append(first_name)
    if last_name is not None:
        updates.append("last_name = %s")
        values.append(last_name)
    if language_code is not None:
        updates.append("language_code = %s")
        values.append(language_code)
    
    if not updates:
        return True
    
    values.append(customer_id)
    query = f"UPDATE customers SET {', '.join(updates)} WHERE id = %s"
    
    with get_db_cursor(commit=True) as cursor:
        cursor.execute(query, values)
        return cursor.rowcount > 0


# ============== Entitlement/Subscription Services ==============

def get_user_entitlement(customer_id: int) -> Optional[dict]:
    """
    Get user's current entitlement status.
    Calculates total quota, used quota from RADIUS, and expiration.
    """
    with get_db_cursor() as cursor:
        # Get active entitlement (not expired)
        cursor.execute("""
            SELECT e.id, e.customer_id, e.total_quota_gb, e.used_quota_gb,
                   e.expiration_date, e.is_active, e.created_at, e.updated_at
            FROM entitlements e
            WHERE e.customer_id = %s 
              AND e.is_active = TRUE
              AND (e.expiration_date IS NULL OR e.expiration_date > NOW())
            ORDER BY e.expiration_date DESC
            LIMIT 1
        """, (customer_id,))
        row = cursor.fetchone()
        
        if not row:
            return None
        
        columns = ['id', 'customer_id', 'total_quota_gb', 'used_quota_gb',
                   'expiration_date', 'is_active', 'created_at', 'updated_at']
        entitlement = dict(zip(columns, row))
        
        # Calculate RADIUS usage for this customer
        radius_usage = get_radius_usage_for_customer(customer_id)
        entitlement['radius_used_gb'] = float(radius_usage) if radius_usage else 0.0
        
        # Calculate remaining quota
        total_quota = float(entitlement['total_quota_gb']) if entitlement['total_quota_gb'] else 0.0
        used_quota = entitlement['radius_used_gb']
        entitlement['remaining_quota_gb'] = max(0.0, total_quota - used_quota)
        
        # Calculate days remaining
        if entitlement['expiration_date']:
            now = datetime.now()
            delta = entitlement['expiration_date'] - now
            entitlement['days_remaining'] = max(0, delta.days)
            entitlement['is_expired'] = delta.total_seconds() < 0
        else:
            entitlement['days_remaining'] = None
            entitlement['is_expired'] = False
        
        return entitlement


def get_radius_usage_for_customer(customer_id: int) -> float:
    """
    Get total data usage from RADIUS radacct table for a customer.
    Returns usage in GB.
    
    This joins radius_identities to link customers to RADIUS usernames.
    """
    with get_db_cursor() as cursor:
        # First get the RADIUS identity for this customer
        cursor.execute("""
            SELECT radius_username
            FROM radius_identities
            WHERE customer_id = %s
        """, (customer_id,))
        row = cursor.fetchone()
        
        if not row:
            return 0.0
        
        radius_username = row[0]
        
        # Sum up all acctinputoctets + acctoutputoctets from radacct
        # Note: We NEVER reset radacct, just read from it
        cursor.execute("""
            SELECT COALESCE(
                SUM(acctinputoctets + acctoutputoctets), 
                0
            )
            FROM radacct
            WHERE acctuniqueid IN (
                SELECT acctuniqueid 
                FROM radacct 
                WHERE username = %s
                GROUP BY acctuniqueid
                ORDER BY acctstarttime DESC
                LIMIT 1
            )
        """, (radius_username,))
        
        # Alternative simpler query - sum all bytes for this username
        cursor.execute("""
            SELECT COALESCE(
                SUM(acctinputoctets + acctoutputoctets), 
                0
            )::bigint
            FROM radacct
            WHERE username = %s
        """, (radius_username,))
        
        row = cursor.fetchone()
        total_bytes = row[0] if row else 0
        
        # Convert bytes to GB
        return total_bytes / (1024 ** 3)


def get_purchase_history(customer_id: int) -> List[dict]:
    """Get purchase history for a customer."""
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT p.id, p.customer_id, p.plan_id, p.quantity, 
                   p.purchased_quota_gb, p.purchase_date, p.total_price,
                   pl.name as plan_name, pl.quota_gb as plan_quota
            FROM purchases p
            JOIN plans pl ON p.plan_id = pl.id
            WHERE p.customer_id = %s
            ORDER BY p.purchase_date DESC
        """, (customer_id,))
        
        columns = ['id', 'customer_id', 'plan_id', 'quantity', 'purchased_quota_gb',
                   'purchase_date', 'total_price', 'plan_name', 'plan_quota']
        return [dict(zip(columns, row)) for row in cursor.fetchall()]


def get_purchases_count(customer_id: int) -> int:
    """Get total number of purchases for a customer."""
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT COUNT(*) FROM purchases WHERE customer_id = %s
        """, (customer_id,))
        row = cursor.fetchone()
        return row[0] if row else 0


# ============== Account Status Service ==============

def get_account_status(telegram_id: int) -> dict:
    """
    Get complete account status for a Telegram user.
    This is the main endpoint for the Mini App to display user status.
    """
    # Get or create customer
    customer = get_customer_by_telegram_id(telegram_id)
    
    if not customer:
        return {
            'customer': None,
            'entitlement': None,
            'purchases_count': 0,
            'message': 'Customer not found'
        }
    
    # Get entitlement
    entitlement = get_user_entitlement(customer['id'])
    
    # Get purchase count
    purchases_count = get_purchases_count(customer['id'])
    
    # Build response
    result = {
        'customer': customer,
        'entitlement': entitlement,
        'purchases_count': purchases_count,
        'message': ''
    }
    
    if not entitlement:
        result['message'] = 'No active subscription'
    elif entitlement.get('is_expired'):
        result['message'] = 'Subscription expired'
    else:
        result['message'] = 'Active subscription'
    
    return result
