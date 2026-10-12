# syntax=docker/dockerfile:1
# Build stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build-only
# Set GID 0 for OpenShift compatibility (arbitrary UID requirement)
RUN chgrp -R 0 /app/dist && chmod -R g=u /app/dist

# Runtime stage - nginx for serving static assets
FROM nginx:1.27-alpine3.20
# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf
# Create nginx config for the Vue app
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
  listen 8080;
  listen [::]:8080;
  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  # Serve static assets with cache headers
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
  }

  # SPA routing - serve index.html for all non-asset requests
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Deny access to hidden files
  location ~ /\. {
    deny all;
  }
}
EOF

# Copy built app from build stage
COPY --from=build --chown=101:101 /app/dist /usr/share/nginx/html

# Ensure dist files are readable by nginx (user 101)
RUN chmod -R 755 /usr/share/nginx/html

# Set up nginx for non-root execution and OpenShift compatibility
RUN mkdir -p /var/cache/nginx/client_temp /var/cache/nginx/proxy_temp /var/cache/nginx/fastcgi_temp /var/cache/nginx/uwsgi_temp /var/cache/nginx/scgi_temp && \
    chgrp -R 0 /var/cache/nginx /var/run && \
    chmod -R 777 /var/cache/nginx /var/run && \
    chgrp -R 0 /var/log/nginx && \
    chmod -R 777 /var/log/nginx

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O- http://localhost:8080 || exit 1

EXPOSE 8080
USER 101
