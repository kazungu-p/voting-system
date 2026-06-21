# Pro Voting System

A secure online voting system deployable on Vercel with a Neon PostgreSQL database.

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

### 2. Push this project to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/voting-system.git
git push -u origin main
```

### 3. Deploy to Vercel
1. Go to https://vercel.com and sign in with GitHub
2. Click **Add New > Project**, import your repo
3. Click **Deploy** (default settings are fine)

### 4. Add Environment Variables in Vercel
Go to your project → **Settings → Environment Variables** and add:

| Name | Value |
|------|-------|
| `DATABASE_URL` | Your Neon connection string |
| `ADMIN_USERNAME` | Your chosen admin username |
| `ADMIN_PASSWORD` | A strong password |
| `SESSION_SECRET` | A random 32+ char string (generate at https://generate-secret.vercel.app/32) |

Then go to **Deployments** and **Redeploy** so the env vars take effect.

### 5. Done!
- **Voter link:** `https://your-app.vercel.app`
- **Admin dashboard:** `https://your-app.vercel.app/admin.html`

## Distributing Voter Codes
After deploying, log in to the admin dashboard and click **Export Voter Codes (CSV)** to download all 2000 codes. Distribute one code per voter.

## Security Features
- Random 8-character voter codes (not sequential)
- Each code is single-use
- Admin credentials stored as environment variables (not in code)
- Rate limiting: max 10 vote attempts per IP per 15 minutes
- HTTP-only session cookies
- No sensitive data in the repository
