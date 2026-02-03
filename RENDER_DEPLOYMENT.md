# AcademiaPro - Render Deployment Guide

## 🚀 Deployment Steps

### 1. Push to GitHub
First, create a new repository on GitHub and push this code:

```bash
# If you don't have GitHub CLI installed:
# sudo apt install gh  # Ubuntu/Debian
# brew install gh      # macOS

# Create new repository
gh repo create academiapro --public --source=. --remote=origin

# Or if you prefer manual creation:
# 1. Create repo on GitHub manually
# 2. Add remote: git remote add origin https://github.com/yourusername/academiapro.git
# 3. Push: git push -u origin main
```

### 2. Deploy to Render

1. Go to [render.com](https://render.com)
2. Sign up/Login with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure as follows:

**Backend Service:**
- Name: `academiapro-backend`
- Environment: `Node`
- Build Command: `npm install && npx prisma generate && npm run build:server`
- Start Command: `npm run deploy:setup && npm start`
- Plan: Free
- Environment Variables (add these):
  - `DATABASE_URL` = your PostgreSQL connection string
  - `JWT_SECRET` = your secure JWT secret (min 32 characters)
  - `PORT` = 10000

**Frontend Service:**
- Name: `academiapro-frontend`
- Environment: `Static Site`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Plan: Free

### 3. Database Setup

You can use:
- **Supabase** (recommended - free tier)
- **Render's PostgreSQL** (paid but integrated)
- **Any PostgreSQL provider**

### 4. Environment Variables Required

```bash
# Database connection (PostgreSQL)
DATABASE_URL="postgresql://user:password@host:port/database"

# Security
JWT_SECRET="your-very-secure-jwt-secret-min-32-characters"

# Server port
PORT=10000
```

### 5. Post-Deployment Steps

After deployment:
1. Run database migrations and seeding:
   ```bash
   # Via Render shell or connect to your database directly
   npx prisma migrate deploy
   npx prisma db seed
   ```

2. Test the application:
   - Frontend: https://your-frontend-url.onrender.com
   - Backend API: https://your-backend-url.onrender.com/api/health

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Set up environment variables in .env
# DATABASE_URL, JWT_SECRET, PORT

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database
npm run seed

# Start development
npm run dev:all
```

## 🔐 Security Notes

- Never commit `.env` files
- Keep `JWT_SECRET` secure and at least 32 characters
- Use environment variables for all sensitive data
- Enable auto-deploy only after initial setup

## 🆘 Troubleshooting

**Build failures:**
- Check Node.js version (18+ required)
- Verify all dependencies install correctly
- Check build logs in Render dashboard

**Database connection issues:**
- Verify `DATABASE_URL` format
- Check database provider firewall settings
- Ensure database is accessible from Render

**Runtime errors:**
- Check application logs in Render
- Verify environment variables are set correctly
- Test locally first with same configuration