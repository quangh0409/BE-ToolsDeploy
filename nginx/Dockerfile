FROM nginx:latest

WORKDIR /etc/nginx

COPY nginx/nginx.conf nginx.conf
COPY nginx/default.conf templates/default.conf
COPY nginx/entrypoint.sh /entrypoint.sh

ENTRYPOINT  ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]