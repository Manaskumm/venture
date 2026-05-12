# Hosting Guide: Venture AI

Hosting a Next.js application with Prisma and Clerk involves three main steps: Preparing the code, setting up the database, and deploying to a platform (Vercel is recommended).

## 1. Prepare Your Repository
The easiest way to host is to connect your local project to a GitHub repository.

1. **Initialize Git (if not already done):**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
2. **Create a new repository on GitHub** and push your code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/aiapp.git
   git branch -M main
   git push -u origin main
   ```

## 2. Setup the Database (PostgreSQL)
Since you are using Prisma with PostgreSQL, you need a hosted database.
- **Vercel Postgres (Recommended)**: Integrated directly into Vercel.
- **Supabase**: Since your `.env.local` already shows a Supabase URL, you can continue using it for production or create a new project there.

## 3. Deploy to Vercel
Vercel is the creator of Next.js and provides the best deployment experience.

1. **Sign up at [vercel.com](https://vercel.com).**
2. **Import your GitHub repository.**
3. **Configure Environment Variables:** Add these from your `.env.local` to the Vercel Dashboard:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `GEMINI_API_KEY`
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - `SERPAPI_KEY`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
4. **Build Settings:**
   - **Install Command:** `npm install`
   - **Build Command:** `prisma generate && next build`

## 4. Post-Deployment Steps
1. **Database Migrations:** After the first deployment, ensure your database schema is updated.
   ```bash
   npx prisma db push
   ```
2. **Clerk Domain:** Update your Clerk dashboard with the new production URL (e.g., `aiapp.vercel.app`) to allow logins on the live site.
