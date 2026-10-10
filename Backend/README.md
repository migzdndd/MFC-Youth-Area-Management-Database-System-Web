# Backend API & Cloud Data Services

The backend serves as the production source of truth for Authentication, Areas, Members, Chapters, Services, Events, Event Participants, Activity Reports, and GIG Stewardship.

## Architecture

```text
Web Client (React 19 / TypeScript SPA)
        |
        v
Backend /api/* serverless routes (Backend/api/router.js)
        |
        v
Modular Handlers (Backend/server/*)
        |
        +--> Supabase Auth
        |
        +--> PostgreSQL (Supabase with RLS)
```

The desktop and mobile native wrappers communicate with the exact same API gateway instead of directly querying the cloud database. This keeps RBAC, domain moderation, and Area/Chapter data isolation centralized in one place.

---

## Project Layout

```text
MFC-Youth-Area-Management-System-Web/
├── Backend/
│   ├── api/          # Serverless entry point (router.js)
│   ├── server/       # Domain business logic (members, chapters, events, services)
│   │   ├── _lib/     # Security, RBAC access, sanitization, rate-limiting
│   │   ├── auth/     # Auth handlers, profile queries, password management
│   │   ├── members/  # Domain-scoped member directory handlers
│   │   ├── services/ # 5 Creative Ministries assignment handlers
│   │   ├── chapters/ # Chapter administration handlers
│   │   ├── events/   # Event scheduling and attendance handlers
│   │   └── sync/     # Area hydration payload for offline caching
│   ├── supabase/     # Migrations (001_initial_schema.sql to 016_domain_moderator_rls_scoping.sql)
│   └── package.json
└── frontend-react/   # React 19 + TypeScript + Vite + Tailwind CSS Single-Page Application
```

---

## 4-Tier RBAC & Domain Scoping

Access control is enforced at both the API layer (`Backend/server/_lib/access.js`) and database level via Row Level Security (RLS):

1. **Area Administrators** (`national_coordinator`, `area_servant`, `couple_coordinator`): Full visibility over all chapters, members, finances, and reports in the area.
2. **Domain Moderators**:
   - `lit_servant`: Scoped strictly to the 5 Creative Ministries (`Music`, `Dance`, `Graphics & Promo`, `Creative Writing`, `Photography & Videography`).
   - `campus_servant`: Scoped to youth members in College and Senior High School (SHS).
   - `mfc_high_servant`: Scoped to youth members in Junior High School (Grades 7 to 10).
   - `area_kids_servant`: Scoped to Heartchamps.
3. **Chapter Leaders** (`chapter_servant`, `assistant_chapter_servant`): Scoped strictly to youth members, households, and reports in their specific chapter.
4. **General Members** (`member`): Self-service portal access for personal profile and event registration.

---

## Creative Ministries Catalog (The 5 Pillars)

The active Services catalog is maintained in `Backend/server/_lib/service-catalog.js` and reflects strictly the 5 Creative Ministries:
1. `Music`
2. `Dance`
3. `Graphics & Promo`
4. `Creative Writing`
5. `Photography & Videography`

All legacy unmentioned service categories have been removed.

---

## Endpoints

- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/auth/admin-register`
- `GET /api/areas`
- `POST /api/areas`
- `POST /api/areas/select`
- `GET /api/auth/me`
- `POST /api/auth/change-password`
- `POST /api/auth/change-email`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET/POST/PUT/DELETE /api/members` (domain scoped)
- `GET/POST/PUT/DELETE /api/chapters`
- `GET/PATCH /api/services` (5 Creative Ministries)
- `GET/POST/PATCH/DELETE /api/events`
- `GET/POST/PATCH/DELETE /api/participants`
- `GET/POST/PATCH/DELETE /api/reports`
- `GET/POST/DELETE /api/gig`
- `GET /api/daily-readings`
- `GET /api/sync` (domain scoped hydration package)

---

## Setup & Migrations

1. Create a Supabase project.
2. In Supabase SQL Editor, run all migrations in numerical order:
   - `001_initial_schema.sql` to `016_domain_moderator_rls_scoping.sql`
3. Configure environment variables in `.env` or Vercel:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`
   - `ADMIN_REGISTRATION_CODE`
4. Verify backend health at `GET /api/health`.
