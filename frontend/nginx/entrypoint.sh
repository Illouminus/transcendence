#!/bin/sh

# Генерация SSL
if [ ! -f /etc/nginx/certs/selfsigned.key ]; then
  echo "🔐 Генерирую самоподписанный SSL-сертификат..."
  mkdir -p /etc/nginx/certs
  openssl req -x509 -nodes -days 365 \
    -subj "/C=FR/ST=42/L=Intra/O=School/CN=localhost" \
    -newkey rsa:2048 \
    -keyout /etc/nginx/certs/selfsigned.key \
    -out /etc/nginx/certs/selfsigned.crt
fi

echo "⏳ Жду 5 секунд, пока сервисы поднимутся..."
sleep 5

echo "🚀 Запускаю NGINX"
nginx -g "daemon off;"
