#!/bin/bash

# Clean restart script for Next.js development server
echo "🧹 Cleaning Next.js cache and restarting development server..."

# Navigate to frontend directory
cd frontend

# Remove .next cache directory
if [ -d ".next" ]; then
    echo "🗑️  Removing .next cache directory..."
    rm -rf .next
fi

# Remove node_modules/.cache if it exists
if [ -d "node_modules/.cache" ]; then
    echo "🗑️  Removing node_modules cache..."
    rm -rf node_modules/.cache
fi

# Clear npm cache
echo "🗑️  Clearing npm cache..."
npm cache clean --force

# Install dependencies (if needed)
echo "📦 Installing dependencies..."
npm install

# Start development server
echo "🚀 Starting development server..."
npm run dev