# VAR VPN — معماری (خلاصه عملیاتی)

> نسخه کامل در سند معماری اصلی است؛ این فایل برای همگام‌ماندن مخزن با آن نوشته می‌شود.

## شکل سیستم

```
Telegram Mini App (React/Vite)  ──HTTPS──▶  FastAPI (Modular Monolith)
                                              │            │
                                              ▼            ▼
                                        MariaDB:      FreeRADIUS (هاست)
                                       var_business        │
                                       (Alembic)      MariaDB: radius
                                                      (فقط SELECT برای مصرف)
```

## اجزا

- **web**: React + TS + Vite — همین مخزن — کانتینر `varvpn-web`
- **api**: FastAPI + SQLAlchemy + SQLAdmin — فاز ۲ — کانتینر `varvpn-api`
- **worker**: جوهای پس‌زمینه (provisioning/اعلان) — فاز ۲ — کانتینر `varvpn-worker`
- **آداپتورها**: RADIUS / Payment / Telegram — هر کدام یک ماژول جدا، بدون میکروسرویس

## قوانین تغییرناپذیر

1. گروه‌های RADIUS فقط سهمیه ترافیک دارند؛ اگر گروه نبود → شکست امن، بدون ساخت خودکار.
2. تمدید: `new_quota = current_quota + purchased_quota` — مصرف هرگز ریست نمی‌شود (reset=never).
3. انقضا: `new_expiration = purchase_time + duration_days`.
4. پرداخت و provisioning آیدمپوتنت (idempotency key روی سفارش و پرداخت).
5. منبع حقیقت مصرف: `SUM(acctinputoctets + acctoutputoctets)` از `radacct`.
6. دیتابیس VAR جداست؛ اسکیمای radius هرگز تغییر نمی‌کند.
7. MVP تک‌سرور (آلمان ۱) اما همه جداول `server_id` دارند.
8. OVPN: یک قالب به‌ازای هر سرور، خروجی لحظه‌ای، بدون متریال خصوصی در گیت/فرانت/لاگ.

## وضعیت فعلی

| بخش | وضعیت |
|---|---|
| مینی‌اپ + Mock API (همه جریان‌ها) | ✅ انجام شده — در مرورگر و تلگرام (Menu Button) تست‌پذیر |
| داکرایز web | ✅ `Dockerfile` + `docker-compose.yml` |
| بک‌اند FastAPI | ⏳ فاز بعد — جای سرویس‌ها در compose رزرو شده |
| اتصال به radius تولیدی | ⏳ فقط بعد از چک‌لیست ۸ مرحله‌ای (داخل اپ: پروفایل → تست اتصال) |
