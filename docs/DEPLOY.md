# VAR VPN — راهنمای استقرار (لوکال → سرور → تلگرام)

> سند معماری (`ARCHITECTURE`) source of truth است. این فایل فقط مسیر عملیِ بالاآوردن مینی‌اپ است.

---

## ۱) نقشه کلی — چه چیزی کجا اجرا می‌شود

| جزء | محل اجرا | وضعیت |
|---|---|---|
| مینی‌اپ (React) | کانتینر `varvpn-web` (nginx) | ✅ آماده — همین مخزن |
| بک‌اند FastAPI + Worker | کانتینرهای `varvpn-api` / `varvpn-worker` | فاز ۲ — جای آن‌ها در `docker-compose.yml` رزرو شده |
| دیتابیس VAR (`var_business`) | MariaDB **هاست** (کاربر `var_app`) | فاز ۲ |
| FreeRADIUS | **هاست** — هرگز کانتینر نمی‌شود | موجود — دست نزنید |
| دیتابیس `radius` | MariaDB **هاست** | موجود — فقط خواندنی |
| daloRADIUS | کانتینر موجود خودش | موجود — **هرگز** `docker compose down` روی آن نزنید |

ترافیک:
```
تلگرام → https://app.DOMAIN → nginx هاست (TLS) → 127.0.0.1:8090 → varvpn-web
```

---

## ۲) همه چیزهایی که باید بگیرید/بسازید (چک‌لیست)

| # | مورد | از کجا | هزینه | کجا ذخیره شود |
|---|---|---|---|---|
| ۱ | توکن بات تلگرام | `@BotFather` → `/newbot` | رایگان | `.env` روی سرور |
| ۲ | دامنه | nic.ir برای `.ir` یا Namecheap — **یا رایگان: DuckDNS (بخش ۵٫۱)** | سالانه/رایگان | رکورد DNS: `A → 54.37.106.132` |
| ۳ | گواهی HTTPS | Let's Encrypt با certbot (خودکار و رایگان) | رایگان | خود certbot مدیریت می‌کند |
| ۴ | درگاه پرداخت | زرین‌پال/نکست‌پی (ثبت‌نام → کد مرچنت) — فعلاً لازم نیست | رایگان | `.env` روی سرور |
| ۵ | کاربر دیتابیس VAR | خودتان روی سرور می‌سازید (بخش ۶) | — | `.env` روی سرور |
| ۶ | کاربر خواندنی radius | خودتان — **بعد از بکاپ و تأیید** | — | `.env` روی سرور |

> **هیچ‌کدام از اینها وارد Git نمی‌شود.** در مخزن فقط `.env.example` (خالی) هست.

### ثبت بات در BotFather (دقیق)
1. در تلگرام: `@BotFather` → دستور `/newbot`
2. نام نمایشی: `VAR VPN` — یوزرنیم: چیزی مثل `varvpn_bot` (باید به `bot` ختم شود)
3. توکن را کپی کنید (شبیه `7123456789:AAH...`) — این یعنی «کلید بات»
4. (بعد از بالاآمدن HTTPS) — `/mybots` → انتخاب بات → **Bot Settings → Menu Button → Configure Menu Button**
5. آدرس `https://app.DOMAIN` را بدهید و عنوان بگذارید: `خرید اکانت`
6. حالا در چت `t.me/varvpn_bot` زیر محل تایپ، دکمه‌ی مینی‌اپ ظاهر می‌شود.

اختیاری برای ظاهر حرفه‌ای: `/setdescription` ، `/setabouttext` ، `/setuserpic`.

---

## ۳) لوکال: گیت کردن پروژه

```bash
git init
git add -A
git status          # مطمئن شوید .env در لیست نیست (هنوز نساخته‌اید — عالی)
git commit -m "VAR VPN mini app — web"

# مخزن خصوصی در GitHub/GitLab بسازید سپس:
git remote add origin git@github.com:USER/var-vpn.git
git push -u origin main
```

فایل‌های داکر همین مخزن: `Dockerfile` ، `docker-compose.yml` ، `nginx/default.conf` ، `scripts/deploy.sh`.

---

## ۴) سرور: نصب Docker و بالاآوردن (یک‌بار)

```bash
# نصب Docker (اگر نیست)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # بعد re-login

# کلون
cd /opt
sudo git clone git@github.com:USER/var-vpn.git
sudo chown -R $USER:$USER var-vpn
cd var-vpn

# فایل اسرار (فقط همین‌جا — هرگز گیت نشود)
cp .env.example .env
nano .env        # فعلاً فقط TELEGRAM_BOT_TOKEN لازم است؛ بقیه برای فاز ۲

# بیلد و اجرا
docker compose up -d --build web

# بررسی
curl http://127.0.0.1:8090/healthz      # باید بگوید: ok
docker logs varvpn-web
```

> کانتینر فقط روی `127.0.0.1:8090` گوش می‌دهد — از بیرون مستقیم قابل‌دسترسی نیست تا TLS اضافه شود.

---

## ۵) دامنه + HTTPS (بدون دست‌زدن به daloRADIUS)

یک **vhost جدید** کنار vhost فعلی دالاردیوس می‌سازیم — به فایل‌های موجود دست نمی‌زنیم.

```bash
sudo nano /etc/nginx/sites-available/varvpn
```
```nginx
server {
    listen 80;
    server_name app.YOURDOMAIN.com;

    location / {
        proxy_pass http://127.0.0.1:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/varvpn /etc/nginx/sites-enabled/
sudo nginx -t                    # اگر dalo با apache است نه nginx، این بخش را با apache vhost معادل انجام دهید
sudo systemctl reload nginx
sudo certbot --nginx -d app.YOURDOMAIN.com    # certbot خودش 443 و redirect را اضافه می‌کند
```

سپس در BotFather طبق بخش ۲، Menu Button را روی `https://app.YOURDOMAIN.com` تنظیم کنید. **تمام — مینی‌اپ داخل تلگرام باز می‌شود.**

### ۵٫۱) دامنه و SSL ندارید؟ — راه‌حل کاملاً رایگان (DuckDNS + Let's Encrypt)

تلگرام برای بازکردن مینی‌اپ حتماً **HTTPS** می‌خواهد، ولی لازم نیست دامنه بخرید:

1. **زیردامنه رایگان:** در [duckdns.org](https://www.duckdns.org) با اکانت گوگل/گیت‌هاب لاگین کنید و یک زیردامنه مثل `myvpn.duckdns.org` بسازید. توکن API را کپی کنید.

2. **آپدیت خودکار IP** (چون IP سرور ممکن است عوض شود) — روی سرور:
   ```bash
   echo 'YOUR_DUCKDNS_TOKEN' > ~/duck.token
   crontab -e
   # این خط را اضافه کنید:
   */5 * * * * curl "https://www.duckdns.org/update?domains=myvpn&token=$(cat ~/duck.token)&ip=" >/dev/null 2>&1
   ```

3. **گواهی SSL رایگان** برای همان زیردامنه:
   ```bash
   sudo certbot certonly --standalone -d myvpn.duckdns.org
   ```
   سپس در vhost بخش ۵، `server_name myvpn.duckdns.org;` بگذارید و certbot را با `--nginx` اجرا کنید تا 443 را خودش اضافه کند.

4. در BotFather، Menu Button را روی `https://myvpn.duckdns.org` تنظیم کنید.

> **نکته:** DuckDNS فقط زیردامنه می‌دهد و برای شروع و تست کاملاً کافی است. هر وقت خواستید برند خودتان را داشته باشید، دامنه بخرید و فقط `server_name` و Menu Button را عوض کنید — بقیه پیکربندی دست نمی‌خورد.

---

## ۶) فاز ۲: آماده‌سازی دیتابیس‌ها (قبل از بک‌اند)

```sql
-- دیتابیس کسب‌وکار VAR (جدای کامل از radius)
CREATE DATABASE var_business CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'var_app'@'localhost' IDENTIFIED BY 'PASS-قوی';
GRANT ALL PRIVILEGES ON var_business.* TO 'var_app'@'localhost';

-- ⚠️ فقط بعد از بکاپ و تأیید — کاربر خواندنی روی radius
CREATE USER 'var_ro'@'localhost' IDENTIFIED BY 'PASS-قوی';
GRANT SELECT ON radius.* TO 'var_ro'@'localhost';
FLUSH PRIVILEGES;
```
```bash
# بکاپ اجباری قبل از هر کاری با radius:
mariadb-dump radius > /root/backup/radius_$(date +%F).sql
```

---

## ۷) آپدیت‌های بعدی (روتین — بدون SSH روزانه)

```bash
# لوکال: تغییر → git push
# سرور (یا با CI):
cd /opt/var-vpn && ./scripts/deploy.sh
```
اسکریپت فقط `web` را rebuild/restart می‌کند و health check می‌گیرد.

---

## ۸) خط قرمزهای عملیاتی

- ⛔ `docker compose down` روی سرویس‌های موجود / پروژه دالاردیوس
- ⛔ توقف یا ریستارت FreeRADIUS بدون تأیید
- ⛔ تغییر اسکیمای دیتابیس `radius` از مسیر VAR
- ⛔ commit کردن `.env` ، توکن‌ها، secret یا کلید خصوصی
- ⛔ لاگ کردن پسورد/توکن (سمت بک‌اند هم بعداً رعایت شود)

## ۹) عیب‌یابی سریع

| مشکل | بررسی |
|---|---|
| `curl 8090` جواب نمی‌دهد | `docker ps` و `docker logs varvpn-web` |
| 502 در مرورگر | vhost هاست و `nginx -t`؛ مطمئن شوید کانتینر بالاست |
| تلگرام خطای URL می‌دهد | URL باید **https** با گواهی معتبر باشد؛ `curl -I https://...` را چک کنید |
| دکمه Menu Button نیست | در BotFather → Bot Settings → Menu Button فعال و آدرس https ذخیره شده باشد |
| هوش‌سنجی هویت کاربر | فعلاً حالت دمو؛ در فاز ۲ بک‌اند `initData` را با توکن بات اعتبارسنجی می‌کند |
