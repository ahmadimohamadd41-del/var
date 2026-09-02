"""
Database connection and session management.
Uses raw psycopg2 for direct PostgreSQL access.
"""
import psycopg2
from psycopg2 import pool
from contextlib import contextmanager
from app.core.config import settings


# Connection pool for efficient database access
connection_pool = None


def init_db_pool():
    """Initialize the database connection pool."""
    global connection_pool
    if connection_pool is None:
        connection_pool = psycopg2.pool.SimpleConnectionPool(
            1, 10,
            dsn=settings.database_url
        )
    return connection_pool


def get_pool():
    """Get the connection pool."""
    if connection_pool is None:
        init_db_pool()
    return connection_pool


@contextmanager
def get_db_connection():
    """Context manager for database connections."""
    conn = None
    try:
        pool = get_pool()
        conn = pool.getconn()
        yield conn
    finally:
        if conn:
            pool.putconn(conn)


@contextmanager
def get_db_cursor(commit=False):
    """Context manager for database cursors with optional commit."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        try:
            yield cursor
            if commit:
                conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            cursor.close()
