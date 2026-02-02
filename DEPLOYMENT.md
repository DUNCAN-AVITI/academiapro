# AcademiaPro Supabase Deployment Guide

## 🚀 Quick Deployment with Supabase

### 1. Set up Supabase Database

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get your database connection string from Project Settings → Database
4. Your connection string will look like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

### 2. Environment Variables Required

```bash
# Database (from Supabase)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Security
JWT_SECRET="your-very-secure-jwt-secret-min-32-characters"

# Server
PORT=3000
```

### 3. Deploy Options

#### Option 1: Vercel (Frontend) + Render/Railway (Backend)
- **Frontend**: Deploy to Vercel (free)
- **Backend**: Deploy to Render or Railway with Supabase DB
- **Database**: Supabase (free tier available)

#### Option 2: Single Platform Deployment
Deploy the entire app to Render or Railway with Supabase database.

### 4. Database Setup

After setting your DATABASE_URL:

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed the database
npm run seed
```

## 🛠️ Local Development with Supabase

1. Update your `.env` file with Supabase connection string
2. Run the setup commands above
3. Start development server:
   ```bash
   npm run dev:all
   ```

## 🔧 Production Commands

```bash
# Build frontend
npm run build

# Build backend
npm run build:server

# Start production server
npm start
```

## 🆘 Troubleshooting

**Database connection issues:**
- Verify `DATABASE_URL` format from Supabase
- Check Supabase project status
- Ensure network access

**Build failures:**
- Check Node.js version (18+)
- Clear node_modules and reinstall

## 🔐 Security Notes

- Keep your `JWT_SECRET` secure and at least 32 characters
- Never commit `.env` files to version control
- Use Supabase's built-in authentication for additional security