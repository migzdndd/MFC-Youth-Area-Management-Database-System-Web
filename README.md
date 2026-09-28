# MFC Youth Area Management System

A cloud-based web application and management platform engineered for **Missionary Families for Christ (MFC) Youth & Kids Ministries**. The system streamlines youth membership tracking, household pastoral groupings, chapter administration, event registrations, service cataloging, and ministry analytics.

---

## Executive Summary

The **MFC Youth Area Management System** serves as a central operational platform for servant leaders, chapter heads, and area coordinators. Designed around Christian community governance and statutory data privacy compliance, the application enables secure pastoral tracking, event management, and ministry record-keeping across chapters and areas.

---

## Key Features & Capabilities

### Member & Pastoral Profile Management
- **Youth & Kids Directory**: Complete records for MFC Kids (ages 4–12) and MFC Youth (ages 13–21), including contact details, residential addresses, emergency contacts, and chapter assignments.
- **Pastoral Grouping & Households**: Track household membership, household heads, and pastoral growth milestones across area chapters.
- **Extended Ministry Attributes**: Comprehensive support for school/campus fields, LIT (Leaders in Training), Creative Ministries, and High Servant designations.

### Servant Leader Portal & Role-Based Access Control (RBAC)
- **Role-Based Permissions**: Granular authorization levels for Chapter Servants, Area Coordinators, High Servants, LIT Ministry Heads, and Campus Admins.
- **Secure Authentication**: Built on Supabase Auth with encrypted sessions, servant leader registration passcodes, and Multi-Factor Authentication (MFA) enforcement options.
- **Interactive Dashboards**: Role-tailored dashboards providing area-wide member stats, chapter breakdowns, and quick action shortcuts.

### Event & Activity Management
- **Event Registrations**: Manage youth camps, conferences, household assemblies, and leadership training events.
- **Attendance & Fee Tracking**: Record event participation, fee statuses (free vs paid), and activity logs.

### GIG (God Is Generous) & Financial Service Catalog
- **Service & Resource Tracking**: Log community contributions, service catalog items, and financial stewardship records.
- **Pastoral Analytics**: Generate area reports and summary metrics for community coordination.

### System Transparency & Maintenance
- **Interactive Changelogs**: Built-in release notes and system update timeline.
- **Access & Help System**: Integrated floating access guide for servant leader onboarding.
- **Automated Security Updates**: Managed dependency updates via GitHub Dependabot for root, frontend, backend, and CI workflows.

---

## Technical Architecture

```
                                +-----------------------------------+
                                |     Client Browser (Web App)      |
                                |  Vanilla HTML5 / CSS3 / Alpine.js |
                                +-----------------+-----------------+
                                                  |
                                                  | HTTPS / REST
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
- **Frontend**: Standard HTML5, modular CSS3 (using modern design tokens, custom properties, and optimized responsive media query layers), Vanilla JavaScript (ES Modules), and Alpine.js for lightweight UI reactivity.
- **Backend API**: Node.js (Vercel Serverless Functions running on Node 24.x runtime).
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS) policies, multi-stage schema migrations, and encrypted session handling.
- **Deployment & Routing**: Single-project monorepo architecture configured via `vercel.json` for unified static asset delivery and serverless API execution.

---

## Repository Architecture

```
MFC-Youth-Area-Management-System-Web/
├── .github/                  # GitHub configuration & Dependabot security updates
│   └── dependabot.yml
├── Backend/                  # Vercel Serverless API functions & Supabase migrations
│   ├── api/                  # API endpoints (Auth, Members, Chapters, Events, Reports)
│   ├── supabase/             # SQL schema migrations (001_initial_schema to 011_...)
│   └── package.json
├── Frontend/                 # Web application assets & page views
│   ├── css/                  # Global stylesheet (style.css design system)
│   ├── js/                   # Core application logic, auth handlers, & UI modules
│   ├── index.html            # Main login & authentication portal
│   ├── dashboard.html        # Area management dashboard
│   ├── members.html          # Youth directory & pastoral profiles
│   ├── chapters.html         # Chapter & household administration
│   ├── events.html           # Event registration & activity tracking
│   ├── services.html         # Service catalog & GIG contribution logs
│   ├── reports.html          # Analytics & reporting interface
│   ├── changelogs.html       # System release notes & update logs
│   └── package.json
├── docs/                     # Technical, architectural, & deployment documentation
├── .env.example              # Environment variable template
├── SETUP_AND_DEPLOYMENT_GUIDE.md # Complete deployment walkthrough
├── vercel.json               # Monorepo rewrite rules & single-project routing
└── package.json              # Root package metadata
```
