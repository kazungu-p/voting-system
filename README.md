# Pro Voting System

Secure online voting using national ID numbers. Built for Vercel + Neon PostgreSQL.

## How it works
- Voters enter their 8-digit national ID number and select a candidate
- Each ID can only vote once (stored as a salted hash — the actual ID is never saved)
- Admin can view live results at `/admin.html`

## Candidates
- Seth Opollo
- Victor Wanyama
- Ojay
- Fatuma Kapera

## Deploy in 5 Steps

### 1. Create a Neon Database (free)
1. Go to https://neon.tech and sign up
2. Create a new project
3. Copy the **Connection string** (starts with `postgresql://...`)

### 2. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/voting-system.git
git push -u origin main
```

### 3. Deploy to Vercel
1. Go to https://vercel.com → **Add New > Project** → import your repo
2. Click **Deploy**

### 4. Add Environment Variables in Vercel
Go to **Settings → Environment Variables**:

| Name | Value |
|------|-------|
| `DATABASE_URL` | Your Neon connection string |
| `ADMIN_USERNAME` | Your chosen admin username |
| `ADMIN_PASSWORD` | A strong password |
| `SESSION_SECRET` | Random string from https://generate-secret.vercel.app/32 |

Then **Deployments → Redeploy**.

### 5. Done!
- **Voter link:** `https://your-app.vercel.app`
- **Admin dashboard:** `https://your-app.vercel.app/admin.html`

## Security
- ID numbers are never stored — only a salted SHA-256 hash
- Rate limiting: max 10 attempts per IP per 15 minutes
- Admin credentials in environment variables
- HTTP-only session cookies
