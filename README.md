# Derick's WishTree

A small family wish tree made for Derick, built with Next.js, Prisma, and PostgreSQL.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and add your Neon connection strings:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST-pooler.REGION.aws.neon.tech/DBNAME?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST.REGION.aws.neon.tech/DBNAME?sslmode=require"
AUTH_SECRET="replace-with-a-long-random-secret"
DERICK_PASSWORD="replace-with-derick-password"
PARENT_PASSWORD="replace-with-parent-password"
```

Use Neon's pooled connection for `DATABASE_URL` and direct connection for `DIRECT_URL`.

3. Push the Prisma schema to the database:

```bash
npm run prisma:push
```

4. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

Without `.env`, the app shows demo wishes so the UI can still be previewed.

## Deploy to Vercel

Add these environment variables in Vercel:

- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_SECRET`
- `DERICK_PASSWORD`
- `PARENT_PASSWORD`

The `postinstall` script runs `prisma generate` during deployment.

## GitHub prep

This project intentionally ignores local secrets and generated files:

- `.env`
- `.env*.local`
- `.next`
- `node_modules`
- `*.log`

Before pushing to GitHub, run:

```bash
npm run build
```

Then initialize and push the repo if it is not already a Git repository:

```bash
git init
git add .
git commit -m "Initial WishTree app"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```
# WishTree
