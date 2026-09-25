# Privacy Policy
## MFC Youth Area Management System (NCR Central)

**Effective Date:** [Insert Effective Date, e.g., October 1, 2026]  
**Last Updated:** [Insert Last Updated Date, e.g., October 1, 2026]  
**Platform URL:** `https://mfc-youth-area-management-system.vercel.app`  
**Governing Law:** Republic Act No. 10173 (Data Privacy Act of 2012 / DPA) and its Implementing Rules and Regulations (IRR)

---

### Plain-Language Summary

* **Who We Are:** This platform is an administrative and pastoral portal operated solely by Missionary Families for Christ (MFC) Youth - NCR Central to manage community directories, track youth camps and event registrations, and record voluntary ministry contributions.
* **Our Commitment:** We treat your information with Christian integrity and strict compliance with the Philippine Data Privacy Act of 2012 (RA 10173).
* **Decoupled Architecture:** Having your name in our community directory does not create a login account or grant public web access to your data. Only screened servant leaders and coordinators receive authenticated access to perform their specific ministry duties.
* **No Advertising or Selling:** We never sell, monetize, rent, or share personal information with commercial advertisers or external marketers.
* **Protection of Minors:** Many members of MFC Youth and MFC Kids are minors under 18 years old. We collect minor information only with explicit parental or legal guardian consent and handle it with the highest standard of pastoral care and technical safeguards.

---

### 1. Introduction and Statutory Declaration

Missionary Families for Christ (MFC) Youth - NCR Central ("we", "us", "our", or "the Ministry") is committed to respecting and protecting the personal privacy of all youth, kids, parents, servant leaders, and couple coordinators participating in our community.

This Privacy Policy informs you how we collect, process, store, secure, and dispose of Personal Information (PI) and Sensitive Personal Information (SPI) through the MFC Youth Area Management System Web Platform (`mfc-youth-area-management-system.vercel.app`, hereinafter referred to as the "Platform" or "AMS").

All processing of personal data within the Platform is conducted in strict compliance with the provisions of **Republic Act No. 10173**, otherwise known as the **Data Privacy Act of 2012 (DPA)**, its Implementing Rules and Regulations (IRR), and all applicable circulars, advisories, and orders issued by the **National Privacy Commission (NPC)** of the Philippines.

---

### 2. Legal Basis for Data Processing

We process personal data on the Platform pursuant to the following lawful criteria recognized under Philippine law:

1. **Pastoral and Religious Ministry Administration (DPA Section 13(f)):** Under Section 13(f) of RA 10173, religious and non-profit organizations may process personal and sensitive personal information of their members, participants, and adherents for legitimate internal community, pastoral, and administrative purposes, provided that personal information is not disclosed outside the organization without the consent of the data subject.
2. **Consent (DPA Section 12(a) and Section 13(a)):** We collect and record personal data based on explicit consent provided during physical youth camp registrations, community household profiles, or digital entry forms signed by adult members or parents/legal guardians of minors.
3. **Legitimate Organizational Interests (DPA Section 12(f)):** Processing is necessary to ensure safety during camps and retreats, coordinate emergency medical response, maintain community order, provide pastoral accompaniment, and maintain accountability for voluntary financial stewardship.

---

### 3. Categories of Data Collected

The Platform processes specific categories of personal data necessary for pastoral and administrative ministry:

#### A. Member Directory Records
* **Full Legal Name:** First name, middle name, family surname, and nickname.
* **Birth Date and Age:** Used for ministry age qualification (MFC Kids for ages 4 to 12; MFC Youth for ages 13 to 21) and youth camp grouping.
* **Contact Information:** Philippine 11-digit mobile contact number and active email address.
* **Residential Address:** Street address, barangay, city, and province for cluster and chapter geographic assignment.
* **Emergency Contact Details:** Contact name, relationship, and emergency phone number (required for all youth camp participants and minor members).
* **Community Pastoral Profile:** Assigned Area, Sector, Chapter, Household group, Youth Camp entry history (camp year, camp venue, batch name), and leadership history.

#### B. Sensitive Personal Information (DPA Section 3(l))
* **Religious Affiliation and Sacraments:** Records of Catholic baptism, confirmation, and community covenant status.
* **Age and Minor Status:** Explicit indicators identifying members below 18 years of age.
* **Pastoral and Formation Notes:** Internal notes maintained by authorized coordinators regarding pastoral tracking, spiritual formation status, and leadership readiness.

#### C. Financial Contribution and Event Transaction Metadata
* **God Is Good (GIG) Voluntary Tithes/Offerings:** Contribution record containing date, contributing member name, chapter, amount, and payment channel.
* **Event and Youth Camp Registration Fees:** Registration status, payment confirmation timestamp, fee amount, and external transaction reference number (e.g., GCash reference ID, bank deposit slip reference, or cash receipt number).
* *Note: The Platform operates strictly as an administrative ledger. We do not collect, process, or store credit card numbers, debit card PINs, CVV codes, or bank account login passwords.*

#### D. Ministry Attendance and Operational Logs
* Event attendance timestamps for assemblies, youth camps, household meetings, servant team conferences, and sports or creative ministry workshops.
* Historical activity reports, narrative community highlights, and chapter achievement summaries.

---

### 4. Technical Architecture and Identity Decoupling

To prevent unauthorized exposure and adhere to data minimization principles, the Platform enforces an identity decoupling model:

1. **Directory Decoupling:** Inclusion in the community member directory does not automatically create or require a web portal login account. The directory serves as an internal pastoral record.
2. **Selective Account Provisioning:** Web portal user accounts (`auth.users`) are provisioned selectively and restricted to accredited servant leaders, chapter coordinators, and authorized couple coordinators who require system access to perform administrative functions.
3. **Role-Based Access Control (RBAC):** Access privileges are enforced at the database level using PostgreSQL Row Level Security (RLS). Permissions are partitioned across the following roles:
   * *National and Area Coordinators:* Broad oversight within the authorized geographic jurisdiction.
   * *Specialized Ministry Servants (Campus, Kids, LIT/Creative):* Restricted access limited to specialized service programs.
   * *Chapter Servants and Couple Coordinators:* Restricted access strictly confined to their assigned chapter members.
   * *Portal Members:* Read-only access to their individual profiles and public community announcements.
4. **Area-Level Multi-Tenant Isolation:** Database queries enforce tenant boundaries, prohibiting servant leaders in one chapter or area from querying, modifying, or viewing member records of other regional clusters without verified administrative delegation.

---

### 5. Protection of Children and Minors (Under 18 Years Old)

Missionary Families for Christ Youth works extensively with minors aged 13 to 17, and MFC Kids works with children aged 4 to 12. In accordance with the Philippine Data Privacy Act and the United Nations Convention on the Rights of the Child:

1. **Parental / Legal Guardian Consent:** The collection and processing of any personal information belonging to an individual under 18 years of age requires the written or verified electronic consent of a parent or legal guardian.
2. **Youth Camp Registrations:** All entry Youth Camp and Kids Camp registration profiles must include verified emergency contact numbers and parental consent acknowledgments before a minor's profile is cataloged in the system.
3. **Pastoral Custody and Safeguarding:** Minor directory information is never made public. Access is restricted exclusively to cleared youth coordinators and couple coordinators with direct pastoral responsibility over the child's household group.
4. **Right of Parents to Inspect and Remove:** Parents and legal guardians retain the absolute right at any time to inspect the personal data of their child, correct inaccuracies, or demand the permanent removal and deletion of their child's records from the Platform.

---

### 6. Third-Party Cloud Infrastructure and Data Sub-Processors

The Platform is hosted on modern, secure cloud infrastructure. We engage the following reputable technology providers as data sub-processors under strict contractual and technical confidentiality safeguards:

| Sub-Processor | Role / Function | Infrastructure Location | Security Safeguards |
| :--- | :--- | :--- | :--- |
| **Vercel Inc.** | Web application hosting, static asset delivery, and Node.js Serverless Edge Functions runtime. | Global Edge Network (US / APAC) | HTTPS/TLS 1.3 encryption in transit, DDoS mitigation, isolated serverless execution environments. |
| **Supabase Inc.** | PostgreSQL relational database, Row Level Security (RLS) enforcement, and GoTrue JWT authentication engine. | AWS Asia-Pacific (Singapore / Tokyo regions) | AES-256 encryption at rest, automated encrypted backups, strict SSL/TLS database connections, fine-grained RLS policies. |
| **External Scripture Feeds (EWTN / RSV-CE)** | Daily liturgical readings and Catholic scripture feeds rendered for member reflection. | Public content delivery endpoints | Read-only public API queries; no personal data is transmitted to external scripture providers. |

None of our cloud providers are authorized to use, inspect, sell, or disclose community data for any purpose outside the automated hosting and database execution requirements of the Platform.

---

### 7. Client-Side Browser Storage (Zero-Tracking Disclosure)

The Platform uses browser `localStorage` solely for essential operational functionality:

* **GoTrue Authentication Tokens:** Storage of short-lived JSON Web Tokens (JWT) and refresh tokens to maintain authenticated sessions for servant leaders.
* **Optimistic UI Hydration Cache:** Temporary caching of directory lists, chapter filters, and layout preferences to provide immediate screen rendering and reduce server network requests.

**Absolute No-Tracking Guarantee:** The Platform does **not** use commercial tracking cookies, third-party advertising cookies, behavioral tracking pixels (e.g., Meta Pixel, Google AdSense, TikTok Pixel), or analytics scripts that monitor users across external websites.

---

### 8. Data Retention, Archival, and Deletion

We adhere to the storage limitation principle of RA 10173:

1. **Active Member Data:** Retained for the duration of the member's active participation in MFC Youth or MFC Kids.
2. **Transition and Alumni Archival:** When a youth member ages out of the youth ministry (typically upon reaching 22 years of age or completing transition into MFC Singles), their directory profile is archived. Archived records are accessible only to Area Coordinators for historical validation of sacraments and camp service history.
3. **Financial and Transaction Logs:** Financial contribution ledgers and event payment metadata are retained for five (5) fiscal years to ensure community accounting accountability, audit readiness, and reconciliation requirements.
4. **Secure Disposal:** Upon receipt of a valid request for erasure, or when data is no longer necessary for pastoral purposes, electronic records are permanently scrubbed from the active PostgreSQL database, and associated backups are overwritten in accordance with standard cloud retention lifecycles.

---

### 9. Security Measures and Safeguards

To prevent accidental loss, unauthorized access, identity theft, or data destruction, we implement robust organizational, physical, and technical safeguards:

* **Technical Safeguards:**
  * Mandatory Transport Layer Security (TLS 1.3/HTTPS) across all web domains and API routes.
  * Database-level PostgreSQL Row Level Security (RLS) ensuring strict isolation between user roles and geographic areas.
  * Strong password requirements for authenticated servant accounts, hashed using industry-standard bcrypt algorithms via Supabase GoTrue.
  * JWT access tokens with short expiration windows.
* **Organizational Safeguards:**
  * Mandatory data privacy briefings for all servant leaders and couple coordinators before administrative access is provisioned.
  * Signed Servant Confidentiality Commitments prohibiting downloading, exporting, or disseminating community directories to external drives, personal spreadsheets, or messaging groups.
  * Principle of Least Privilege: servant leaders are granted access only to the data of members directly under their pastoral care.
* **Physical Safeguards:**
  * The Platform is fully serverless and cloud-native; no physical production servers or local unencrypted hard drives are maintained in local ministry offices.

---

### 10. Data Subject Rights Under Philippine Law

Under Chapter VIII, Section 16 of the Philippine Data Privacy Act of 2012, every registered youth, parent, and leader possesses the following enforceable rights:

1. **Right to Be Informed:** You have the right to know whether your personal data is being processed, how it was collected, the purpose of processing, and who has access to it.
2. **Right to Access:** You may request reasonable access to your personal data held in our systems, including the categories of data and the pastoral roles who have viewed it.
3. **Right to Rectification (Correction):** You have the right to dispute any inaccuracy or error in your personal data and have our administrators correct it promptly.
4. **Right to Erasure or Blocking:** You may request the suspension, withdrawal, blocking, or removal of your personal data from our directory upon showing reasonable grounds (e.g., you are no longer a member of the community, or data was unlawfully obtained).
5. **Right to Object:** You have the right to object to the processing of your personal data for purposes other than essential pastoral safety and legal compliance.
6. **Right to Data Portability:** You may request a machine-readable copy (e.g., CSV or JSON) of personal data you provided directly to the Platform.
7. **Right to Damages:** You have the right to be indemnified for any damages sustained due to inaccurate, incomplete, outdated, false, unlawfully obtained, or unauthorized use of personal data, in accordance with NPC guidelines.
8. **Right to File a Complaint:** If you believe your privacy rights have been violated or your requests have been ignored, you have the right to lodge a formal complaint with the National Privacy Commission.

---

### 11. Data Protection Officer and Contact Details

For inquiries, verification of records, exercise of data subject rights, or privacy concerns, please contact our designated Area Data Protection Officer:

* **Designation:** Data Protection Officer (DPO)
* **Organization:** Missionary Families for Christ (MFC) Youth - NCR Central
* **Email Address:** `[Insert Data Protection Officer Email]`
* **Pastoral Office Address:** `[Insert Physical / Pastoral Office Address, Metro Manila, Philippines]`

#### National Privacy Commission (NPC) Escalation
If you feel your concerns have not been addressed adequately by our ministry leadership, you may file a formal complaint with the regulatory authority:

* **Agency:** National Privacy Commission of the Philippines
* **Address:** 5th Floor Delegation Building, PICC Complex, Vicente Sotto Avenue, Pasay City, Metro Manila 1307
* **Website:** `https://privacy.gov.ph`
* **Email:** `complaints@privacy.gov.ph` or `info@privacy.gov.ph`
* **Hotline:** +63 2 8234 2228

---

### 12. Updates and Amendments

We reserve the right to update this Privacy Policy periodically to reflect changes in our pastoral workflows, technical architecture, or Philippine privacy regulations. Any updates will be published on the Platform with a revised "Last Updated" timestamp. Substantial changes affecting parental consent or data sharing will be communicated directly through chapter announcements and pastoral leadership assemblies.
