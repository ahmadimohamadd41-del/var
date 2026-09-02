# Backend

FastAPI backend for VAR VPN Telegram Mini App.

## Structure

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       └── endpoints.py    # API routes
│   ├── core/
│   │   └── config.py           # Configuration
│   ├── db/
│   │   └── database.py         # Database connection
│   ├── models/                 # (Optional SQLAlchemy models)
│   ├── schemas/
│   │   └── __init__.py         # Pydantic schemas
│   ├── services/
│   │   ├── database_services.py  # DB operations
│   │   └── telegram_auth.py      # Telegram auth
│   └── main.py                 # FastAPI app entry
├── .env.example
└── requirements.txt
```

## Setup

1. Copy `.env.example` to `.env` and fill in values
2. Install dependencies: `pip install -r requirements.txt`
3. Run: `uvicorn app.main:app --host 0.0.0.0 --port 9000`

## API Endpoints

- `GET /v1/health` - Health check
- `GET /v1/plans` - List active plans
- `GET /v1/customers/{telegram_id}` - Get customer
- `GET /v1/account/status` - Get account status (requires auth)
- `POST /v1/account/register` - Register user (requires auth)

## Authentication

Protected endpoints require `X-Telegram-Init-Data` header with Telegram WebApp initData.
