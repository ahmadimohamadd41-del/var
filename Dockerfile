# ============================================================
# VAR VPN — Mini App (frontend)
# Build:  node → static files
# Serve:  nginx (SPA + /api reverse-proxy + /healthz)
# این کانتینر فقط وب است؛ FreeRADIUS و MariaDB روی هاست می‌مانند.
# ============================================================

# ---------- stage 1: build ----------
FROM node:20-alpine AS build
WORKDIR /app

# install deps first (layer cache)
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# build the app
COPY . .
RUN npm run build

# ---------- stage 2: serve ----------
FROM nginx:1.27-alpine

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
