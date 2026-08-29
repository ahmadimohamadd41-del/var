# VAR VPN — Telegram Mini App

مینی‌اپ فروش اکانت VPN روی FreeRADIUS موجود — معماری Modular Monolith.

## اجرا

```bash
# لوکال (dev)
npm install && npm run dev

# داکر (prod — همان چیزی که روی سرور اجرا می‌شود)
docker compose up -d --build web
curl http://127.0.0.1:8090/healthz
```

## استقرار روی سرور + تلگرام

راهنمای کامل (گیت، داکر، دامنه، HTTPS، BotFather، دیتابیس‌ها، خط قرمزها):

👈 **[docs/DEPLOY.md](docs/DEPLOY.md)**

## اسرار

فقط `.env.example` در مخزن است. فایل `.env` واقعی **هرگز** گیت نمی‌شود و فقط روی سرور ساخته می‌شود.
