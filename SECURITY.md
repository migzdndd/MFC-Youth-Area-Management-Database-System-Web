# Security Policy

> [!IMPORTANT]
> **STRICTLY A PROJECT / NON-PRODUCTION DISCLAIMER**  
> This security policy applies to an educational, demonstration, and portfolio project repository. **This codebase is NOT an enterprise production system, and is not intended to secure or process live production data for Missionary Families for Christ (MFC) Youth.**

## Supported Versions
Only the latest **Web Prototype (Phase 6)** receives maintenance updates. Older prototype versions are unsupported.

## Reporting a Vulnerability
Please report security vulnerabilities privately to **miguel7riovaldez@gmail.com**. Do not open public issues for security exploits.

## Security Architecture
- Connections to Supabase are strictly HTTPS.
- SQL injection is mitigated via parameterized queries using `@supabase/supabase-js`.
- Strict Row Level Security (RLS) restricts data access per user and area.
- Secrets (`SUPABASE_SECRET_KEY`) reside only in the backend and must never be exposed to the browser.
- Password updates and recoveries utilize secure, isolated Supabase sessions.
