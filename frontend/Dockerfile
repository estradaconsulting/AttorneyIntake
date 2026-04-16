# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
# Leave VITE_API_URL unset so the app defaults to relative /api paths.
# nginx proxies /api/ → http://api:8080 internally, avoiding cross-origin calls entirely.
# To point at an external API host, pass: --build-arg VITE_API_URL=https://api.example.com
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ── Runtime stage (nginx) ─────────────────────────────────────────────────────
FROM nginx:alpine AS final
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
