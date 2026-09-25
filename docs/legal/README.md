# Legal Documentation and Compliance Suite
## MFC Youth Area Management System (NCR Central)

**Platform URL:** `https://mfc-youth-area-management-system.vercel.app`  
**Deploying Organization:** Missionary Families for Christ (MFC) Youth - NCR Central  
**Applicable Legal Framework:** Republic Act No. 10173 (Philippine Data Privacy Act of 2012), its Implementing Rules and Regulations (IRR), and National Privacy Commission (NPC) issuances.

---

### Overview

This repository directory contains the formal, production-ready legal agreements, privacy policies, operational notices, and statutory compliance documents governing the MFC Youth Area Management System (AMS). 

The platform operates as a specialized pastoral administration, community directory, event ledger, and servant leader coordination portal. It is deployed on modern cloud infrastructure utilizing Vercel Serverless Edge functions and Supabase PostgreSQL with strict Row Level Security (RLS).

---

### Table of Documents

| File | Document Title | Primary Purpose & Statutory Scope |
| :--- | :--- | :--- |
| `PRIVACY_POLICY.md` | **Privacy Policy** | RA 10173 compliance, data subject rights, categories of data collected, minor protections, cloud sub-processors, and NPC escalation paths. |
| `TERMS_OF_SERVICE.md` | **Terms of Service** | Terms of use, eligibility, servant leader authentication, Acceptable Use Policy (AUP), RLS tampering prohibitions, and liability disclaimers. |
| `COOKIE_AND_STORAGE_POLICY.md` | **Cookie and Local Storage Policy** | Detailed disclosure of browser localStorage usage (JWT token caching, optimistic UI hydration), and absolute zero-tracking guarantee. |
| `PARENTAL_CONSENT_NOTICE.md` | **Parental Consent Notice** | Plain-language addendum for parents and legal guardians of youth and kids under 18 years old, covering consent and data deletion rights. |
| `FINANCIAL_DISCLAIMER.md` | **Financial Contribution Disclaimer** | Clarification that voluntary GIG offerings and camp fees are offline/external payments, and that AMS acts purely as an internal administrative ledger. |
| `IP_AND_ATTRIBUTION.md` | **IP and Content Attribution** | Ownership of MFC Youth assets, proprietary code terms, and fair-use copyright attribution for Catholic scripture and liturgical feeds. |

---

### Compliance and Architectural Highlights

1. **Republic Act No. 10173 Alignment:** Religious organizations collecting personal and sensitive personal information (such as religious affiliation, pastoral history, and minors' records) are guided by Section 12 (lawful processing criteria) and Section 13(f) (religious non-profit data processing exemption) of the Data Privacy Act of 2012.
2. **Directory and Authentication Decoupling:** Member directory records do not create or imply web login credentials. User login accounts (auth.users) are provisioned selectively for vetted servant leaders and coordinators subject to strict Area-level Role-Based Access Control (RBAC).
3. **No Commercial Trackers:** The platform does not deploy third-party advertising cookies, marketing pixels (e.g., Meta Pixel, Google AdSense), or behavioral tracking scripts. Client-side storage is strictly technical (localStorage for GoTrue JWT session tokens and optimistic UI hydration).
4. **Third-Party Sub-Processors:** Data processing relies on enterprise cloud infrastructure (Vercel Serverless runtime and Supabase PostgreSQL with AES-256 encrypted storage and SSL/TLS in-transit transport).

---

### Administrative Contacts

* **Data Protection Officer (DPO):** `[Insert Data Protection Officer Email]`
* **Area Servant Leadership Office:** MFC Youth NCR Central, `[Insert Physical / Pastoral Office Address]`
* **National Privacy Commission (NPC) Escalation:** `complaints@privacy.gov.ph`
