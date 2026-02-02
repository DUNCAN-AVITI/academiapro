<div align="center">
<h1>AcademiaPro - Secure Academic Management Platform</h1>
<p>A comprehensive academic management system with role-based access control</p>
</div>

## 🚀 Quick Start

**Prerequisites:** Node.js 18+

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env`:
   ```bash
   DATABASE_URL="postgresql://postgres:password@localhost:5432/academiapro"
   JWT_SECRET="your-secure-jwt-secret-key"
   PORT=3000
   ```

3. Run database setup:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   npm run seed
   ```

4. Start development server:
   ```bash
   npm run dev:all
   ```

5. Open [http://localhost:5173](http://localhost:5173)

### Production Deployment with Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your database connection string
3. Run the setup script:
   ```bash
   ./setup-supabase.sh
   ```
4. Deploy to your preferred hosting platform (Vercel, Render, etc.)

## 📚 Features

- **Role-based Access Control** (Admin, Teacher, Student)
- **Assignment Management** with file uploads
- **Attendance Tracking**
- **Internal Messaging System**
- **Notification System**
- **Audit Logging**
- **Email Integration**

## 🔧 Available Scripts

- `npm run dev:all` - Start both frontend and backend in development
- `npm run build` - Build frontend for production
- `npm run build:server` - Build backend for production
- `npm start` - Start production server
- `npm run seed` - Seed database with sample data

## 🛡️ Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based authorization
- Audit logging for all actions

## 📖 Documentation

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.
