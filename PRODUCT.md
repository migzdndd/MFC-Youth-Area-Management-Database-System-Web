# Product

<!-- impeccable:product-schema 1 -->

## Platform

web / mobile pwa / cross-platform desktop

## Users

- **Primary**: Servant Leaders and Chapter Heads of Missionary Families for Christ (MFC) Youth. They operate in the field during pastoral assemblies, youth camps, household meetings, and chapter events, often on mobile phones under varying network conditions.
- **Secondary**: Area Coordinators, Couple Coordinators, National Coordinators, and Domain Moderators (LIT Servant, Campus Servant, MFC High Servant, Area Kids Servant) requiring pastoral oversight across chapters, aggregate attendance, and ministry analytics.

## Product Purpose

Provide a unified, secure, and field-ready operational management system for MFC Youth. It simplifies pastoral care tracking (ages 13 to 21), household groupings, event registrations, attendance verification, service cataloging, and administrative reporting so servant leaders spend less time on paperwork and more time on ministry.

## Positioning

Unlike generic community databases or unwieldy spreadsheets, the system is purpose-built for the specific pastoral structure of MFC Youth: area-scoped governance, household groupings, LIT creative ministries, domain-moderated servant leadership tiers, and strict protection of youth personal data.

## Operating Context

- **Environment**: Mobile browsers and installed PWAs on smartphones in parish halls, retreat camps, classrooms, and outdoor event grounds; desktop workstations for area coordinators.
- **Connectivity**: Mobile web with offline caching for attendance and reference data during venue network dropouts.
- **Rituals**: Fast entry during event check-ins, household attendance logging, monthly activity reports, and periodic chapter roster audits.

## Capabilities and Constraints

- **Capabilities**:
  - Member directory and pastoral profiles (ages 13 to 21, including Heartchamps) with household head associations.
  - Role-Based Access Control (RBAC) with 4 tiers: Area Admins, Domain Moderators (LIT, Campus, High, Kids), Chapter Leaders, and Members.
  - LIT Creative Ministries catalog focused strictly on the 5 pillars: Music, Dance, Graphics & Promo, Creative Writing, and Photography & Videography.
  - Event registration, fee status tracking, and attendance verification.
  - GIG (Give It Generously) stewardship catalog and service tracking.
  - Mobile-first React Native style UI with 44px touch targets and bottom tab navigation.
- **Constraints**:
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
- Working PWA configuration and mobile-friendly responsive layout.

## Product Principles

1. **Servant-First Efficiency**: Optimize field workflows for rapid completion on mobile with minimal taps, clear confirmation, and zero visual friction.
2. **Reverent Utility**: Prioritize legible typography, high-contrast states, and calm layout over decorative fluff or loud gimmicks.
3. **Pastoral Trust & Privacy**: Treat all youth contact and emergency data with ironclad access control and clear permission boundaries.
4. **Resilient Under Real Conditions**: Gracefully handle flaky camp Wi-Fi, offline states, and interruptions without losing entered data.

## Accessibility & Inclusion

- Mobile touch targets adhering to minimum 44x44px standards.
- High color contrast for outdoor and bright sunlight readability.
- Clean semantic HTML structure supporting screen readers and assistive devices.
