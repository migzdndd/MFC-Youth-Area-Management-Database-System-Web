# Cookie and Local Storage Policy
## MFC Youth Area Management System (NCR Central)

**Effective Date:** [Insert Effective Date, e.g., October 1, 2026]  
**Last Updated:** [Insert Last Updated Date, e.g., October 1, 2026]  
**Platform URL:** `https://mfc-youth-area-management-system.vercel.app`

---

### Plain-Language Summary

* **No Advertising Cookies:** This platform does not use advertising cookies, marketing trackers, or social media pixels. We do not track your activity across other websites.
* **Why We Use Local Storage:** We use your browser's built-in Web Storage (`localStorage`) to remember your login session and make the site load fast by caching your chapter list and dashboard layout.
* **Full Control:** You can log out or clear your browser's cache and local storage at any time using standard browser settings.

---

### 1. Introduction and Scope

This Cookie and Local Storage Policy explains how the MFC Youth Area Management System Web Platform (`mfc-youth-area-management-system.vercel.app`, hereinafter the "Platform") uses client-side storage technologies, specifically the Web Storage API (`localStorage`), to deliver a responsive, secure, and reliable user experience for our servant leaders and community members.

Unlike commercial websites that rely on tracking technologies to monetize user behavior, our platform operates as a pastoral and administrative utility dedicated to community service.

---

### 2. What Technologies We Use (and What We Do NOT Use)

#### A. What We DO NOT Use
* **No Commercial Advertising Cookies:** We do not place third-party advertising cookies on your computer or mobile device.
* **No Behavioral Marketing Pixels:** We do not embed the Meta (Facebook) Pixel, Google Ads remarketing tags, TikTok tracking pixels, or any commercial ad network scripts.
* **No Third-Party Cross-Site Tracking:** We do not track your browsing habits, search history, or personal activities across other websites or online services.

#### B. What We DO Use: Browser Local Storage (`localStorage`)
The Platform relies on standard browser Web Storage (`window.localStorage`). Unlike traditional HTTP cookies, information stored in `localStorage`:
* Stays strictly within your local browser on your device;
* Is never automatically transmitted in HTTP request headers with every web page load;
* Is accessible only by code served from our exact secure domain (`mfc-youth-area-management-system.vercel.app`).

---

### 3. Purpose and Exact Utilization of Local Storage

We store small data fragments in `localStorage` strictly for essential technical and operational functions:

| Data Item / Key Type | Purpose and Technical Function | Retention Period |
| :--- | :--- | :--- |
| **GoTrue Authentication Tokens** | Stores your short-lived JSON Web Token (JWT) access token and refresh token issued by Supabase Auth. This keeps authenticated servant leaders logged in as they navigate between ministry modules. | Cleared upon clicking "Log Out" or upon token expiration. |
| **Optimistic UI Hydration Cache** | Temporarily caches community directory lists, chapter rosters, and ministry filters. When you open a screen, the cached data displays immediately (preventing blank screens or flickering), while updated data is fetched in the background. | Refreshed dynamically during active sessions; cleared upon logout or browser cache reset. |
| **UI State and Filter Preferences** | Remembers user-selected interface states, such as active sector filters, attendance filter parameters, or visual layout preferences. | Persistent until manually cleared or overwritten by new preferences. |

All use of `localStorage` on our platform falls under the category of **Strictly Necessary Technical Storage**, without which the authenticated portal and responsive user interface could not function properly.

---

### 4. Third-Party Content and External Feeds

The Platform includes an external integration to fetch and display Catholic liturgical readings (e.g., EWTN / Revised Standard Version Catholic Edition daily scripture feeds).

* This integration functions via serverless Edge endpoints or direct read-only API calls.
* No personal data, session tokens, or local storage contents are transmitted to external scripture providers.
* External content providers do not set tracking cookies through our application shell.

---

### 5. How to Clear Local Storage and Session Data

You have complete control over data stored on your device. You can clear your authenticated session and remove cached directory data at any time through the following steps:

#### Method 1: Logging Out of the Platform (Recommended)
Clicking the **Log Out** button located in the user profile navigation bar automatically deletes your GoTrue authentication tokens and purges cached session data from your browser `localStorage`.

#### Method 2: Manually Clearing Browser Data by Browser
* **Google Chrome (Desktop and Mobile):** Settings > Privacy and security > View permissions and data stored across sites > Search for `vercel.app` > Clear data.
* **Microsoft Edge:** Settings > Cookies and site permissions > Manage and delete cookies and site data > Delete.
* **Mozilla Firefox:** Settings > Privacy & Security > Cookies and Site Data > Manage Data > Remove Selected.
* **Apple Safari (macOS and iOS):** Settings > Safari > Advanced > Website Data > Delete.

---

### 6. Contact Us

If you have questions about our use of local storage or technical data handling, please contact:

* **Email:** `[Insert Data Protection Officer Email]`
* **Area Leadership Office:** MFC Youth NCR Central, `[Insert Physical / Pastoral Office Address]`
