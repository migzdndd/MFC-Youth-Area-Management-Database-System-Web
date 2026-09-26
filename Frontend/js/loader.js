/**
 * MFC Youth Area Management System - Page Loader & Screen Transition Animations
 *
 * What this file does:
 * Makes moving between pages feel smooth and instant. It shows a branded loading curtain
 * and placeholder outlines (skeletons) while data is loading so the screen never flickers or jumps.
 *
 * Backup plan if it breaks:
 * If an animation or prefetch fails, the system automatically falls back to standard browser
 * page loading, and an emergency 5-second timer ensures the loading curtain is never stuck on screen.
 */

(() => {
  // --------------------------------------------------------------------------
  // Settings & Navigation State
  // --------------------------------------------------------------------------
  const LOADER_ID = 'mfcPageLoader';
  const PREFETCH_DELAY_MS = 40;
  const NAVIGATION_TIMEOUT_MS = 5000;
  let navigating = false;
  let navigationTimer = null;

  // --------------------------------------------------------------------------
  // Friendly Page Title Finder
  // --------------------------------------------------------------------------

  /**
   * Get Friendly Page Name
   *
   * What it does:
   * Looks at a web address and returns a friendly title (like "Dashboard", "Members", or "Reports")
   * so the loading screen can say "Opening Dashboard" instead of showing a confusing web address.
   *
   * Backup plan if it breaks:
   * If the address is unrecognized or cannot be read, it safely says "Your next page".
   */
  function destinationLabel(url) {
    try {
      const path = new URL(url, window.location.href).pathname.replace(/\/$/, '');
      const labels = {
        '': 'Welcome',
        '/': 'Welcome',
        '/dashboard': 'Dashboard',
        '/member': 'Member portal',
        '/chapters': 'Chapters',
        '/events': 'Events',
        '/members': 'Members',
        '/reports': 'Reports',
        '/services': 'Services',
        '/register': 'Account access',
        '/change-password': 'Security settings',
        '/forgot-password': 'Password recovery',
        '/reset-password': 'Reset password',
        '/mfa-verify': 'Two-factor verification',
        '/mfa-setup': 'Two-factor authentication'
      };
      return labels[path] || 'Your next page';
    } catch {
      return 'Your next page';
    }
  }

  // --------------------------------------------------------------------------
  // Placeholder Screen Outlines (Skeletons)
  // Shows gray placeholder shapes while live information is being fetched
  // --------------------------------------------------------------------------

  /**
   * Build Header Placeholder
   *
   * What it does:
   * Creates light gray placeholder bars for the page title and top buttons.
   *
   * Backup plan if it breaks:
   * Renders simple placeholder shapes that will be automatically replaced as soon as the real page loads.
   */
  function skeletonHeader(withAction = true) {
    return `
      <header class="page-header skeleton-page-header" aria-hidden="true">
        <div>
          <span class="skeleton-line skeleton-title"></span>
          <span class="skeleton-line skeleton-subtitle"></span>
        </div>
        ${withAction ? '<span class="skeleton-block skeleton-action"></span>' : ''}
      </header>
    `;
  }

  /**
   * Build Table Placeholder
   *
   * What it does:
   * Draws a temporary gray grid showing rows and columns while member or chapter tables are loading.
   *
   * Backup plan if it breaks:
   * Safely defaults to a standard 5-row outline if row counts are not specified.
   */
  function tableSkeleton(rows = 5, columns = 6) {
    const header = Array.from({ length: columns }, () => '<span class="skeleton-line skeleton-table-head"></span>').join('');
    const body = Array.from({ length: rows }, () => `
      <div class="skeleton-table-row">
        ${Array.from({ length: columns }, () => '<span class="skeleton-line skeleton-table-cell"></span>').join('')}
      </div>
    `).join('');

    return `
      <div class="skeleton-table card" aria-hidden="true">
        <div class="skeleton-table-row skeleton-table-header">${header}</div>
        ${body}
      </div>
    `;
  }

  /**
   * Build Card Grid Placeholder
   *
   * What it does:
   * Generates temporary empty card boxes for numbers and statistics.
   *
   * Backup plan if it breaks:
   * Defaults to 4 placeholder card shapes.
   */
  function cardsSkeleton(count = 4) {
    return `
      <div class="skeleton-card-grid" aria-hidden="true">
        ${Array.from({ length: count }, () => `
          <article class="card skeleton-card">
            <span class="skeleton-line skeleton-card-title"></span>
            <span class="skeleton-line skeleton-card-number"></span>
            <span class="skeleton-line skeleton-card-copy"></span>
          </article>
        `).join('')}
      </div>
    `;
  }

  /**
   * Build Toolbar Placeholder
   *
   * What it does:
   * Draws gray outlines for the search box and filter dropdowns.
   *
   * Backup plan if it breaks:
   * Generates standard placeholder blocks without throwing errors.
   */
  function toolbarSkeleton() {
    return `
      <div class="toolbar skeleton-toolbar" aria-hidden="true">
        <span class="skeleton-block skeleton-search"></span>
        <span class="skeleton-block skeleton-filter"></span>
        <span class="skeleton-block skeleton-filter"></span>
      </div>
    `;
  }

  /**
   * Match Skeleton to Screen
   *
   * What it does:
   * Checks which page you are on (like Members, Chapters, Events, or Dashboard)
   * and draws the matching layout outlines.
   *
   * Backup plan if it breaks:
   * If the page name is unknown or missing, it falls back to a clean 3-card placeholder design.
   */
  function pageSkeleton(page) {
    switch (page) {
      case 'dashboard':
        return `
          ${skeletonHeader(false)}
          <section class="skeleton-section" aria-hidden="true">
            <div class="skeleton-section-heading">
              <span class="skeleton-line skeleton-heading"></span>
              <span class="skeleton-line skeleton-copy"></span>
            </div>
            ${cardsSkeleton(5)}
          </section>
          <section class="skeleton-two-column" aria-hidden="true">
            <article class="card skeleton-panel">${tableSkeleton(3, 2)}</article>
            <article class="card skeleton-panel">${tableSkeleton(3, 2)}</article>
          </section>
        `;
      case 'services':
        return `${skeletonHeader(false)}${cardsSkeleton(7)}`;
      case 'members':
        return `${skeletonHeader(true)}${toolbarSkeleton()}${tableSkeleton(6, 7)}`;
      case 'chapters':
        return `${skeletonHeader(true)}${toolbarSkeleton()}${cardsSkeleton(4)}`;
      case 'reports':
        return `${skeletonHeader(true)}${cardsSkeleton(4)}${toolbarSkeleton()}${tableSkeleton(5, 6)}`;
      case 'events':
        return `${skeletonHeader(true)}${toolbarSkeleton()}${cardsSkeleton(4)}`;
      default:
        return `${skeletonHeader(false)}${cardsSkeleton(3)}`;
    }
  }

  // --------------------------------------------------------------------------
  // Showing & Clearing Placeholder Screens
  // --------------------------------------------------------------------------

  /**
   * Show Skeleton Screen
   *
   * What it does:
   * Places the gray layout outlines onto the screen while data is loading so the page doesn't look blank.
   *
   * Backup plan if it breaks:
   * Catches errors quietly and logs a warning so the live data can still appear without interruption.
   */
  function showPageSkeleton() {
    try {
      const root = document.getElementById('pageContent') || document.getElementById('memberPortalContent');
      if (!root || root.childElementCount > 0 || root.dataset.skeletonReady === '1') return;

      const isMemberPortal = root.id === 'memberPortalContent';
      root.dataset.skeletonReady = '1';
      root.setAttribute('aria-busy', 'true');

      const markup = isMemberPortal
        ? `
          <div class="page-skeleton member-portal-skeleton" data-page-skeleton>
            <section class="member-welcome-card skeleton-member-hero" aria-hidden="true">
              <div>
                <span class="skeleton-line skeleton-copy"></span>
                <span class="skeleton-line skeleton-title"></span>
                <span class="skeleton-line skeleton-subtitle"></span>
              </div>
              <span class="skeleton-block skeleton-member-badge"></span>
            </section>
            ${cardsSkeleton(4)}
            <section class="skeleton-member-stack" aria-hidden="true">
              ${Array.from({ length: 3 }, () => '<article class="card skeleton-member-event"><span class="skeleton-block skeleton-member-date"></span><div><span class="skeleton-line skeleton-card-title"></span><span class="skeleton-line skeleton-card-copy"></span></div></article>').join('')}
            </section>
          </div>
        `
        : `<div class="page-skeleton" data-page-skeleton>${pageSkeleton(document.body?.dataset?.page || '')}</div>`;

      root.innerHTML = markup;
    } catch (error) {
      console.warn('Skeleton loader skipped:', error?.message || error);
    }
  }

  /**
   * Remove Skeleton Screen
   *
   * What it does:
   * Sweeps away the gray placeholder blocks once the real data arrives and is ready to view.
   *
   * Backup plan if it breaks:
   * Safely ignores missing elements so the real content stays visible and interactive.
   */
  function clearPageSkeleton() {
    try {
      const roots = [
        document.getElementById('pageContent'),
        document.getElementById('memberPortalContent')
      ].filter(Boolean);

      roots.forEach(root => {
        root.removeAttribute('aria-busy');
        delete root.dataset.skeletonReady;
        root.querySelector('[data-page-skeleton]')?.remove();
      });
    } catch (error) {
      console.warn('Skeleton cleanup skipped:', error?.message || error);
    }
  }

  // --------------------------------------------------------------------------
  // Full-Screen Loading Curtain
  // --------------------------------------------------------------------------

  /**
   * Build Loading Screen Curtain
   *
   * What it does:
   * Creates the full-screen dark overlay with the official MFC Youth logo and spinning ring.
   *
   * Backup plan if it breaks:
   * If the curtain already exists or the page body is not ready, it exits safely.
   */
  function ensureLoader() {
    try {
      if (document.getElementById(LOADER_ID) || !document.body) return;

      const overlay = document.createElement('div');
      overlay.id = LOADER_ID;
      overlay.className = 'page-loader';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.innerHTML = `
        <div class="page-loader__content" role="status" aria-live="polite" aria-label="Loading page">
          <div class="page-loader__mark" aria-hidden="true">
            <span class="page-loader__mark-ring"></span>
            <img class="page-loader__logo" src="/img/logo-2.png" alt="" decoding="async" fetchpriority="high">
          </div>
          <div class="page-loader__copy">
            <span class="page-loader__overline">MFC Youth</span>
            <strong class="page-loader__label">Opening page</strong>
            <span class="page-loader__destination"></span>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
    } catch (error) {
      console.warn('Page loader setup skipped:', error?.message || error);
    }
  }

  /**
   * Turn On Loading Curtain
   *
   * What it does:
   * Smoothly fades in the full-screen loading curtain so users know their request is in progress.
   *
   * Backup plan if it breaks:
   * If the curtain element cannot be created, navigation proceeds immediately without animation.
   */
  function show() {
    try {
      ensureLoader();
      const overlay = document.getElementById(LOADER_ID);
      if (!overlay) return;
      const destination = overlay.querySelector('.page-loader__destination');
      if (destination) destination.textContent = 'Loading workspace';
      overlay.classList.add('is-active');
      overlay.setAttribute('aria-hidden', 'false');
    } catch (error) {
      console.warn('Page loader show skipped:', error?.message || error);
    }
  }

  /**
   * Turn Off Loading Curtain
   *
   * What it does:
   * Fades out and hides the loading curtain when the page has finished loading.
   *
   * Backup plan if it breaks:
   * Automatically clears any active timers so the curtain is never left stuck over the screen.
   */
  function hide() {
    try {
      const overlay = document.getElementById(LOADER_ID);
      navigating = false;
      if (navigationTimer) {
        window.clearTimeout(navigationTimer);
        navigationTimer = null;
      }
      if (!overlay) return;
      overlay.classList.remove('is-active');
      overlay.setAttribute('aria-hidden', 'true');
    } catch (error) {
      console.warn('Page loader hide skipped:', error?.message || error);
    }
  }

  // --------------------------------------------------------------------------
  // Moving Between Pages
  // --------------------------------------------------------------------------

  /**
   * Move to Next Screen
   *
   * What it does:
   * Shows the loading screen with the page title and asks the browser to open the new page.
   *
   * Backup plan if it breaks:
   * Features an automatic 5-second emergency safety timer. If the network or page stalls,
   * the curtain disappears automatically so the user is never trapped, and standard navigation takes over.
   */
  function navigate(url, options = {}) {
    try {
      if (!url || navigating) return;
      navigating = true;
      show();

      const overlay = document.getElementById(LOADER_ID);
      const destination = overlay?.querySelector('.page-loader__destination');
      if (destination) destination.textContent = `Opening ${destinationLabel(url)}`;

      // Open the new web page
      if (options.replace) {
        window.location.replace(url);
      } else {
        window.location.assign(url);
      }

      // 5-second emergency safety net
      navigationTimer = window.setTimeout(() => {
        if (navigating) hide();
      }, NAVIGATION_TIMEOUT_MS);
    } catch (error) {
      navigating = false;
      hide();
      console.error('Navigation failed:', error);
      try {
        window.location.href = url;
      } catch {}
    }
  }

  // --------------------------------------------------------------------------
  // Link Click & Instant Background Pre-Loading
  // --------------------------------------------------------------------------

  /**
   * Check If Link Can Be Pre-Loaded
   *
   * What it does:
   * Checks if a clicked link points to an internal page of this website (not an outside website,
   * email link, right-click, or file download).
   *
   * Backup plan if it breaks:
   * Safely returns false so the browser performs its normal standard link click.
   */
  function shouldHandleLink(anchor, event) {
    try {
      if (!anchor || event.defaultPrevented) return false;
      if (event.button !== 0) return false; // Left click only
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false; // Ignore modified clicks
      if (anchor.hasAttribute('download')) return false;
      if (anchor.target && anchor.target.toLowerCase() !== '_self') return false;

      const rawHref = anchor.getAttribute('href');
      if (!rawHref || rawHref.startsWith('#')) return false;
      if (/^(mailto:|tel:|javascript:)/i.test(rawHref)) return false;

      const target = new URL(anchor.href, window.location.href);
      if (target.origin !== window.location.origin) return false;

      const current = new URL(window.location.href);
      const sameDocument = target.pathname === current.pathname && target.search === current.search && target.hash === current.hash;
      return !sameDocument;
    } catch {
      return false;
    }
  }

  const prefetched = new Set();

  /**
   * Pre-Load Page in Background
   *
   * What it does:
   * Quietly fetches upcoming pages when you hover over links so they open instantly without waiting.
   *
   * Backup plan if it breaks:
   * Checks if the link was already fetched; if anything errors, it fails silently without slowing down the page.
   */
  function prefetchUrl(rawUrl) {
    try {
      const target = new URL(rawUrl, window.location.href);
      if (target.origin !== window.location.origin) return;
      if (target.pathname === window.location.pathname) return;
      const key = `${target.pathname}${target.search}`;
      if (prefetched.has(key)) return;
      prefetched.add(key);

      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = target.href;
      link.as = 'document';
      document.head.appendChild(link);
    } catch {}
  }

  /**
   * Pre-Warm Visible Links
   *
   * What it does:
   * When your computer is sitting idle, it quietly prepares the visible menu links in the background.
   *
   * Backup plan if it breaks:
   * Limits pre-warming to 12 links so it never uses too much internet data, and catches any errors.
   */
  function warmVisibleNavigation() {
    try {
      const links = [...document.querySelectorAll('a[href]')]
        .filter(anchor => {
          try {
            const target = new URL(anchor.href, window.location.href);
            return target.origin === window.location.origin && target.pathname !== window.location.pathname;
          } catch {
            return false;
          }
        })
        .slice(0, 12);

      const run = () => links.forEach(anchor => prefetchUrl(anchor.href));
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(run, { timeout: 500 });
      } else {
        window.setTimeout(run, 120);
      }
    } catch (error) {
      console.warn('Page prefetch skipped:', error?.message || error);
    }
  }

  // --------------------------------------------------------------------------
  // Setting Up Event Listeners
  // --------------------------------------------------------------------------
  ensureLoader();
  showPageSkeleton();
  warmVisibleNavigation();

  // Pre-load page when mouse hovers over link
  document.addEventListener('pointerover', event => {
    try {
      const anchor = event.target.closest?.('a[href]');
      if (!anchor) return;
      window.setTimeout(() => prefetchUrl(anchor.href), PREFETCH_DELAY_MS);
    } catch {}
  }, { passive: true });

  // Intercept normal left-clicks on internal links
  document.addEventListener('click', event => {
    try {
      const anchor = event.target.closest?.('a[href]');
      if (!shouldHandleLink(anchor, event)) return;
      event.preventDefault();
      navigate(anchor.href);
    } catch (error) {
      console.error('Navigation click handler failed:', error);
    }
  }, true);

  // Hide curtain when using browser Back/Forward buttons
  window.addEventListener('pageshow', () => {
    hide();
  });

  if (document.readyState === 'complete') {
    hide();
  } else {
    window.addEventListener('DOMContentLoaded', hide);
    window.addEventListener('load', hide);
  }

  // --------------------------------------------------------------------------
  // Floating Help & Access Guide Button
  // --------------------------------------------------------------------------

  /**
   * Build Floating Help Button & Guide
   *
   * What it does:
   * Adds the floating question mark ('?') button in the corner and creates the guide popup window
   * explaining how to sign in and what each leadership role can do.
   *
   * Backup plan if it breaks:
   * Checks if the button already exists before adding it, and provides multiple easy ways to close it
   * (clicking the 'X', clicking outside, or clicking the button again).
   */
  function ensureAccessGuideUI() {
    if (document.getElementById('mfcGuideFab')) return;

    const fab = document.createElement('button');
    fab.id = 'mfcGuideFab';
    fab.className = 'mfc-guide-fab';
    fab.setAttribute('aria-label', 'Help & Access Guide');
    fab.setAttribute('title', 'Help & Access Guide');
    fab.innerHTML = '?';

    const modal = document.createElement('div');
    modal.id = 'mfcGuideModal';
    modal.className = 'mfc-guide-modal';
    
    modal.innerHTML = `
      <div class="mfc-guide-modal-content">
        <button class="mfc-guide-close" id="mfcGuideClose" aria-label="Close Guide">&times;</button>
        <h1>Welcome to the MFC Youth System</h1>
        <h2>How to Access and Use the Portal</h2>
        <p>Welcome! This quick guide will help you understand how to log in, what to expect when you access your account, and where you'll find your tools based on your role in MFC Youth.</p>
        <hr>
        <h3>1. Logging In</h3>
        <p>To access your account, simply head to the main login page:</p>
        <ol>
          <li>Enter the <strong>Email Address</strong> associated with your MFC Youth profile.</li>
          <li>Enter your <strong>Password</strong>.</li>
          <li>(Optional) Check the <strong>"Remember Me"</strong> box if you are using a personal, trusted device.</li>
          <li>Click <strong>Sign In</strong>.</li>
        </ol>
        <p><strong>Forgot your password?</strong> Don't worry! Click the "Forgot Password" link on the login page to securely reset it via email.</p>
        <hr>
        <h3>2. First-Time Setup & Security</h3>
        <p>If this is your very first time logging in, or if an administrator recently reset your account, the system may ask you to update your security settings before you can proceed:</p>
        <ul>
          <li><strong>Change Password:</strong> You will be redirected to a secure page to choose a new, private password.</li>
          <li><strong>Area Setup:</strong> If your local area profile isn't fully configured yet, you'll be asked to provide some quick details before jumping into the dashboard.</li>
        </ul>
        <hr>
        <h3>3. Where You'll Go (Based on Your Role)</h3>
        <p>The MFC Youth Area Management System automatically customizes your experience depending on your current service role. Once you log in, you will be taken to the portal that fits your responsibilities:</p>
        <h4><img src="/Icons/members.png" alt="" style="width: 20px; vertical-align: middle; margin-right: 8px; filter: brightness(0) saturate(100%) invert(23%) sepia(13%) saturate(1212%) hue-rotate(174deg) brightness(96%) contrast(87%);"> General Members</h4>
        <ul>
          <li>Here, you can view your personal profile.</li>
          <li>See upcoming MFC Youth events in your area.</li>
          <li>Stay updated with recent announcements.</li>
        </ul>
        <h4><img src="/Icons/chapters.png" alt="" style="width: 20px; vertical-align: middle; margin-right: 8px; filter: brightness(0) saturate(100%) invert(23%) sepia(13%) saturate(1212%) hue-rotate(174deg) brightness(96%) contrast(87%);"> Chapter Servants</h4>
        <ul>
          <li>From here, you can manage your chapter’s member list.</li>
          <li>Keep track of chapter-specific activities and reports.</li>
        </ul>
        <h4><img src="/Icons/dashboard.png" alt="" style="width: 20px; vertical-align: middle; margin-right: 8px; filter: brightness(0) saturate(100%) invert(23%) sepia(13%) saturate(1212%) hue-rotate(174deg) brightness(96%) contrast(87%);"> Area Admins, Coordinators & Other Servant Leaders</h4>
        <ul>
          <li>This is your high-level control center.</li>
          <li>You’ll have access to area-wide analytics, activity reports, and cross-chapter member directories.</li>
        </ul>
        <hr>
        <h3>Need Help?</h3>
        <p>If you ever get lost, you can safely log out by clicking the <strong>"Logout"</strong> button located at the bottom of your sidebar navigation (or the top right in the Member Portal).</p>
        <p>If you believe your account has the wrong role or you cannot access the features you need, please contact your immediate Area Administrator or Couple Coordinator for assistance.</p>
      </div>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(modal);

    const closeModal = () => modal.classList.remove('active');
    
    fab.addEventListener('click', () => modal.classList.add('active'));
    document.getElementById('mfcGuideClose').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Ensure access guide UI is built when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureAccessGuideUI);
  } else {
    ensureAccessGuideUI();
  }

  // --------------------------------------------------------------------------
  // System Tools & Popup Toast Messages
  // --------------------------------------------------------------------------
  window.MFCPageLoader = { show, hide, navigate };
  window.MFCPageSkeleton = { show: showPageSkeleton, clear: clearPageSkeleton };
  window.navigateWithLoader = (url, replace = false) => navigate(url, { replace });

  if (typeof window.toast !== 'function') {
    /**
     * Show Temporary Toast Notification
     *
     * What it does:
     * Pops up a sleek message box (green for success, red for errors) in the corner of your screen
     * that automatically disappears after a few seconds.
     *
     * Backup plan if it breaks:
     * Creates the toast container dynamically if not present, pauses the countdown if you hover over it,
     * and provides an 'X' button so you can dismiss it immediately.
     */
    window.toast = function (text, type = 'success', duration = 4000) {
      let wrap = document.getElementById('toastWrap');
      if (!wrap) {
        wrap = document.createElement('div');
        wrap.id = 'toastWrap';
        wrap.className = 'toast-wrap';
        wrap.setAttribute('aria-live', 'polite');
        wrap.setAttribute('aria-atomic', 'true');
        document.body.appendChild(wrap);
      }

      const isSuccess = type === 'success';
      const isError = type === 'error';
      const defaultTitle = isSuccess ? 'Success' : (isError ? 'Error' : 'Notice');

      let title = defaultTitle;
      let message = text;

      if (typeof text === 'object' && text !== null) {
        title = text.title || defaultTitle;
        message = text.message || text.text || '';
      }

      const esc = (val = '') => String(val).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

      const item = document.createElement('div');
      item.className = `toast card ${type}`;
      item.setAttribute('role', isError ? 'alert' : 'status');

      item.innerHTML = `
        <svg class="wave" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M0,256L48,261.3C96,267,192,277,288,266.7C384,256,480,224,576,186.7C672,149,768,107,864,112C960,117,1056,171,1152,181.3C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
        <div class="icon-container">
          ${isSuccess
            ? `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden="true">
                <path fill="currentColor" d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"></path>
              </svg>`
            : `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden="true">
                <path fill="currentColor" d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24V264c0 13.3-10.7 24-24 24s-24-10.7-24-24V152c0-13.3 10.7-24 24-24zm32 224a32 32 0 1 1 -64 0 32 32 0 1 1 64 0z"></path>
              </svg>`
          }
        </div>
        <div class="message-text-container">
          <p class="message-text">${esc(title)}</p>
          <p class="sub-text">${esc(message)}</p>
        </div>
        <svg class="cross-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" fill="none" role="button" tabindex="0" aria-label="Dismiss notification">
          <path fill="currentColor" d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" clip-rule="evenodd" fill-rule="evenodd"></path>
        </svg>
      `;

      const dismiss = () => {
        item.classList.add('toast-hide');
        setTimeout(() => item.remove(), 240);
      };

      const cross = item.querySelector('.cross-icon');
      if (cross) {
        cross.addEventListener('click', dismiss);
        cross.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            dismiss();
          }
        });
      }

      let timer = setTimeout(dismiss, duration);
      item.addEventListener('mouseenter', () => clearTimeout(timer));
      item.addEventListener('mouseleave', () => {
        timer = setTimeout(dismiss, duration);
      });

      wrap.appendChild(item);
      return item;
    };
  }
})();
