# MFC Youth Area Management System

A cloud-based web application and pastoral management platform engineered for **Missionary Families for Christ (MFC) Youth**. The system streamlines youth membership tracking, household pastoral groupings, chapter administration, event registrations, service cataloging, and ministry analytics.

---

## Executive Summary

The **MFC Youth Area Management System (AMS)** serves as a central operational platform for servant leaders, chapter heads, and area coordinators. Designed around Christian community governance and statutory data privacy compliance, the application enables secure pastoral tracking, event management, and ministry record-keeping across chapters and areas.

---

## Key Features & Capabilities

### Member & Pastoral Profile Management
- **Youth Directory**: Complete records for MFC Youth (ages 13 to 21, plus Heartchamps), including contact details, residential addresses, emergency contacts, academic tracks, and chapter assignments.
- **Pastoral Grouping & Households**: Track household membership, household heads, and pastoral growth milestones across area chapters.
- **Academic Tracks**: Scoped tracks for College, Senior High School, Junior High School (Grades 7 to 10), and Heartchamps.

### 4-Tier Role-Based Access Control (RBAC)
- **Tier 1 - Area Administrators**: Full area visibility and oversight for National Coordinators, Area Servants, and Couple Coordinators.
- **Tier 2 - Domain Moderators**: Scoped views for specialized ministries:
  - **LIT Servant**: 5 Creative Ministries (Music, Dance, Graphics & Promo, Creative Writing, Photography & Videography).
  - **Campus Servant**: College and Senior High School youth.
  - **MFC High Servant**: Junior High School youth (Grades 7 to 10).
  - **Area Kids Servant**: Heartchamps transitioning into youth ministry.
- **Tier 3 - Chapter Leaders**: Scoped to the specific chapter for Chapter Servants and Assistant Chapter Servants.
- **Tier 4 - Core Servants & Members**: Personal profile and event attendance portal for general members.

### Creative Ministries (LIT) Service Catalog
- **The 5 Pillars**: Dedicated management and servant assignments for Music, Dance, Graphics & Promo, Creative Writing, and Photography & Videography. Unmentioned non-creative services are purged from active catalogs.

### Event & Activity Management
- **Event Registrations**: Manage youth camps, conferences, area assemblies, and leadership trainings.
- **Attendance & Fee Tracking**: Record event participation, fee statuses (free vs paid), and check-in logs.

### GIG (Give It Generously) & Financial Stewardship
- **Stewardship Tracking**: Log community contributions, tithes, and pastoral support records.
- **Pastoral Analytics**: Generate area reports and summary metrics for community coordination.

---

## Technical Architecture

```
                                +-----------------------------------+
                                |    Client Application (PWA)       |
                                |   React 19 / TypeScript / Vite    |
                                |      Tailwind CSS / Lucide        |
                                +-----------------+-----------------+
                                                  |
                                                  | HTTPS / REST JSON
                                                  v
                                +-----------------+-----------------+
                                |  Vercel Serverless Functions API  |
                                |       Node.js 24.x (/api/*)       |
                                +-----------------+-----------------+
                                                  |
                                                  | Service Role / RLS
                                                  v
                                +-----------------+-----------------+
                                |        Supabase Cloud DB          |
                                |   PostgreSQL + Security Rules     |
                                +-----------------------------------+
```

### Technology Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide React icons, React Router, Zustand for state management.
- **Backend API**: Node.js (Vercel Serverless Functions running on Node 24.x runtime).
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS) policies, multi-stage schema migrations, and encrypted session handling.
- **Native Packaging**: Ready for mobile compilation via Capacitor 6 and desktop packaging via Tauri 2.

---

## Repository Structure

```
MFC-Youth-Area-Management-System-Web/
├── .github/                  # GitHub Actions CI/CD & Dependabot updates
├── Backend/                  # Vercel Serverless API functions & Supabase migrations
│   ├── api/                  # Main API gateway router (router.js)
│   ├── server/               # Modular route handlers (members, chapters, events, services)
│   ├── supabase/             # SQL schema migrations (001_initial_schema to 016_...)
│   └── package.json
├── frontend-react/           # Modern React 19 Single-Page Application
│   ├── public/               # Static assets, branding logos, PWA manifest
│   ├── src/
│   │   ├── components/       # Shared UI primitives (Header, Sidebar, Modals, Nav)
│   │   ├── pages/            # View components (Dashboard, Members, Chapters, Services, etc.)
│   │   ├── services/         # API integration clients (auth, members, sync, etc.)
│   │   ├── stores/           # Zustand global state (auth, session)
│   │   ├── types/            # TypeScript interfaces
│   │   ├── App.tsx           # Application root and route configuration
│   │   └── main.tsx          # Client entry point
│   ├── index.html            # Vite HTML template
│   ├── vite.config.ts        # Vite configuration and backend API proxy
│   └── package.json
├── docs/                     # Technical, architectural, and legal documentation
├── .env.example              # Environment variable template
├── SETUP_AND_DEPLOYMENT_GUIDE.md # Complete deployment walkthrough
├── vercel.json               # Monorepo rewrite rules and single-project routing
└── package.json              # Root package metadata & helper scripts
```

---

## Quick Start & Development

### 1. Prerequisites
- Node.js 20+ (Node 24 recommended)
- Supabase account with project credentials

### 2. Install Dependencies
```bash
# Install root, backend, and frontend dependencies
npm install
npm --prefix frontend-react install
npm --prefix Backend install
```

### 3. Local Development
```bash
# Option A: Start both API and React frontend concurrently
npm run dev:modern

# Option B: Run frontend only (proxies /api to localhost:3000)
npm --prefix frontend-react run dev
```

### 4. Build Production Bundle
```bash
npm --prefix frontend-react run build
```
