#!/usr/bin/env bash
# ============================================================
# VAR VPN — استقرار روی سرور (بدون SSH روزانه: git push → این اسکریپت)
# فقط سرویس web از پروژه varvpn را لمس می‌کند.
# ⛔ به کانتینر daloRADIUS و سرویس‌های هاست دست نمی‌زند.
# ============================================================
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> git pull"
git pull --ff-only

echo "==> docker build (web)"
docker compose build web

echo "==> restart web (zero-touch برای بقیه سرویس‌ها)"
docker compose up -d --no-deps web

sleep 2
echo "==> health check"
if curl -fsS http://127.0.0.1:8090/healthz >/dev/null; then
  echo "✅ varvpn-web is up — http://127.0.0.1:8090"
else
  echo "❌ health check failed — docker logs varvpn-web" >&2
  exit 1
fi

# تمیزکاری imageهای قدیمی (فقط dangling)
docker image prune -f >/dev/null 2>&1 || true
