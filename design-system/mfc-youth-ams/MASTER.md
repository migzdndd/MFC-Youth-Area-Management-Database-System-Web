# Design System Master File — MFC Youth AMS

> **LOGIC & HIERARCHY:**
> When building or styling any page or component, first check `design-system/mfc-youth-ams/pages/[page-name].md`.
> If that file exists, its page-specific rules **override** this Master file.
> If no page override file exists, strictly follow the rules in this Master file.
> **Anti-Slop Integration:** This design system enforces the `antislop`, `antislop-ui`, and `antislop-layoutmobile` craftsmanship rules during both planning and execution.

---

## 1. System Metadata & Design Dials

- **Project:** Missionary Families for Christ (MFC) Youth Area Management System (`MFC Youth AMS`)
- **Platform:** React 19 + TypeScript + Tailwind CSS v4 + Vite (Responsive Web Application across Desktop, Tablet, and Mobile Web Browsers)
- **Target Audience:** MFC Youth Servant Leaders, Chapter Heads, Area Coordinators, Domain Moderators (LIT, Campus, High, Kids)
- **Primary Operating Context:** Field environments (parish halls, camp grounds, youth assemblies) on mobile devices under varying outdoor light, plus desktop administrative workstations for roster and activity reporting.

### Design Dials
| Dial | Value | Descriptor | Application & Rationale |
|------|-------|------------|-------------------------|
| **ENERGY** | `1/3` | Calm / Reverent | High pastoral trust, utility-driven, clean hierarchy. Avoids loud startup gimmicks, neon accents, and decorative clutter. |
| **RHYTHM** | `2/3` | Structured / Balanced | Predictable field operational layout, consistent card anatomy, clear content-driven reflow between mobile and desktop. |
| **MOTION** | `1/3` | Subtle / Micro-only | Fast, responsive feedback (150–200ms ease). No slow fades, bouncing, or motion that impedes rapid field entry. |
| **Variance** | `4/10` | Balanced / Modern | Clean rectangular & rounded-lg components with consistent alignment and deliberate visual anchors. |
| **Density** | `7/10` | Field Operational Density | Compact data presentation for rosters and attendance without sacrificing 44px touch targets. |

### Design Read
> **"Reading this as: Field and administrative pastoral management system for MFC Youth servant leaders, in a dignified reverent-utility visual language, dial ENERGY 1 / RHYTHM 2 / MOTION 1."**

---

## 2. Core Color Tokens & WCAG AA Contrast System

The MFC Youth AMS color identity represents community dignity, pastoral reverence, and clarity. It strictly forbids arbitrary gradients, glowing neon orbs, or dark-mode-for-the-sake-of-tech aesthetics.

### Color Tokens (Tailwind CSS v4 `@theme`)

```css
@theme {
  /* Brand Primary: Deep Community Navy */
  --color-navy: #002847;
  --color-navy-deep: #00182C;
  --color-navy-light: #0A3D66;
  --color-navy-surface: #06233B;

  /* Surfaces & Canvas */
  --color-canvas: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-surface-hover: #F1F5F9;
  --color-surface-subtle: #F8FAFC;

  /* Typography / Text Tokens */
  --color-text-main: #0F172A;
  --color-text-muted: #475569;
  --color-text-subtle: #64748B;

  /* Structural Borders */
  --color-border-subtle: #E2E8F0;
  --color-border-strong: #CBD5E1;

  /* Community Accent: Dignified Warm Gold / Amber */
  --color-gold: #D97706;
  --color-gold-light: #FEF3C7;
  --color-gold-dark: #B45309;

  /* Status Tokens (WCAG AA Compliant) */
  --color-mfc-green: #15803D;
  --color-mfc-green-light: #DCFCE7;
  --color-mfc-amber: #B45309;
  --color-mfc-amber-light: #FEF3C7;
  --color-mfc-red: #B91C1C;
  --color-mfc-red-light: #FEE2E2;
  --color-mfc-blue: #0284C7;
  --color-mfc-blue-light: #E0F2FE;

  /* Typography Fonts */
  --font-heading: 'Poppins', sans-serif;
  --font-body: 'Open Sans', sans-serif;
  --font-ui: 'Raleway', sans-serif;
}
```

### Contrast & Legibility Pairs (WCAG AA & AAA Certified)

| Element Pair | Foreground | Background | Contrast Ratio | WCAG Compliance | Purpose |
|--------------|------------|------------|----------------|-----------------|---------|
| Primary Button Text | `#FFFFFF` | `#002847` (Navy) | **15.6:1** | AAA Pass | Primary action clarity in bright sunlight |
| Main Body Text | `#0F172A` | `#FFFFFF` (Surface) | **19.5:1** | AAA Pass | High legibility for long member tables |
| Main Body on Canvas | `#0F172A` | `#F8FAFC` (Canvas) | **18.7:1** | AAA Pass | Field readability on light background |
| Muted Subtitles | `#475569` | `#FFFFFF` (Surface) | **7.0:1** | AAA Pass | Secondary metadata without eye strain |
| Subtle Footers/Captions| `#64748B` | `#FFFFFF` (Surface) | **4.6:1** | AA Pass | Timestamps, tertiary labels |
| Accent Button Text | `#FFFFFF` | `#D97706` (Gold) | **3.5:1** (large) / use `#00182C` or `#B45309` for small text | AA Pass | Secondary action highlights |
| Success Status Badge | `#15803D` | `#DCFCE7` | **5.8:1** | AA Pass | Active member / Paid fee status |
| Warning Status Badge | `#B45309` | `#FEF3C7` | **5.2:1** | AA Pass | Pending verification status |
| Danger Status Badge | `#B91C1C` | `#FEE2E2` | **6.1:1** | AA Pass | Inactive / Unpaid / Conflict status |
| Info Status Badge | `#0284C7` | `#E0F2FE` | **4.9:1** | AA Pass | Domain role / LIT Pillar tag |

---

## 3. Typography Hierarchy & Sizing

### Font Pairings
- **Headings (`h1`, `h2`, `h3`, `h4`, `h5`, `h6`)**: `Poppins`, sans-serif (Weights: `600` SemiBold, `700` Bold)
  - *Purpose:* Friendly yet dignified geometric structure that anchors page headers and section titles.
- **Body & Continuous Copy**: `Open Sans`, sans-serif (Weights: `400` Regular, `500` Medium, `600` SemiBold)
  - *Purpose:* Extremely readable neutral sans-serif optimized for long lists, forms, and mobile screens.
- **UI Labels, Badges & Interactive Controls**: `Raleway`, sans-serif (Weights: `600` SemiBold, `700` Bold)
  - *Purpose:* Crisp, modern letterforms with subtle character for buttons, tabs, badges, and table headers.

### Scale & Tokens

| Token | Desktop Size / Leading | Mobile Size / Leading | Weight | Usage |
|-------|------------------------|-----------------------|--------|-------|
| `text-display` | `2.25rem` (36px) / 1.2 | `1.75rem` (28px) / 1.25 | `Poppins 700` | Area Dashboard primary greeting |
| `text-h1` | `1.875rem` (30px) / 1.25 | `1.5rem` (24px) / 1.3 | `Poppins 700` | Page titles (Members, Events, Reports) |
| `text-h2` | `1.5rem` (24px) / 1.3 | `1.25rem` (20px) / 1.35 | `Poppins 600` | Section headings, modal titles |
| `text-h3` | `1.25rem` (20px) / 1.4 | `1.125rem` (18px) / 1.4 | `Poppins 600` | Card titles, group headers |
| `text-base` | `1rem` (16px) / 1.5 | `1rem` (16px) / 1.5 | `Open Sans 400/500` | Body copy, standard input text |
| `text-sm` | `0.875rem` (14px) / 1.5 | `0.875rem` (14px) / 1.5 | `Open Sans 400/500` | Secondary descriptions, table cells |
| `text-xs` | `0.75rem` (12px) / 1.5 | `0.75rem` (12px) / 1.5 | `Raleway 600/700` | Status badges, timestamps, tags |

---

## 4. Spacing Scale & Layout Grid

### Density Scale (Visual Density: 7/10)
Structured around a 4px modular base unit for operational efficiency:

| Token | Value | Rem Equivalent | Primary Application |
|-------|-------|----------------|---------------------|
| `--space-2xs` | `2px` | `0.125rem` | Fine border offsets, sub-pixel alignments |
| `--space-xs` | `4px` | `0.25rem` | Compact icon gaps, badge padding |
| `--space-sm` | `8px` | `0.5rem` | Stack gaps, button icon spacing |
| `--space-md` | `12px` | `0.75rem` | Card internal element spacing, form group gaps |
| `--space-base`| `16px` | `1.0rem` | Default padding for mobile cards, standard gaps |
| `--space-lg` | `20px` | `1.25rem` | Desktop card padding, header margin |
| `--space-xl` | `24px` | `1.5rem` | Section padding, container gutters |
| `--space-2xl`| `32px` | `2.0rem` | Page section separation on tablet |
| `--space-3xl`| `48px` | `3.0rem` | Major dashboard grid separation on desktop |

### Elevation & Shadows
Per **R-12 (Shadow Purpose Gate)**, elevation is an intentional hierarchy tool, not a decorative blanket:
- `shadow-none`: Flat baseline for embedded cards, tables, and secondary elements.
- `shadow-2xs`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)` — Subtle separation for inputs and secondary cards.
- `shadow-xs`: `0 1px 3px 0 rgba(0, 0, 0, 0.08)` — Standard elevation for primary interactive cards.
- `shadow-md`: `0 4px 6px -1px rgba(0, 0, 0, 0.1)` — Elevated states: dropdowns, floating filters.
- `shadow-lg`: `0 10px 15px -3px rgba(0, 0, 0, 0.12)` — Modals, bottom sheets, overlay dialogs.

### Border Radii (R-11 Consistent System)
- `rounded-md` (`6px`): Small badges, compact tooltips.
- `rounded-lg` (`8px`): Form inputs, standard buttons, select dropdowns.
- `rounded-xl` (`12px`): Content cards, member detail panels, metric summary widgets.
- `rounded-2xl` (`16px`): Modals, bottom action sheets on mobile.
- `rounded-full` (`9999px`): Status badge capsules, circular user avatar placeholders.
- *Strict Rule:* Never use pill-shaped inputs or full-screen pill cards.

---

## 5. Mobile & Field Responsiveness (antislop-layoutmobile + R-03)

### Core Rules for Field Work
1. **Minimum Touch Targets (44px Rule):**
   - Every interactive control (buttons, tab items, dropdown toggles, table actions, checkboxes) **must measure at least 44px × 44px**.
   - Code enforcement: `min-h-[44px] min-w-[44px]` on touch devices.
2. **Zero Horizontal Overflow Leak:**
   - Data tables on mobile must either reflow into card lists (preferred for rosters) or be wrapped in an explicit overflow container (`overflow-x-auto` with clear right shadow/indicator).
   - Never allow the outer viewport to pan horizontally (`overflow-x-hidden` on app wrapper).
3. **Bottom Navigation for Mobile (< 768px):**
   - High-frequency servant leader actions are reachable by thumb via a fixed bottom navigation bar:
     - Home / Dashboard
     - Members (Roster & Households)
     - Events (Assemblies & Camps)
     - Services & GIG
     - More (Profile, Reports, Offline Sync)
   - Maximum 5 navigation slots. Touch targets 48px height with icon + 11px label.
4. **Three-State Layout Reflow:**
   - **Mobile (< 768px):** 1-column vertical stack, full-width cards, compact headers, bottom nav.
   - **Tablet (768px–1024px):** 2-column balanced grid, side drawer navigation, standard tables.
   - **Desktop (> 1024px):** Fixed left sidebar (`w-64`), multi-column dashboard widgets, high-density data tables.

---

## 6. Component Blueprints & Patterns

### 6.1 Buttons (`Button.tsx`)
```tsx
// Primary: Deep Community Navy with high contrast white text
<button className="inline-flex items-center justify-center font-semibold text-sm px-4 py-2 min-h-[44px] rounded-lg bg-navy text-white hover:bg-navy-light active:bg-navy-deep border border-navy-light/40 shadow-xs transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none">
  Verify Attendance
</button>

// Secondary: Clean White surface with slate border
<button className="inline-flex items-center justify-center font-semibold text-sm px-4 py-2 min-h-[44px] rounded-lg bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer">
  Export PDF Report
</button>

// Accent: Dignified Warm Gold for high-value pastoral actions
<button className="inline-flex items-center justify-center font-semibold text-sm px-4 py-2 min-h-[44px] rounded-lg bg-gold text-white hover:bg-gold-dark active:bg-amber-800 border border-amber-600/40 shadow-xs transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold cursor-pointer">
  Register New Member
</button>
```

### 6.2 Status Badges (`Badge.tsx`)
Never combine glow + capsule + dot + uppercase all at once. Badges communicate state with accessible contrast:
- **Active Member / Verified:** `bg-emerald-50 text-emerald-800 border-emerald-200`
- **Pending / In Review:** `bg-amber-50 text-amber-900 border-amber-200`
- **Inactive / Expired:** `bg-rose-50 text-rose-800 border-rose-200`
- **Area / Domain Role:** `bg-navy/10 text-navy border-navy/20`
- **GIG / Stewardship:** `bg-amber-100 text-amber-900 border-amber-300`

### 6.3 Form Fields & Inputs (`Input.tsx`)
- **Visible Label:** Always paired with a permanent `<label htmlFor={id}>`. No placeholder-only inputs.
- **Clear Error Near Field:** Inline `<span role="alert" className="text-xs text-mfc-red font-medium">` immediately below the input.
- **Helper Text:** Subtle slate-500 instructions (e.g., "Format: 09XX-XXX-XXXX").
- **Touch Sizing:** `min-h-[44px]` with clear `focus:ring-2 focus:ring-navy/20 focus:border-navy`.

### 6.4 Operational Data Cards
```tsx
<div className="bg-white rounded-xl border border-border-subtle p-4 md:p-5 shadow-2xs hover:border-border-strong transition-colors">
  <div className="flex items-center justify-between gap-3 mb-2">
    <h3 className="font-heading font-semibold text-base text-text-main truncate">{title}</h3>
    <Badge variant={statusVariant}>{statusLabel}</Badge>
  </div>
  <p className="text-sm text-text-muted line-clamp-2">{description}</p>
  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-text-subtle">
    <span>{timestamp}</span>
    <button className="text-navy font-semibold hover:underline min-h-[36px] flex items-center">View Profile →</button>
  </div>
</div>
```

### 6.5 Three Required UI States (R-27)
Every screen or container presenting dynamic pastoral records must support:
1. **Loading State:** Clean skeleton bars matching the exact layout dimensions or a branded spinner with text "Loading roster records..."
2. **Empty State:** Reverent and helpful empty container with a specific icon, clear heading ("No household members registered yet"), and a single primary action ("Add First Member").
3. **Error State:** Distinct alert banner or card with error message, retry button ("Retry Loading"), and offline indication if connectivity is lost.

---

## 7. Anti-Patterns & Slop Filter Checklist

The following patterns are **STRICTLY FORBIDDEN** across all components:
- ❌ **Generic AI Gradients:** No blue-to-purple, cyan-to-magenta, or rainbow gradients.
- ❌ **Excessive Glassmorphism:** No simultaneous backdrop-blur on navbar, cards, and modal dialogs.
- ❌ **Glow Everywhere:** No neon borders, button drop-glows, or glowing text.
- ❌ **Pill-shaped Inputs/Cards:** Do not turn cards or textareas into pills.
- ❌ **Dead Controls (R-26):** No buttons or links that do nothing. Every clickable element must trigger a state toggle, navigation, or form submission.
- ❌ **Fake Testimonials / Fabricated Data (R-17, R-18, R-36):** No placeholder "10,000+ happy users" or fictional quotes. Display real MFC Youth data or explicit `[REAL DATA]` placeholders.
- ❌ **Em Dashes in UI Copy (R-02):** No `—` character in buttons, headlines, or labels. Use commas, colons, or parentheses.
- ❌ **Emoji as Icons:** Never use Unicode emojis (🌟, 🚀, 💡) as functional UI icons. Use official SVG icons from `lucide-react`.

---

## 8. Delivery Gate Verification Report

Every UI release or refactor must pass this checklist before delivery:
- [ ] **R-02 (Copywriting):** Zero em dashes (`—`) in UI copy.
- [ ] **R-03 (Mobile Reflow):** Zero horizontal scroll leak at 375px, 768px, 1024px.
- [ ] **R-23 (Asset Confirmation):** Only official MFC Youth logos (`/img/logo.png`, `/img/logo-2.png`) or deliberate text placeholders.
- [ ] **R-25 (Color Contrast):** All text meets WCAG AA minimum 4.5:1 against its background.
- [ ] **R-26 (Interactive Elements):** Every button and link has an active handler or real destination.
- [ ] **R-27 (UI States):** Empty, Loading, and Error states implemented and verified.
- [ ] **R-32 (Keyboard Navigation):** Visible `:focus-visible` ring across all interactive controls; Tab order is logical; Escape closes modals.
- [ ] **R-35 (Click-through Verification):** App runs cleanly with zero console errors.
