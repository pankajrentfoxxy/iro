#!/bin/bash
# IRO deploy script - run on VPS: ./deploy.sh
set -e
cd "$(dirname "$0")"
echo "Pulling latest code..."
git pull origin main
echo "Building and starting containers..."
docker compose up -d --build
echo "Done. Status:"
docker compose ps
