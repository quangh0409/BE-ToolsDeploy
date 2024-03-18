#!/bin/sh

SOURCE=/etc/nginx/templates/default.conf
TARGET=/etc/nginx/conf.d/default.conf

envsubst < $SOURCE > $TARGET
exec "$@"