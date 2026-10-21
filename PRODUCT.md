# Product

<!-- impeccable:product-schema 1 -->

> [!IMPORTANT]
> **STRICTLY A PROJECT / NON-PRODUCTION PURPOSE**  
> This product specification defines an educational, capstone, and portfolio demonstration project. It is **strictly a software engineering prototype and NOT intended for official production deployment, live operational use, or processing actual organizational records** for Missionary Families for Christ (MFC) Youth. Any organizational models described herein serve as domain context for technical modeling and architectural demonstration.

## Platform

web (strictly responsive website across desktop, tablet, and mobile browsers)

## Users (Modeled Personas)

- **Primary Persona**: Modeled servant leader and chapter head workflows during pastoral assemblies, youth camps, household meetings, and chapter events on mobile browsers under varying network conditions.
- **Secondary Persona**: Simulated area coordinators, couple coordinators, national coordinators, and domain moderators (LIT Servant, Campus Servant, MFC High Servant, Area Kids Servant) requiring pastoral oversight across chapters, aggregate attendance, and ministry analytics.

## Product Purpose

Engineered as a comprehensive software engineering demonstration and technical portfolio project. The system models a unified, secure, and field-ready operational management architecture for community youth organizations. It demonstrates how pastoral care tracking (ages 13 to 21), household groupings, event registrations, attendance verification, service cataloging, and administrative reporting can be streamlined through modern web technologies.

## Positioning

Unlike generic community databases or unwieldy spreadsheets, this prototype models the specific pastoral structure of MFC Youth: area-scoped governance, household groupings, LIT creative ministries, domain-moderated servant leadership tiers, and strict protection of youth personal data within an educational sandbox.

## Operating Context

- **Environment**: Modern web browsers on smartphones, tablets, and desktop workstations in parish halls, retreat camps, classrooms, and administrative offices.
- **Connectivity**: Responsive web application with network status indicators for venue network dropouts.
- **Rituals**: Fast entry during event check-ins, household attendance logging, monthly activity reports, and periodic chapter roster audits.

## Capabilities and Constraints

- **Capabilities**:
  - Member directory and pastoral profiles (ages 13 to 21, including Heartchamps) with household head associations.
  - Role-Based Access Control (RBAC) with 4 tiers: Area Admins, Domain Moderators (LIT, Campus, High, Kids), Chapter Leaders, and Members.
  - Role-Differentiated Services Management:
    - **Campus Servant**: Demographic track overview and member management for College and Senior High School (SHS) Academic Tracks with in-app track re-assignment.
    - **MFC High Servant**: Dedicated demographic tracking for High School (HS / JHS) Academic Track youth.
    - **Area Kids Servant**: Demographic tracking and directory for Heartchamp transition members.
    - **LIT Servant**: Creative Ministries catalog focused strictly on the 5 pillars: Music, Dance, Graphics & Promo, Creative Writing, and Photography & Videography.
    - **Area Servant & Couple Coordinators**: Pastoral leadership directory across the 5 servant domains (Campus Servant, MFC High Servant, LIT Servant, Area Kids Servant, Chapter Servant).
  - **In-Card Roster & Service Assignment Management**: Core leadership roles (Area Admin, Domain Moderators, Chapter Leaders, Coordinators) can directly add or remove members within Chapter and Service cards and roster modals, powered by optimistic client mutations, prioritized candidate member selectors, and accessible 44px minimum tap targets.
  - Event registration, fee status tracking, attendance verification, and Secretariat Operations Briefing (category, target track, registration cutoff, attire/dress code, checklist, and desk logistics without schema bloat).
  - GIG (God is Generous) stewardship catalog and service tracking.
  - Compact, minimal, and clean UI density: streamlined horizontal headers, dynamically balanced responsive card grids, tight member list padding, and 44px minimum touch targets.
  - Frontend Taste & Art Direction: Strict adherence to the `taste` skill (`design-taste-frontend` / tasteskill v2) standards for app screens: two-line headline ceilings, no eyebrows/pill badges, no resting shadows or gradients, no assistant palette, equal outer margins, and automated browser inspection.
  - Dark Mode Unified Contrast & Harmonized Navigation: Strict compliance with WCAG AAA contrast standards (12.3:1 contrast for inactive links and >17:1 for active links), unified midnight navy ground (`#070f1e`) preventing eye strain, eliminating stark conflicting light panels against dark canvases.
  - Optimistic Member Mutations & Real-Time Telephone Formatting: Instantaneous client-side state transitions (<50ms perceived latency) via TanStack Query optimistic mutations (`onMutate` with rollback snapshot), eliminating modal freezes; paired with real-time telephone formatting for Philippine mobile (`09XX XXX XXXX` / `+63 9XX XXX XXXX`) and landlines.
  - On-Demand Demo Presentation Provisioning & Purge Tools: Capability to rapidly spin up and tear down isolated walkthrough accounts across all leadership tiers without cluttering production databases.
  - High-Speed Parallelized CI/CD Deployment Pipeline: Automated GitHub Actions workflow with path-based trigger filtering, parallel job execution (quality gate, security audit, SAST, and container smoke testing), dual-tier dependency caching, and inlined PaaS configuration checks, achieving sub-3-minute verification and zero runs on documentation updates.
  - Live Cloud & Infrastructure Observability (MCP Protocol): Direct integration with Vercel and Supabase Model Context Protocol (MCP) servers, enabling real-time deployment status verification, edge error stack trace inspection, serverless logs, and database security audits without manual browser dashboard navigation.
- **Constraints**:
  - Strictly a web application (no native mobile app wrappers, no PWA install prompts, standard browser navigation).
  - Strict compliance with data privacy standards for minors (no public leakage of youth contact details or emergency records).
  - Clean separation: React 19 + TypeScript frontend (`frontend-react/`) with Vercel serverless functions (`Backend/server/`) and Supabase PostgreSQL with RLS.
  - Lightweight, performant client footprint with zero decorative AI bloat or neon glows.

## Brand Commitments

- **Name**: Missionary Families for Christ (MFC) Youth Area Management System (`MFC Youth AMS`).
- **Identity & Palette**: Deep community navy (`#002847`), crisp off-white (`#F8FAFC`), pure white card surfaces (`#FFFFFF`), and official MFC Youth branding assets (`/img/logo.png`, `/img/logo-2.png`).
- **Tone**: Clean, reverent, and utility-driven. An uncluttered servant portal projecting high trust, pastoral dignity, and speed.

## Evidence on Hand

- Modern React 19 + TypeScript + Vite + Tailwind CSS application in `frontend-react/` (`DashboardPage.tsx`, `MembersPage.tsx`, `ChaptersPage.tsx`, `EventsPage.tsx`, `ServicesPage.tsx`, `ReportsPage.tsx`, `GigPage.tsx`).
- Official logo assets in `frontend-react/public/img/` and `Frontend/img/`.
- Documented schema migrations in `Backend/supabase/` (migrations 001 through 016) defining tables for areas, chapters, members, events, attendance, services, and reports.
- Fully accessible responsive website layout conforming to WCAG AA accessibility standards.

## Product Principles

1. **Servant-First Efficiency**: Optimize field workflows for rapid completion on mobile with minimal taps, clear confirmation, and zero visual friction.
2. **Reverent Utility**: Prioritize legible typography, high-contrast states, and calm layout over decorative fluff or loud gimmicks.
3. **Pastoral Trust & Privacy**: Treat all youth contact and emergency data with ironclad access control and clear permission boundaries.
4. **Resilient Under Real Conditions**: Gracefully handle flaky camp Wi-Fi, offline states, and interruptions without losing entered data.

## Accessibility & Inclusion

- Mobile touch targets adhering to minimum 44x44px standards.
- High color contrast for outdoor and bright sunlight readability.
- Clean semantic HTML structure supporting screen readers and assistive devices.
