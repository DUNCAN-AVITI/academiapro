#!/bin/bash

# Supabase Deployment Setup Script

echo "🚀 Setting up AcademiaPro for Supabase deployment..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    echo "Please set your Supabase database connection string:"
    echo "export DATABASE_URL='postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres'"
    exit 1
fi

# Check if JWT_SECRET is set
if [ -z "$JWT_SECRET" ]; then
    echo "❌ JWT_SECRET environment variable is not set"
    echo "Please set a secure JWT secret (at least 32 characters):"
    echo "export JWT_SECRET='your-very-secure-jwt-secret-key-here'"
    exit 1
fi

echo "✅ Environment variables found"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run migrations
echo "📋 Running database migrations..."
npx prisma migrate dev --name init

# Seed database
echo "🌱 Seeding database..."
npm run seed

# Build frontend
echo "🏗️  Building frontend..."
npm run build

# Build backend
echo "⚙️  Building backend..."
npm run build:server

echo "✅ Setup complete!"
echo "You can now start the server with: npm start"