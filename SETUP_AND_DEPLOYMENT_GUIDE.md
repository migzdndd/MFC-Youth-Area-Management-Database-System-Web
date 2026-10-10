# MFC Youth Area Management System - Setup & Deployment Guide

This step-by-step guide walks you through setting up Supabase, running local environments, and deploying your entire application (React 19 Frontend + Serverless API) into a single Vercel project using the Vercel Web Dashboard.

---

## Prerequisites & Requirements

Ensure you have access to the following:
- **Git** installed on your computer (`git --version`)
- **Node.js** (v20+ recommended)
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
   - `012_rate_limits_and_lockouts.sql`
   - `013_member_avatar.sql`
   - `014_authenticated_role_permissions.sql`
   - `015_disable_legacy_recursive_policies.sql`
   - `016_domain_moderator_rls_scoping.sql`
   - `017_event_participants_non_members.sql`

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
3. **Root Directory**: Leave as `./` (do not set to `frontend-react` or `Backend`).
4. Expand **Build and Output Settings**:
   - Leave default settings. The root `vercel.json` coordinates building `frontend-react` with `@vercel/static-build` and `Backend/api/router.js` with `@vercel/node`.

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
> If these variables are not configured in Vercel, auth login and cloud sync endpoints will return `503 Backend is not configured` / `Backend request failed`. After adding or updating variables in Vercel Settings, click **Redeploy** on your latest deployment.

---

## 4. Single-Project Monorepo Routing (`vercel.json`)

The repository includes a root `vercel.json` that routes:
- `/api/*` requests directly to `Backend/api/router.js` (as a Vercel Serverless Function).
- `/assets/*` and static assets to `frontend-react/dist`.
- All other routes (`/*`) to `frontend-react/index.html` for single-page client routing.

---

## 5. Supabase Authentication Redirect Configuration

1. Log in to [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **Authentication** > **URL Configuration**.
3. Set **Site URL**: `https://mfc-youth-area-management-system.vercel.app` (replace with your live production URL).
4. Under **Redirect URLs**, add:
   - `https://mfc-youth-area-management-system.vercel.app/**`
   - `http://localhost:5173/**`
   - `http://localhost:3000/**`
5. Click **Save**.

---

## 6. Post-Deployment Verification

1. Open your Vercel URL in your browser: `https://mfc-youth-area-management-system.vercel.app`.
2. Test user registration (`/register`) and login (`/login`).
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

## 8. Containerized Deployment & CI/CD Pipelines

### 8.1 Docker Container Setup
To run the application locally or deploy to containerized hosts:

```bash
# Build Docker image
docker build -t mfc-youth-app .

# Run with Docker Compose
docker-compose up -d
```

Access the application at `http://localhost:3000` and API health check at `http://localhost:3000/api/health`.

### 8.2 GitHub Actions CI/CD Pipeline
The repository includes automated CI/CD (`.github/workflows/ci-cd.yml`):
1. **Lint & Syntax Check**: Automatically runs node syntax and TypeScript validation.
2. **Security Audit**: Runs `npm audit` on backend dependencies.
3. **Docker Build Verification**: Validates container image build integrity.
4. **PaaS Deployment Trigger**: Connects seamlessly with Vercel git-backed deployments.
