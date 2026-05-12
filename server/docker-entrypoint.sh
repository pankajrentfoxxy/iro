#!/bin/sh
set -e

echo "iro-server DB bootstrap: prisma generate"
npx prisma generate

if [ -d prisma/migrations ] && [ -n "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  echo "Applying migrations (prisma migrate deploy)"
  npx prisma migrate deploy
else
  echo "No prisma/migrations; syncing schema with prisma db push"
  npx prisma db push
fi

exec "$@"
