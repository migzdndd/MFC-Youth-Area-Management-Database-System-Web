# MFC Youth Area Management System - React Frontend

The official modern responsive web client for the **MFC Youth Area Management System (AMS)**, built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS**.

---

## Design Philosophy: Responsive Web Ergonomics

The frontend is engineered as a pure, responsive web application for field ergonomics, desktop administration, and accessibility:

1. **Touch & Keyboard Ergonomics**:
   - All interactive elements (buttons, inputs, filters, list items) strictly observe a minimum 44px tap target.
   - Complete keyboard accessibility (`Tab`, `Shift+Tab`, `Enter`, `Escape`) with visible focus indicators.
2. **Tactile Card Surfaces**:
   - Clean, elevated card containers with crisp borders (`border-slate-200/80`) and subtle elevation.
   - Eliminates generic AI gradients, neon glows, and excessive glassmorphism in favor of calm, pastoral utility.
3. **Adaptive Navigation**:
   - **Mobile**: Clean header with accessible hamburger drawer button controlling the sliding sidebar.
   - **Desktop**: Persistent collapsible sidebar with role-aware links and active pastoral area indicator.
4. **Official Community Palette**:
   - Deep Community Navy: `#002847` (Brand dominant, navigation, headers)
   - Crisp Off-White: `#F8FAFC` (Screen background surface)
   - Pure White: `#FFFFFF` (Card surfaces)
   - Charcoal Slate: `#0F172A` / `#64748B` (Legible typography and metadata)

---

## Application Structure

```text
frontend-react/
├── public/                 # Favicon, branding logos, icons
├── src/
│   ├── components/         # Reusable UI primitives
│   │   ├── layout/         # AppLayout, Header, Sidebar, Banners, Modals
│   │   ├── ui/             # Button, Input, Select, Modal, SearchBar, ThemeToggle
│   │   └── events/         # Event cards, attendance rosters, summary modals
│   ├── pages/              # Domain views
│   │   ├── DashboardPage.tsx  # Dynamic metrics, quick links, Scripture card
│   │   ├── MembersPage.tsx    # Youth directory with academic tracks and Heartchamps
│   │   ├── ChaptersPage.tsx   # Chapter administration and household clusters
│   │   ├── ServicesPage.tsx   # The 5 Creative Ministries (Music, Dance, etc.)
│   │   ├── EventsPage.tsx     # Youth assemblies, camps, and check-in rosters
│   │   ├── ReportsPage.tsx    # Monthly pastoral reports and printable export
│   │   ├── GigPage.tsx        # God is Generous stewardship ledger
│   │   ├── LoginPage.tsx      # Secure leader authentication
│   │   ├── RegisterPage.tsx   # Servant leader registration
│   │   ├── ForgotPasswordPage.tsx # Password recovery request
│   │   └── ChangePasswordPage.tsx # Account password management
│   ├── services/           # REST API client services
│   ├── stores/             # Zustand global state (auth, session, active area)
│   ├── types/              # TypeScript interface definitions
│   ├── App.tsx             # Declarative React Router setup
│   └── main.tsx            # Application entry point
├── vite.config.ts          # Vite configuration with /api reverse proxy
└── package.json
```

---

## Feature Modules

### 1. Dashboard
- Real-time roster counters dynamically scoped by active user role.
- Pastoral mission cards and quick actions for event registration and report filing.
- Daily Catholic Scripture reflection feed.

### 2. Youth Directory (`/members`)
- Directory supporting ages 13 to 21 plus Heartchamps.
- Filter by Academic Track: College, Senior High School, High School (Grades 7 to 10), and Heartchamp.
- Search by name, school, campus, or contact number.
- Create and edit youth records with full data validation.

### 3. Ministry Services (`/services`)
- Centers strictly on the 5 Creative Ministries under the LIT Servant:
  - **Music**: Vocalists and band instrumentalists.
  - **Dance**: Creative movement and praise choreography.
  - **Graphics & Promo**: Visual communications and event promotion.
  - **Creative Writing**: Pastoral documentation, scripts, and reflections.
  - **Photography & Videography**: Media archiving and event documentation.
- Unmentioned legacy services have been purged from the active catalog.

### 4. Chapters & Households (`/chapters`)
- Geographical chapter listings and household clusters.
- Member rosters per chapter.
- Chapter servant assignment.

### 5. Events & Attendance (`/events`)
- Youth camps, leadership conferences, and area assemblies.
- Participant check-in, attendance marking, and fee tracking.

### 6. Pastoral Reports (`/reports`) & GIG (`/gig`)
- Activity reporting with participant headcounts and notes.
- God is Generous (GIG) stewardship and tithe ledger.

---

## Local Development & Build

### Development Server
```bash
# Run standalone (proxies /api to localhost:3000):
npm run dev

# Or run concurrently with backend from project root:
npm run dev:modern
```

### Type Checking & Production Build
```bash
npm run build
```
The compiled output is emitted to `frontend-react/dist`.
