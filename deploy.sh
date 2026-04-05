#!/bin/bash

# 🚀 Yalla Wedding App — Deploy Script
# Usage: ./deploy.sh

set -e

echo "🔄 Pulling latest changes from Git..."
git pull origin main

echo "🏗️  Building frontend..."
cd frontend
npm run build
cd ..

echo "📦 Installing backend dependencies..."
cd backend
npm install --production=false

echo "🗄️  Running database migrations..."
npx prisma migrate deploy
npx prisma generate

echo "⚡ Restarting API server..."
~/.npm-global/bin/pm2 restart yalla-api

echo "✅ Deployment complete!"
echo "🌐 Server: http://187.77.80.103:3001"
echo ""
~/.npm-global/bin/pm2 status
