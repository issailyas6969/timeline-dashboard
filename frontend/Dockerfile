# --- Build stage ---
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Serve stage ---
# nginxinc/nginx-unprivileged is built to run as a non-root, arbitrary UID
# out of the box (listens on 8080, writes to paths it already owns) —
# this avoids the permission fights a stock nginx image has on OpenShift.
FROM nginxinc/nginx-unprivileged:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
