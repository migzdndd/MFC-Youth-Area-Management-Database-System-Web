# MFC Youth Area Management System - Setup & Deployment Guide

This step-by-step guide walks you through setting up Supabase, running local environments, and deploying your entire application (Frontend + Backend API) into **one single Vercel project** using the **Vercel Web Dashboard**.

---

## Prerequisites & Requirements

Ensure you have access to the following:
- **Git** installed on your computer (`git --version`)
- **GitHub Account** ([github.com](https://github.com))
- **Supabase Account** ([supabase.com](https://supabase.com))
- **Vercel Account** ([vercel.com](https://vercel.com))

---

## 1. Repository Setup & Version Control

### Step 1.1: Verify Local Repository
Open PowerShell or Terminal inside your project root (`MFC-Youth-Area-Management-System-Web`):

```bash
# Check status of files
git status

# Ensure default branch is main
git branch -M main
```

---

## 2. Supabase Setup (Database & Backend Services)

### Step 2.1: Supabase Project
1. Log in to [Supabase Dashboard](https://supabase.com/dashboard).
2. Open your production project (or create a new project).
3. Confirm your region (e.g., `Singapore - ap-southeast-1`).

### Step 2.2: Obtain API Keys & Project URL
1. Go to **Project Settings** > **API** in the Supabase Dashboard.
2. Copy the following credentials:
   - **Project URL**: `https://<project-ref>.supabase.co`
   - **`anon` public key**: For client authentication (`SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_ANON_KEY`).
   - **`service_role` secret key**: Confidential backend key (`SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY`).

### Step 2.3: Execute Database Migrations
1. In Supabase Dashboard, go to **SQL Editor**.
2. Click **New query**.
3. Open each file from `Backend/supabase/` in numerical order, paste into the SQL editor, and click **Run**:
   - `001_initial_schema.sql`
   - `002_seed_reference_data.sql`
   - `003_security_hardening.sql`
   - `004_servant_leader_password_policy.sql`
   - `005_cloud_modules.sql`
   - `006_campus_servant_admin_role.sql`
   - `007_area_kids_and_area_lit.sql`
   - `008_universal_service_catalog.sql`
   - `009_national_coordinator_and_school_fields.sql`
   - `010_mfc_high_servant.sql`
   - `011_lit_creative_ministries.sql`

---

## 3. Single-Project Vercel Web Dashboard Deployment

Deploying both Frontend and Backend together in **a single Vercel project** via the Web Dashboard eliminates the need for Vercel CLI.

### Step 3.1: Create & Import Project in Vercel
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** > **Project**.
3. Select **Continue with GitHub** (if prompted) and import `MFC-Youth-Area-Management-System-Web`.

### Step 3.2: Configure Project Settings
In the **Configure Project** screen:

1. **Project Name**: `mfc-youth-area-management-system`
2. **Framework Preset**: Select **Other** / **No Framework**.
3. **Root Directory**: Leave as `./` (do NOT set to `Frontend` or `Backend`).
4. Expand **Build and Output Settings**:
   - **Build Command**: Leave empty / default.
   - **Output Directory**: Leave default (the root `vercel.json` handles static file and serverless API routing).

### Step 3.3: Set Environment Variables in Vercel
In the **Environment Variables** section (or go to **Project Settings** > **Environment Variables** in Vercel):

Add the following keys (available for Production, Preview, and Development):

| Variable Name | Type / Sensitivity | Description | Example / Location |
|---|---|---|---|
| `SUPABASE_URL` | **Config (Plain Text)** | Your Supabase project URL | `https://YOUR_PROJECT_REF.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | **Config (Plain Text)** | Public / Anon API Key (client-safe) | `sb_publishable_...` (Supabase API Settings) |
| `SUPABASE_SECRET_KEY` | **Secret (Sensitive)** | Backend Service Role Key (bypasses RLS) | `sb_secret_...` (Supabase API Settings) |
| `ADMIN_REGISTRATION_CODE` | **Secret (Sensitive)** | Private code for Servant Leader registration | Private passcode |

> [!IMPORTANT]
> If these variables are not configured in Vercel, auth login and cloud sync endpoints will return `503 Backend is not configured` / `Backend request failed`. After adding or updating variables in Vercel Settings, remember to click **Redeploy** on your latest deployment.

---

## 4. Single-Project Monorepo Routing (`vercel.json`)

The repository includes a root `vercel.json` that routes:
- `/api/*` requests directly to `Backend/api/router.js` (as a Vercel Serverless Function).
- All other routes (`/*`) to the static website files inside `Frontend/`.

Make sure `vercel.json` exists in your repository root before pushing to GitHub.

---

## 5. Supabase Authentication Redirect Configuration

1. Log in to [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **Authentication** > **URL Configuration**.
3. Set **Site URL**: `https://mfc-youth-area-management-system.vercel.app` (replace with your live production URL).
4. Under **Redirect URLs**, add:
   - `https://mfc-youth-area-management-system.vercel.app/**`
   - `http://localhost:5500/**`
5. Click **Save**.

---

## 6. Post-Deployment Verification

1. Open your Vercel URL in your browser: `https://mfc-youth-area-management-system.vercel.app`.
2. Test user registration (`register.html`) and login (`index.html`).
3. Verify backend API health by opening: `https://mfc-youth-area-management-system.vercel.app/api/health`.
4. Open browser DevTools (F12) to ensure there are no network or CORS errors.

---

## 7. Staging-to-Production Workflow

```
[ Local Dev ] ---> [ Test Site (main branch) ] ---> [ Live Production ]
                       (mfc-youth-ams-test-site)       (MFC-Youth-Area-Management-System-Web)
```

1. **Test Site Updates**: Pushing changes to `main` in `MFC-Youth-AMS-Test-Site` automatically deploys updates on the test site Vercel environment.
2. **Production Merge**: Once verified on the test site, merge clean commits into your main production repository ([MFC-Youth-Area-Management-System-Web](https://github.com/migzdndd/MFC-Youth-Area-Management-System-Web)).

---

## 8. Git Commands for Committing & Pushing

Run these commands in PowerShell or Terminal to keep your repository updated:

```bash
git status
git add SETUP_AND_DEPLOYMENT_GUIDE.md
git commit -m "docs(setup): update guide for production vercel web dashboard deployment"
git push origin main
```
