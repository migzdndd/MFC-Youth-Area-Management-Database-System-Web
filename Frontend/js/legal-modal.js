/**
 * ============================================================================
 * MFC Youth Area Management System - Legal & Compliance Modal Component
 * ============================================================================
 * Automatically pops up all statutory compliance and legal documents upon
 * entering the platform. Provides interactive tabbed access across all 7 policies.
 * ============================================================================
 */

(function () {
  'use strict';

  const LEGAL_DOCUMENTS = {
    overview: {
      title: 'Compliance Overview',
      badge: 'Suite Index',
      html: `
        <h1>Legal Documentation and Compliance Suite</h1>
        <h3>MFC Youth Area Management System (NCR Central)</h3>
        <p><strong>Platform URL:</strong> <code>https://mfc-youth-area-management-system.vercel.app</code><br>
        <strong>Deploying Organization:</strong> Missionary Families for Christ (MFC) Youth - NCR Central<br>
        <strong>Applicable Legal Framework:</strong> Republic Act No. 10173 (Philippine Data Privacy Act of 2012), its Implementing Rules and Regulations (IRR), and National Privacy Commission (NPC) issuances.</p>
        
        <div class="legal-callout-box">
          <strong>Notice for All Community Members &amp; Leaders:</strong> This repository suite contains the formal legal agreements, privacy disclosures, and statutory compliance documents governing the MFC Youth Area Management System (AMS).
        </div>

        <h2>Table of Documents</h2>
        <div class="legal-table-wrapper">
          <table class="legal-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Primary Purpose &amp; Statutory Scope</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Privacy Policy</strong></td>
                <td>RA 10173 compliance, data subject rights, categories of data collected, minor protections, cloud sub-processors, and NPC escalation paths.</td>
              </tr>
              <tr>
                <td><strong>Terms of Service</strong></td>
                <td>Terms of use, eligibility, servant leader authentication, Acceptable Use Policy (AUP), RLS tampering prohibitions, and liability disclaimers.</td>
              </tr>
              <tr>
                <td><strong>Cookie and Storage Policy</strong></td>
                <td>Detailed disclosure of browser localStorage usage (JWT token caching, optimistic UI hydration), and absolute zero-tracking guarantee.</td>
              </tr>
              <tr>
                <td><strong>Parental Consent Notice</strong></td>
                <td>Plain-language addendum for parents and legal guardians of youth and kids under 18 years old, covering consent and data deletion rights.</td>
              </tr>
              <tr>
                <td><strong>Financial Disclaimer</strong></td>
                <td>Clarification that voluntary GIG offerings and camp fees are offline/external payments, and that AMS acts purely as an internal administrative ledger.</td>
              </tr>
              <tr>
                <td><strong>IP and Attribution</strong></td>
                <td>Ownership of MFC Youth assets, proprietary code terms, and fair-use copyright attribution for Catholic scripture and liturgical feeds.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>Compliance and Architectural Highlights</h2>
        <ul>
          <li><strong>Republic Act No. 10173 Alignment:</strong> Religious organizations collecting personal and sensitive personal information (such as religious affiliation, pastoral history, and minors' records) are guided by Section 12 (lawful processing criteria) and Section 13(f) (religious non-profit data processing exemption) of the Data Privacy Act of 2012.</li>
          <li><strong>Directory and Authentication Decoupling:</strong> Member directory records do not create or imply web login credentials. User login accounts (auth.users) are provisioned selectively for vetted servant leaders and coordinators subject to strict Area-level Role-Based Access Control (RBAC).</li>
          <li><strong>No Commercial Trackers:</strong> The platform does not deploy third-party advertising cookies, marketing pixels (e.g., Meta Pixel, Google AdSense), or behavioral tracking scripts. Client-side storage is strictly technical (localStorage for GoTrue JWT session tokens and optimistic UI hydration).</li>
          <li><strong>Third-Party Sub-Processors:</strong> Data processing relies on enterprise cloud infrastructure (Vercel Serverless runtime and Supabase PostgreSQL with AES-256 encrypted storage and SSL/TLS in-transit transport).</li>
        </ul>

        <h2>Administrative Contacts</h2>
        <ul>
          <li><strong>Data Protection Officer (DPO):</strong> <code>[Insert Data Protection Officer Email]</code></li>
          <li><strong>Area Servant Leadership Office:</strong> MFC Youth NCR Central, <code>[Insert Physical / Pastoral Office Address]</code></li>
          <li><strong>National Privacy Commission (NPC) Escalation:</strong> <code>complaints@privacy.gov.ph</code></li>
        </ul>
      `
    },

    privacy: {
      title: 'Privacy Policy (RA 10173)',
      badge: 'Data Privacy Act',
      html: `
        <h1>Privacy Policy</h1>
        <h3>MFC Youth Area Management System (NCR Central)</h3>
        <p><strong>Effective Date:</strong> October 1, 2026 &nbsp;|&nbsp; <strong>Governing Law:</strong> Republic Act No. 10173 (Data Privacy Act of 2012 / DPA)</p>

        <div class="legal-callout-box">
          <strong>Plain-Language Summary:</strong> We treat all community data with Christian integrity and strict compliance with the Philippine Data Privacy Act of 2012. We never sell or share data with commercial advertisers. Minor data is collected only with verified parental consent.
        </div>

        <h2>1. Introduction and Statutory Declaration</h2>
        <p>Missionary Families for Christ (MFC) Youth - NCR Central ("we", "us", "our", or "the Ministry") is committed to respecting and protecting the personal privacy of all youth, kids, parents, servant leaders, and couple coordinators participating in our community.</p>
        <p>All processing of personal data within the Platform is conducted in strict compliance with the provisions of <strong>Republic Act No. 10173</strong>, otherwise known as the <strong>Data Privacy Act of 2012 (DPA)</strong>, its Implementing Rules and Regulations (IRR), and all applicable circulars, advisories, and orders issued by the <strong>National Privacy Commission (NPC)</strong> of the Philippines.</p>

        <h2>2. Legal Basis for Data Processing</h2>
        <ul>
          <li><strong>Pastoral and Religious Ministry Administration (DPA Section 13(f)):</strong> Under Section 13(f) of RA 10173, religious and non-profit organizations may process personal and sensitive personal information of their members, participants, and adherents for legitimate internal community, pastoral, and administrative purposes, provided that personal information is not disclosed outside the organization without consent.</li>
          <li><strong>Consent (DPA Section 12(a) and Section 13(a)):</strong> We collect and record personal data based on explicit consent provided during physical youth camp registrations, community household profiles, or digital entry forms signed by adult members or parents/legal guardians of minors.</li>
          <li><strong>Legitimate Organizational Interests (DPA Section 12(f)):</strong> Processing is necessary to ensure safety during camps and retreats, coordinate emergency medical response, maintain community order, and maintain accountability for voluntary financial stewardship.</li>
        </ul>

        <h2>3. Categories of Data Collected</h2>
        <h4>A. Member Directory Records</h4>
        <p>Full legal name, birth date and age (for ministry age qualification: MFC Kids ages 4 to 12; MFC Youth ages 13 to 21), contact information (11-digit mobile number, email), residential address for chapter assignment, emergency contact details, and community pastoral profile.</p>

        <h4>B. Sensitive Personal Information (DPA Section 3(l))</h4>
        <p>Records of Catholic baptism, confirmation, community covenant status, minor age indicators, and internal pastoral formation notes maintained by authorized coordinators.</p>

        <h4>C. Financial Contribution and Event Transaction Metadata</h4>
        <p>Voluntary God Is Good (GIG) tithes/offerings records and event/camp fee receipts (GCash reference ID, bank deposit reference, or cash receipt number). <em>The Platform operates strictly as an administrative ledger and never collects credit card PINs or bank passwords.</em></p>

        <h2>4. Technical Architecture and Identity Decoupling</h2>
        <ul>
          <li><strong>Directory Decoupling:</strong> Inclusion in the community member directory does not create or require a web portal login account.</li>
          <li><strong>Selective Account Provisioning:</strong> Portal accounts (<code>auth.users</code>) are provisioned selectively for accredited servant leaders and authorized couple coordinators.</li>
          <li><strong>PostgreSQL Row Level Security (RLS):</strong> Access privileges and geographic Area tenant boundaries are strictly enforced at the database layer.</li>
        </ul>

        <h2>5. Protection of Children and Minors (Under 18 Years Old)</h2>
        <p>The collection and processing of any personal information belonging to an individual under 18 years of age requires the written or verified electronic consent of a parent or legal guardian. Minor profiles are never public. Parents retain the absolute right at any time to inspect, correct, or demand the permanent deletion of their child's records.</p>

        <h2>6. Third-Party Cloud Infrastructure</h2>
        <div class="legal-table-wrapper">
          <table class="legal-table">
            <thead>
              <tr><th>Sub-Processor</th><th>Function</th><th>Location</th><th>Safeguards</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>Vercel Inc.</strong></td><td>Serverless edge runtime and web application hosting.</td><td>Global Edge</td><td>TLS 1.3 encryption, isolated serverless execution.</td></tr>
              <tr><td><strong>Supabase Inc.</strong></td><td>PostgreSQL database, Row Level Security, GoTrue JWT auth.</td><td>AWS APAC (Singapore)</td><td>AES-256 encryption at rest, automated encrypted backups, strict SSL.</td></tr>
              <tr><td><strong>Liturgical Feeds (EWTN)</strong></td><td>Daily Catholic readings and reflections.</td><td>Public API</td><td>Read-only public API calls; no personal data transmitted.</td></tr>
            </tbody>
          </table>
        </div>

        <h2>7. Data Subject Rights Under Philippine Law</h2>
        <p>Under Section 16 of the Data Privacy Act of 2012, every registered member and parent has the enforceable right to: <strong>Be Informed</strong>, <strong>Access</strong>, <strong>Rectification</strong>, <strong>Erasure or Blocking</strong>, <strong>Object</strong>, <strong>Data Portability</strong>, <strong>File a Complaint with the NPC</strong>, and <strong>Claim Damages</strong>.</p>

        <h2>8. Contact &amp; NPC Escalation</h2>
        <p><strong>Designated DPO:</strong> <code>[Insert Data Protection Officer Email]</code><br>
        <strong>Office:</strong> MFC Youth NCR Central, <code>[Insert Physical / Pastoral Office Address]</code><br>
        <strong>National Privacy Commission:</strong> <code>complaints@privacy.gov.ph</code> | Hotline: +63 2 8234 2228</p>
      `
    },

    terms: {
      title: 'Terms of Service',
      badge: 'Acceptable Use',
      html: `
        <h1>Terms of Service and Terms of Use</h1>
        <h3>MFC Youth Area Management System (NCR Central)</h3>
        <p><strong>Effective Date:</strong> October 1, 2026 &nbsp;|&nbsp; <strong>Governing Jurisdiction:</strong> Republic of the Philippines (Metro Manila)</p>

        <div class="legal-callout-box">
          <strong>Notice:</strong> This portal is an internal pastoral management tool. Directory records do not grant online accounts. Leader credentials must be kept confidential and cannot be shared.
        </div>

        <h2>1. Acceptance of Terms</h2>
        <p>By accessing or using the MFC Youth Area Management System Web Platform (AMS), you agree to be bound by these Terms of Service and all applicable laws of the Republic of the Philippines.</p>

        <h2>2. Community Scope and Eligibility</h2>
        <p>The Platform is designated exclusively for members, servant leaders, parents, and couple coordinators affiliated with Missionary Families for Christ (MFC) Youth - NCR Central and MFC Kids. Minors are cataloged only upon parental consent and are not provisioned administrative leader accounts unless appointed to supervised service.</p>

        <h2>3. User Accounts and Password Integrity</h2>
        <ul>
          <li>Accounts are provisioned selectively for accredited pastoral roles.</li>
          <li><strong>Prohibition of Credential Sharing:</strong> Servant leaders must never share login credentials, passwords, or session tokens. Every administrative action is tied to the authenticated identity for stewardship accountability.</li>
          <li>Promptly report any suspected unauthorized access or compromised credentials to the Area Data Protection Officer.</li>
        </ul>

        <h2>4. Acceptable Use Policy (AUP)</h2>
        <p>Users are expressly prohibited from:</p>
        <ul>
          <li>Attempting to alter, intercept, or tamper with backend API routes, Edge functions, or Supabase endpoints;</li>
          <li>Attempting to circumvent PostgreSQL Row Level Security (RLS) or elevate user privileges;</li>
          <li>Using automated scrapers, spiders, or bots to harvest member contact numbers or directory entries;</li>
          <li>Using directory data for commercial advertising, marketing, or political campaigning;</li>
          <li>Fabricating event attendance, GIG offerings, or camp registration entries.</li>
        </ul>
        <p>Violations will result in immediate account revocation, pastoral discipline, and reporting to authorities under Republic Act No. 10175 (Cybercrime Prevention Act of 2012) and RA 10173.</p>

        <h2>5. Disclaimer of Warranties ("As-Is" Service)</h2>
        <p>The Platform is maintained by volunteer technology ministers and provided on an "AS-IS" and "AS-AVAILABLE" basis without warranties of any kind.</p>

        <h2>6. Dispute Resolution and Venue</h2>
        <p>Any dispute shall first be submitted to the Area Coordinator and Couple Coordinators for fraternal dialogue and pastoral mediation. If unresolved, the exclusive venue for legal proceedings is the competent courts of <strong>Metro Manila, Philippines</strong>.</p>
      `
    },

    cookie: {
      title: 'Cookie & Storage Policy',
      badge: 'Zero-Tracking',
      html: `
        <h1>Cookie and Local Storage Policy</h1>
        <h3>MFC Youth Area Management System (NCR Central)</h3>
        <p><strong>Effective Date:</strong> October 1, 2026</p>

        <div class="legal-callout-box">
          <strong>Absolute Zero-Tracking Guarantee:</strong> We do not use commercial advertising cookies, marketing pixels (Meta Pixel, Google AdSense, TikTok), or cross-site tracking scripts.
        </div>

        <h2>1. Scope &amp; Technology Disclosure</h2>
        <p>This policy details how the Platform uses client-side Web Storage (<code>window.localStorage</code>) strictly for essential technical functions.</p>

        <h2>2. Utilization of Local Storage</h2>
        <div class="legal-table-wrapper">
          <table class="legal-table">
            <thead>
              <tr><th>Data Item / Key</th><th>Purpose &amp; Technical Function</th><th>Retention</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>GoTrue Auth Tokens</strong></td>
                <td>Stores short-lived JWT access tokens and refresh tokens from Supabase Auth to maintain login sessions for servant leaders.</td>
                <td>Cleared on Logout or token expiration.</td>
              </tr>
              <tr>
                <td><strong>Optimistic UI Hydration</strong></td>
                <td>Caches chapter rosters and ministry filter lists to render screens immediately and reduce network round-trips.</td>
                <td>Refreshed dynamically; cleared on browser cache reset.</td>
              </tr>
              <tr>
                <td><strong>UI State &amp; Preferences</strong></td>
                <td>Remembers user-selected sector filters and dashboard display preferences.</td>
                <td>Persistent until manually reset.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>3. How to Clear Stored Data</h2>
        <ul>
          <li><strong>Recommended:</strong> Clicking the <strong>Log Out</strong> button in the navigation bar immediately deletes all GoTrue session tokens and purges cached application data.</li>
          <li><strong>Browser Settings:</strong> You can clear website storage at any time via your browser Settings &gt; Privacy &amp; Security &gt; Clear Browsing Data.</li>
        </ul>
      `
    },

    parental: {
      title: 'Parental Consent Notice',
      badge: 'Minor Protection',
      html: `
        <h1>Parental and Legal Guardian Consent Notice</h1>
        <h3>Minor Protection Addendum for Parents and Guardians</h3>
        <p><strong>Statutory Framework:</strong> Republic Act No. 10173 (Data Privacy Act of 2012) and The Family Code of the Philippines</p>

        <div class="legal-callout-box">
          <strong>Letter to Parents:</strong> In Missionary Families for Christ, the family is the domestic church. When your child participates in MFC Kids (ages 4-12) or MFC Youth (ages 13-21), we handle their personal details with the highest pastoral care and confidentiality.
        </div>

        <h2>1. Information Collected About Your Child</h2>
        <ul>
          <li><strong>Basic Identity:</strong> Full legal name, preferred nickname, gender, and date of birth (for age-matched groupings).</li>
          <li><strong>Contact Details:</strong> Mobile number and email (or parent contact details if the youth does not have personal devices).</li>
          <li><strong>Family &amp; Emergency Contacts (Mandatory):</strong> Parent/guardian full names, active mobile numbers, and home address.</li>
          <li><strong>Camp &amp; Pastoral Notes:</strong> Youth Camp batch history, household group, and overnight medical/dietary alerts to ensure camp safety.</li>
        </ul>

        <h2>2. Pastoral Use Only</h2>
        <p>Your child's information is used exclusively for safety, emergency medical response during camps, age-appropriate household placement, and pastoral care. <strong>It is never made public, searchable on the web, or disclosed to commercial advertisers.</strong></p>

        <h2>3. Parental Rights</h2>
        <p>Under RA 10173, parents and legal guardians maintain total control: you may inspect your child's record, update contact numbers, or request immediate and permanent deletion from our active database at any time by contacting our Area Data Protection Officer.</p>

        <h2>4. Exercise of Rights</h2>
        <p><strong>Email:</strong> <code>[Insert Data Protection Officer Email]</code><br>
        <strong>Subject:</strong> <code>Parental Privacy Request - [Child Name] - [Chapter / Area]</code><br>
        <strong>Office:</strong> MFC Youth NCR Central, <code>[Insert Physical / Pastoral Office Address]</code></p>
      `
    },

    financial: {
      title: 'Financial Disclaimer',
      badge: 'Ledger Transparency',
      html: `
        <h1>Financial Contribution and Event Payment Disclaimer</h1>
        <h3>MFC Youth Area Management System (NCR Central)</h3>
        <p><strong>Effective Date:</strong> October 1, 2026</p>

        <div class="legal-callout-box">
          <strong>Administrative Ledger Only:</strong> This platform is not a bank, online store, or payment processor. We do not hold money or process credit cards on the web. Offerings (GIG) and camp fees are remitted offline or externally.
        </div>

        <h2>1. Nature of Voluntary Offerings (God Is Good / GIG)</h2>
        <ul>
          <li>GIG contributions are voluntary, freewill Christian tithes and offerings dedicated to youth evangelization, camp subsidies, and ministry operations.</li>
          <li>Contributions are completely voluntary and non-refundable once given.</li>
          <li>Offerings do not constitute payment for commercial goods and no VAT invoices are issued.</li>
        </ul>

        <h2>2. Event &amp; Youth Camp Registration Fees</h2>
        <p>Registration fees for Youth Camps, conferences, and retreats are calculated strictly on an operational cost-recovery basis (meals, venue, camp kits, shirts, sound system). Financial assistance subsidies are maintained for youth in need.</p>

        <h2>3. External Payment Channels</h2>
        <p>All remittances occur through external channels: cash handed to chapter finance servants, electronic fund transfers (GCash / Maya), or direct bank deposits to official community custody accounts. Entries on AMS serve purely as an informational audit trail.</p>

        <h2>4. Finance Office Contact</h2>
        <p><strong>Email:</strong> <code>[Insert Area Finance Email]</code><br>
        <strong>Office:</strong> MFC Youth NCR Central Stewardship Office, <code>[Insert Physical / Pastoral Office Address]</code></p>
      `
    },

    ip: {
      title: 'IP & Attribution',
      badge: 'Copyright & Feeds',
      html: `
        <h1>Intellectual Property and Content Attribution Notice</h1>
        <h3>MFC Youth Area Management System (NCR Central)</h3>
        <p><strong>Effective Date:</strong> October 1, 2026</p>

        <div class="legal-callout-box">
          <strong>Summary:</strong> Platform software and branding belong to MFC Youth. Scripture readings are displayed for non-profit liturgical reflection in fair use.
        </div>

        <h2>1. Ownership of Platform Assets</h2>
        <p>The names "Missionary Families for Christ", "MFC Youth", "MFC Kids", the official emblems, and custom software code (PostgreSQL schemas, Edge functions, UI components) are proprietary works protected under Republic Act No. 8293 (Intellectual Property Code of the Philippines).</p>

        <h2>2. Liturgical Scripture Feeds Attribution</h2>
        <ul>
          <li><strong>EWTN / USCCB Mass Readings:</strong> Daily liturgical scripture feeds displayed on the portal are integrated for non-profit spiritual formation and educational reflection under Section 185 of RA 8293 (Fair Use).</li>
          <li><strong>Biblical Translations:</strong> Citations may quote the Revised Standard Version: Catholic Edition (RSV-CE) or New American Bible Revised Edition (NABRE) with veneration for Catholic pastoral catechesis.</li>
        </ul>

        <h2>3. Open-Source Software Acknowledgments</h2>
        <p>We gratefully acknowledge the open-source projects powering our infrastructure: Node.js (MIT), Supabase &amp; GoTrue (Apache 2.0 / MIT), PostgreSQL (PostgreSQL License), and modern frontend utilities.</p>

        <h2>4. Copyright Inquiries &amp; Takedown</h2>
        <p><strong>Office:</strong> Office of Intellectual Property and Communications<br>
        <strong>Email:</strong> <code>[Insert Legal / Communications Email]</code><br>
        <strong>Mailing Address:</strong> <code>[Insert Physical / Pastoral Office Address, Metro Manila, Philippines]</code></p>
      `
    }
  };

  let activeTabId = 'overview';
  let modalBackdropEl = null;

  function createModalHtml() {
    return `
      <div
        id="legalModalBackdrop"
        class="legal-modal-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legalModalTitle"
        x-data="{
          open: false,
          activeTab: 'overview',
          badges: {
            overview: 'Suite Index',
            privacy: 'RA 10173',
            terms: 'User Agreement',
            cookies: 'Zero Tracking',
            parental: 'Minor Protection',
            financial: 'Administrative',
            ip: 'Attribution'
          }
        }"
        x-show="open"
        :class="{ 'is-active': open }"
        x-transition.opacity
        x-cloak
        @keydown.escape.window="if (open) closeLegalModal()"
        @click.self="closeLegalModal()"
      >
        <div class="legal-modal-dialog" x-show="open" x-transition>
          <header class="legal-modal-header">
            <div class="legal-header-titles">
              <span class="legal-badge-pill">
                <span class="legal-badge-dot"></span>
                <span id="legalModalBadge" x-text="badges[activeTab] || 'Compliance Suite'">Compliance Suite</span>
              </span>
              <h2 id="legalModalTitle" class="legal-modal-title">MFC Youth Compliance &amp; Legal Policies</h2>
              <p class="legal-modal-subtitle">Republic Act No. 10173 (Philippine Data Privacy Act of 2012) &amp; Operational Notices</p>
            </div>
            <button type="button" id="closeLegalModalBtn" class="legal-close-btn" aria-label="Close legal documents" @click="closeLegalModal()">&times;</button>
          </header>

          <nav class="legal-tabs-bar" aria-label="Legal documents selector">
            ${Object.keys(LEGAL_DOCUMENTS).map(key => `
              <button
                type="button"
                class="legal-tab-btn"
                :class="{ 'is-active': activeTab === '${key}' }"
                :aria-selected="activeTab === '${key}' ? 'true' : 'false'"
                @click="activeTab = '${key}'"
                data-legal-tab="${key}"
              >${LEGAL_DOCUMENTS[key].title}</button>
            `).join('')}
          </nav>

          <div id="legalDocBody" class="legal-doc-body" tabindex="0">
            ${Object.keys(LEGAL_DOCUMENTS).map(key => `
              <div x-show="activeTab === '${key}'" x-cloak>
                ${LEGAL_DOCUMENTS[key].html}
              </div>
            `).join('')}
          </div>

          <footer class="legal-modal-footer">
            <div class="legal-footer-note">
              <span>Official pastoral governance notice &bull; MFC Youth NCR Central</span>
            </div>
            <div class="legal-footer-actions">
              <button type="button" id="legalCloseSecondaryBtn" class="legal-btn legal-btn-secondary" @click="closeLegalModal()">Close</button>
              <button type="button" id="legalAcknowledgeBtn" class="legal-btn legal-btn-primary" @click="closeLegalModal()">Acknowledge &amp; Continue</button>
            </div>
          </footer>
        </div>
      </div>
    `;
  }

  function renderDocument(tabId) {
    if (!LEGAL_DOCUMENTS[tabId]) return;
    activeTabId = tabId;

    const state = modalBackdropEl?._x_dataStack?.[0];
    if (state) {
      state.activeTab = tabId;
      return;
    }

    const doc = LEGAL_DOCUMENTS[tabId];
    const bodyEl = document.getElementById('legalDocBody');
    const badgeEl = document.getElementById('legalModalBadge');

    if (bodyEl) {
      bodyEl.innerHTML = doc.html;
      bodyEl.scrollTop = 0;
    }
    if (badgeEl) {
      badgeEl.textContent = doc.badge || 'Compliance';
    }

    const tabBtns = document.querySelectorAll('[data-legal-tab]');
    tabBtns.forEach(btn => {
      const isTarget = btn.getAttribute('data-legal-tab') === tabId;
      btn.classList.toggle('is-active', isTarget);
      btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
    });
  }

  function ensureModalInDom() {
    if (!document.getElementById('legalModalBackdrop')) {
      const container = document.createElement('div');
      container.innerHTML = createModalHtml();
      document.body.appendChild(container.firstElementChild);
      modalBackdropEl = document.getElementById('legalModalBackdrop');

      const closeBtn = document.getElementById('closeLegalModalBtn');
      const cancelBtn = document.getElementById('legalCloseSecondaryBtn');
      const ackBtn = document.getElementById('legalAcknowledgeBtn');

      if (closeBtn) closeBtn.addEventListener('click', closeLegalModal);
      if (cancelBtn) cancelBtn.addEventListener('click', closeLegalModal);
      if (ackBtn) ackBtn.addEventListener('click', closeLegalModal);

      modalBackdropEl.addEventListener('click', (e) => {
        if (e.target === modalBackdropEl) {
          closeLegalModal();
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalBackdropEl && (modalBackdropEl.classList.contains('is-active') || modalBackdropEl._x_dataStack?.[0]?.open)) {
          closeLegalModal();
        }
      });
    } else {
      modalBackdropEl = document.getElementById('legalModalBackdrop');
    }
  }

  function openLegalModal(targetTab = 'overview') {
    ensureModalInDom();
    const state = modalBackdropEl?._x_dataStack?.[0];
    if (state) {
      state.activeTab = targetTab;
      state.open = true;
    } else {
      renderDocument(targetTab);
      modalBackdropEl?.classList.add('is-active');
    }
    document.body.style.overflow = 'hidden';
  }

  function closeLegalModal() {
    const state = modalBackdropEl?._x_dataStack?.[0];
    if (state) {
      state.open = false;
    } else {
      modalBackdropEl?.classList.remove('is-active');
    }
    document.body.style.overflow = '';
  }

  // Public APIs
  window.openLegalModal = openLegalModal;
  window.closeLegalModal = closeLegalModal;

  // Automatically pop up when entering the website
  document.addEventListener('DOMContentLoaded', () => {
    // Attach listener to any triggers
    document.querySelectorAll('.open-legal-modal, [data-open-legal]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = el.getAttribute('data-open-legal') || 'overview';
        openLegalModal(tab);
      });
    });

    // Automatic popup upon entering
    setTimeout(() => {
      openLegalModal('overview');
    }, 400);
  });
})();
