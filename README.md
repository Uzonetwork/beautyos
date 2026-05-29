# BeautyOS

**The professional booking and business management platform for beauty businesses in Nigeria.**

BeautyOS gives every beauty professional — nail technicians, lash artists, spa therapists, barbers, and makeup artists — a complete digital toolkit: a public booking page, earnings dashboard, client management, service menu, and gallery, all in one place.

---

## Features

- **Public Booking Page** — A personal booking link clients can use to book appointments any time, from any device
- **Booking Dashboard** — Real-time view of all appointments with confirm, cancel, and delete actions
- **Earnings Tracker** — Daily and monthly earnings calculated automatically from confirmed bookings
- **Client Management** — Full client history including visit count, last service, and contact details
- **Service Menu** — Add, edit, price, and toggle services live
- **Gallery** — Showcase your work with an image gallery
- **Multi-Business-Type Support** — Nail studios, lash studios, spas, barbershops, MUAs, and more
- **Supabase Realtime** — New bookings appear on the dashboard instantly without refresh

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8 |
| Styling | CSS custom properties, DM Sans, Cormorant Garamond |
| Icons | Lucide React |
| Backend | Supabase (PostgreSQL, Auth, Realtime, Row Level Security) |
| Hosting | Deployable to Vercel, Netlify, or any static host |

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/uzonetwork/beautyos.git
cd beautyos
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the Supabase SQL Editor to create all tables and RLS policies
3. Run `supabase/seed_services.sql` to populate the default services reference table

### 4. Configure environment variables

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Both values are available in your Supabase project under **Settings → API**.

### 5. Start the development server

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

---

## Project Structure

```
beautyos/
├── src/
│   ├── lib/
│   │   ├── supabase.js       # Supabase client
│   │   └── auth.js           # Auth helpers (signUp, signIn, signOut, getCurrentBusiness)
│   └── views/
│       ├── LandingPage.jsx   # Marketing landing page
│       ├── SignupView.jsx     # Multi-step onboarding
│       ├── LoginView.jsx      # Owner login
│       ├── PublicView.jsx     # Client-facing booking page
│       ├── OwnerDashboard.jsx # Business management dashboard
│       └── PinEntry.jsx       # Legacy PIN access
├── supabase/
│   ├── schema.sql            # Full database schema + RLS policies
│   └── seed_services.sql     # Default services per business type
└── index.html
```

---

## Database Schema

| Table | Purpose |
|---|---|
| `businesses` | One row per business, linked to Supabase Auth user |
| `services` | Services offered by each business |
| `bookings` | Client appointment requests |
| `clients` | Client history and contact info |
| `gallery` | Image URLs for the public gallery |
| `default_services` | Reference table — default services per business type |

Row Level Security is enabled on all tables. Public visitors can read business/service/gallery data and submit bookings. Owners can only read and modify their own data via `auth.uid() = user_id`.

---

## Routing

| URL | View |
|---|---|
| `/` | Landing page (or owner's public page if logged in) |
| `/?business=<uuid>` | Public booking page for a specific business |
| `/?business=demo` | Demo booking page (CFO Nails & Lash Studio) |
| Sign up / Log in | Multi-step onboarding or login form |
| Post-auth | Owner's own public booking page with dashboard bar |

---

## Deployment

```bash
npm run build
```

The `dist/` folder is a standard static build. Deploy it to Vercel, Netlify, or any CDN-backed static host. Set the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables in your hosting dashboard.

---

## License

Copyright © 2026 Uzonetwork. All rights reserved.
