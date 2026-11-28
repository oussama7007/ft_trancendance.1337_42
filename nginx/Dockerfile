FROM nginx:1.28-alpine

RUN apk add --no-cache openssl && mkdir /etc/nginx/ssl && openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
    -keyout /etc/nginx/ssl/irent.key -out /etc/nginx/ssl/irent.crt -subj "/CN=localhost"

COPY nginx.conf /etc/nginx/conf.d/default.conf
