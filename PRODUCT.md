# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary**: Servant Leaders and Chapter Heads of Missionary Families for Christ (MFC) Youth. They operate in the field during pastoral assemblies, youth camps, household meetings, and chapter events, often on mobile phones under varying or spotty network conditions.
- **Secondary**: Area Coordinators, High Servants, LIT Ministry Heads, and Campus Admins requiring oversight across chapters, aggregate attendance, and ministry analytics.

## Product Purpose

Provide a unified, secure, and field-ready operational management system for MFC Youth. It simplifies pastoral care tracking (ages 13–21), household groupings, event registrations, attendance verification, service cataloging, and administrative reporting so servant leaders spend less time on paperwork and more time on ministry.

## Positioning

Unlike generic community databases or unwieldy spreadsheets, the system is purpose-built for the specific pastoral structure of MFC Youth: area-scoped governance, household groupings, LIT and servant leadership tiers, and strict protection of youth personal data.

## Operating Context

- **Environment**: Mobile browsers on smartphones in parish halls, retreat camps, classrooms, and outdoor event grounds; desktop workstations for area coordinators.
- **Connectivity**: Mobile web with offline-first PWA caching for attendance and reference data during venue network dropouts.
- **Rituals**: Fast entry during event check-ins, household attendance logging, monthly activity reports, and periodic chapter roster audits.

## Capabilities and Constraints

- **Capabilities**:
  - Member directory and pastoral profiles (ages 13–21) with household head associations.
  - Role-Based Access Control (RBAC) with servant registration passcodes and optional MFA.
  - Event registration, fee status tracking, and attendance verification.
  - GIG (God Is Generous) stewardship catalog and service tracking.
  - Offline-ready PWA service worker with local state handling.
- **Constraints**:
  - Strict compliance with data privacy standards for minors (no public leakage of youth contact details or emergency records).
  - Single-project monorepo with Vercel serverless routing and Supabase PostgreSQL with RLS.
  - Lightweight client-side footprint (Vanilla HTML5/CSS3/JavaScript, Alpine.js) without heavy framework bloat.

## Brand Commitments

- **Name**: Missionary Families for Christ (MFC) Youth Area Management System (`MFC Youth AMS`).
- **Identity & Palette**: Deep community navy (`#002847`), crisp off-white (`#f4f7fb`), and official MFC Youth branding assets (`/img/logo.png`, `/img/logo-2.png`).
- **Tone**: Clean, reverent, and utility-driven. An uncluttered servant portal projecting high trust, pastoral dignity, and speed.

## Evidence on Hand

- Production web assets and responsive views in `Frontend/` (`index.html`, `dashboard.html`, `members.html`, `chapters.html`, `events.html`, `services.html`, `reports.html`, `changelogs.html`).
- Official logo assets in `Frontend/img/`.
- Documented schema migrations in `Backend/supabase/` defining tables for areas, chapters, members, events, attendance, and reports.
- Working PWA manifest (`Frontend/manifest.webmanifest`) and service worker (`Frontend/sw.js`).

## Product Principles

1. **Servant-First Efficiency**: Optimize field workflows for rapid completion on mobile with minimal taps, clear confirmation, and zero visual friction.
2. **Reverent Utility**: Prioritize legible typography, high-contrast states, and calm layout over decorative fluff or loud gimmicks.
3. **Pastoral Trust & Privacy**: Treat all youth contact and emergency data with ironclad access control and clear permission boundaries.
4. **Resilient Under Real Conditions**: Gracefully handle flaky camp Wi-Fi, offline states, and interruptions without losing entered data.

## Accessibility & Inclusion

- Mobile touch targets adhering to minimum 44×44px standards.
- High color contrast for outdoor/bright sunlight readability.
- Clean semantic HTML structure supporting screen readers and assistive devices.
