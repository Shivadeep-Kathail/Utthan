<div align="center">

# Utthan · उत्थान

**Crowdfunding and cause participation for India. Donate money, pledge goods, or show up.**

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_9-47A248?logo=mongodb&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Razorpay](https://img.shields.io/badge/Payments-Razorpay-0C2451)
![License](https://img.shields.io/badge/license-MIT-blue)
![Status](https://img.shields.io/badge/status-in_active_development-orange)

</div>

---

## About

*Utthan* (उत्थान) is Hindi for "upliftment". It is a full-stack MERN platform where people can start and support causes in three different ways, all under one roof:

| Campaign type | What supporters do | How progress is tracked |
| --- | --- | --- |
| **Fundraising** | Donate money through Razorpay | Amount raised vs. goal |
| **Participation** | Join an event such as "Run for a Cause" | Participant headcount vs. target |
| **Goods donation** | Pledge in-kind items (food, clothes, books, etc.) | Items received vs. items needed |

Every architectural decision in this project is deliberate and documented below, from the payment flow to the auth model. See [Key design decisions](#key-design-decisions).

> **Status:** actively under development. The backend API is feature-complete for the core flows, and the frontend now covers the full user journey: auth, discovery, creating and editing campaigns, donation checkout, joining, goods pledging and a personal dashboard. The admin and moderator panel, real-time features and AI features are next. See [Project status](#project-status).

**Live demo:** coming soon.

## Features

**Working today**

- **Accounts:** signup, login, logout, forgot and reset password (emailed, 10-minute single-use token), profile update, password change and account deletion
- **Roles:** `user`, `moderator` and `admin`, enforced with composable middleware
- **Campaigns:** three types on one model, ten categories, cover image plus gallery, GeoJSON location with address, SEO-friendly slug URLs, soft delete with owner and admin permissions
- **Moderation:** new campaigns start as `pending` and go through an admin/moderator approval workflow (approve, reject, flag, close, restore)
- **Discovery:** filter by type and category, sort, paginate, and limit fields; filters are synced to the URL on the frontend
- **Payments:** Razorpay orders, HMAC signature verification and a signed webhook, with idempotent confirmation
- **Goods donations:** pledge, edit, cancel and mark collected; pledges are validated against the quantity still needed, and marking a pledge collected updates the campaign's received counts inside a MongoDB transaction
- **Participation:** join and leave with one entry per user, a participant cap, and a creator view of participants
- **Image uploads:** JPEG, PNG, WebP or GIF up to 5 MB
- **Create and edit campaigns:** one type-specific form (react-hook-form + zod) used in both create and edit modes, with image upload and a Leaflet map picker with address search
- **Donation checkout:** Razorpay Checkout opens from the campaign page with preset or custom amounts, verifies the payment on success, and refreshes the campaign's progress
- **Join and pledge from the campaign page:** one-click join and leave for participation campaigns, and a multi-item goods pledge form with collection address and preferred date, with your own pledges listed and cancellable on the same page
- **Dashboard:** *My Campaigns* (status badges, edit, delete, and a manage dialog), *My Donations* (payments and goods pledges, total donated, cancel a pledge) and *Participation* (campaigns you joined, with leave)
- **Creator tools:** the manage dialog shows a campaign's donations, participants or goods pledges depending on its type, and lets the creator mark pledges as collected
- **Profile and settings:** a dedicated page for profile updates, password change and account deletion
- **Role-aware navigation:** the navbar shows an Admin link to admins and moderators
- **Security layers:** Helmet, credentialed CORS, rate limiting, NoSQL-injection sanitization, XSS sanitization, HTTP parameter pollution protection, request size limits and centralized error handling
- **UI:** responsive, light and dark themes, accessible component primitives

**In progress and planned**

- Admin and moderator panel in the UI (the moderation and user-management endpoints already exist)
- Real-time notifications (the dashboard tab is a placeholder)
- Live platform stats on the landing page (currently placeholder values)
- Nearby-campaign discovery using MongoDB geospatial queries
- Live campaign progress over WebSockets
- AI-assisted verification of campaign documents with Gemini Vision
- Campaign auto-tagging and a personalized feed

## Tech stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React 19, Vite, JavaScript, Tailwind CSS v4, shadcn/ui (Base UI primitives, Nova preset, Geist font), React Router, Axios, react-hook-form + zod, Leaflet / react-leaflet, date-fns, Sonner, Oxlint |
| **Backend** | Node.js, Express 5, MongoDB with Mongoose 9, JWT in httpOnly cookies, bcryptjs, multer, Nodemailer (Mailtrap in development), ESLint, Prettier |
| **Payments** | Razorpay (orders, HMAC verification, webhooks) |
| **Planned** | Google Gemini Vision, Socket.io (dependency installed), MongoDB `2dsphere` queries with Haversine distance |

## Campaign lifecycle

```mermaid
stateDiagram-v2
    [*] --> pending: Creator submits
    pending --> active: Admin or moderator approves
    pending --> rejected: Admin or moderator rejects
    active --> flagged: Flagged for review
    active --> closed: Goal reached or closed by admin
```

Only `active` campaigns accept donations, pledges and participants. The public listing shows `active` and `closed` campaigns. A soft-deleted campaign that an admin restores returns to `pending`.

## How a donation works

The client-side verify call gives the donor instant feedback, and Razorpay's server-to-server webhook is the safety net if the browser never reports back. Both paths verify an HMAC signature and only act on a donation that is still in the `created` state, so whichever arrives first confirms the payment and the other is ignored. On the frontend, Checkout is opened with the public key from `VITE_RAZORPAY_KEY_ID`, and the campaign is refetched after a successful verification so the progress bar updates immediately.

```mermaid
sequenceDiagram
    participant D as Donor (React)
    participant API as Express API
    participant RP as Razorpay

    D->>API: POST /api/payments/create-order
    API->>API: Fundraising campaign, active, not the donor's own
    API->>RP: Create order
    API-->>D: order + donationId (Donation status: created)
    D->>RP: Pay via Razorpay Checkout
    RP-->>D: order_id, payment_id, signature
    D->>API: POST /api/payments/verify-payment
    RP->>API: POST /api/webhooks/razorpay (payment.captured / payment.failed)
    Note over API: Each path verifies its HMAC signature, then captures only if status is still "created" and increments amountRaised once
    Note over API: Campaign closes automatically when amountRaised reaches amountNeeded
```

## Key design decisions

- **One User model for everyone.** Donors and campaign creators are the same account. Relationships live on `Campaign.creator` and `Donation.donor`, so someone is a "fundraiser" or a "donor" purely by activity, not by a stored label.
- **One Campaign model, three types.** A `type` field (`fundraising`, `participation`, `goods-donation`) switches which fields are required (`amountNeeded`, `participantGoal` or `items`), and virtual fields expose progress for each type.
- **Idempotent, signature-verified payments.** Razorpay signatures are checked with HMAC on both confirmation paths, the webhook verifies the raw request body, and status guards prevent double-counting.
- **Cookie-based auth.** The JWT is issued as an httpOnly cookie (`Secure` in production). The React client never reads, stores or forwards the token, which removes the usual XSS token-theft path. Signup ignores any client-supplied role, and changing a password invalidates older tokens.
- **Composable RBAC.** `protect` and `requireRole(...)` middleware compose per route, so permissions are declared where the route is defined instead of being scattered through controllers.
- **Transactional goods collection.** When a creator marks a pledge as collected, the status change and the campaign's per-item `received` increments run in one MongoDB transaction using atomic `$inc`, so concurrent collections cannot overwrite each other.
- **Guard rails on self-dealing.** Creators cannot donate to or join their own campaigns, and participation is capped by `participantGoal` when one is set.
- **Razorpay as the sole gateway.** Chosen for INR-first support and UPI.
- **Slugs for public URLs, ObjectIds internally.** A slug is generated once at creation and never changes, so shared links survive title edits. Duplicate titles get a numeric suffix.
- **Soft deletes.** Campaigns and users are flagged rather than removed, and admins can restore or permanently delete.
- **Geo-ready schema.** Campaign locations are GeoJSON points with a `2dsphere` index, ready for nearby search.
- **Planned AI trust scorer.** Category-specific document verification with Gemini Vision: extract structured fields from an uploaded document, cross-validate them against the campaign's claims, and produce an authenticity confidence score.

## Project structure

```
Utthan/
├── backend/
│   ├── app.js                 # middleware stack and route mounting
│   ├── server.js              # DB connection and server start
│   ├── config/                # Razorpay client, .env.example
│   ├── controllers/           # auth, user, campaign, donation, goods donation,
│   │                          # participation, payment + webhook, upload, admin, errors
│   ├── middleware/            # auth (protect, requireRole), upload (multer)
│   ├── models/                # User, Campaign, Donation, GoodsDonation, Participation
│   ├── routes/
│   ├── scripts/               # dev utilities (approve campaigns, backfill slugs, test signatures)
│   ├── uploads/               # locally stored images (git-ignored)
│   └── utils/                 # ApiFeatures, AppError, email, helpers
├── frontend/
│   ├── index.html             # loads the Razorpay Checkout SDK
│   └── src/
│       ├── api/               # Axios client and modules: auth, campaigns, donations,
│       │                      # goods donations, payments
│       ├── components/
│       │   ├── auth/          # route guards, auth layout
│       │   ├── campaigns/     # card, form, image upload, location picker
│       │   ├── dashboard/     # my campaigns, my donations, participation,
│       │   │                  # manage dialog, account settings forms
│       │   ├── home/          # hero, stats, campaign types, featured campaigns
│       │   ├── layout/        # navbar, footer, global layout
│       │   ├── feedback/      # spinners, skeletons, error states
│       │   └── ui/            # shadcn/ui primitives
│       ├── context/           # AuthContext
│       ├── pages/             # home, campaigns, campaign detail, create, edit,
│       │                      # dashboard, profile, admin (placeholder), auth pages
│       ├── utils/             # API error normalization
│       └── router.jsx
├── LICENSE
└── README.md
```

## API overview

All routes are prefixed with `/api`. Everything except the public routes needs a valid auth cookie.

| Area | Base path | Endpoints |
| --- | --- | --- |
| Users | `/users` | `POST /signup` `/login` `/logout` `/forgotPassword` · `PATCH /resetPassword/:token` · `GET /me` · `PATCH /updateMe` `/updatePassword` · `DELETE /deleteMe` |
| Campaigns | `/campaign` | `GET /` (public) · `POST /` · `GET /my-campaigns` · `GET /my-participations` · `GET /:slug` (public) · `PATCH /:slug` · `DELETE /:slug` |
| Campaign sub-resources | `/campaign/:slug` | `POST /join` · `DELETE /leave` · `GET /participation` (am I joined?) · `GET /participants` (creator or admin) · `GET /donations` (creator or admin) |
| Donations | `/donations` | `GET /me` · `GET /:id` · `GET /admin` (admin, moderator) |
| Payments | `/payments` | `POST /create-order` · `POST /verify-payment` |
| Webhook | `/webhooks/razorpay` | `POST` (signature-verified, raw body) |
| Goods donations | `/goods-donations` | `POST /campaigns/:slug` · `GET /my` · `GET /campaigns/:slug` · `GET /:id` · `PATCH /:id` · `PATCH /:id/cancel` · `PATCH /:id/collect` |
| Uploads | `/upload` | `POST /` (multipart field `image`) |
| Admin: campaigns | `/admin/campaigns` | `GET /` `/active` `/pending` `/flagged` `/deleted` `/:id` · `PATCH /:id/approve` `/reject` `/flag` `/close` `/restore` · `DELETE /:id` |
| Admin: users | `/admin/users` | `GET /` `/deleted` `/:id` · `PATCH /:id/role` `/recover` · `DELETE /:id` |

The listing endpoints accept `type`, `category`, `sort` (comma-separated, `-` for descending), `fields`, `page`, `limit` (max 100) and comparison operators such as `amountNeeded[gte]=5000`.

## Getting started

### Prerequisites

- Node.js 20.19 or newer (22.12+ also works), as required by Vite 8 and Mongoose 9
- A MongoDB database. Atlas works out of the box; a local MongoDB must run as a **replica set**, because marking goods pledges as collected uses transactions
- Razorpay **test-mode** API keys (the key ID is needed by both backend and frontend)
- A Mailtrap sandbox inbox for password-reset emails

### 1. Clone

```bash
git clone https://github.com/Shivadeep-Kathail/Utthan.git
cd Utthan
```

### 2. Backend

```bash
cd backend
npm install
cp config/.env.example config.env    # the server reads backend/config.env (git-ignored)
npm start                            # nodemon server.js
```

Fill in `config.env`:

```env
NODE_ENV=development
PORT=8080

# MongoDB: <PASSWORD> in the URL is replaced with DATABASE_PWD at startup
DATABASE=mongodb+srv://<user>:<PASSWORD>@<cluster>.mongodb.net/utthan
DATABASE_PWD=<your-db-password>

# JWT auth (JWT_COOKIE_EXPIRY is in days)
JWT_SECRET_KEY=<long-random-string>
JWT_EXPIRY=90d
JWT_COOKIE_EXPIRY=90

# Mailtrap sandbox
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USERNAME=
EMAIL_PASSWORD=

# Razorpay (test mode)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev                          # http://localhost:8081
```

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_RAZORPAY_KEY_ID=<your-razorpay-test-key-id>   # same key ID as the backend; public, never the secret
```

> The frontend runs on port **8081** and the backend's CORS is configured for `http://localhost:8081` with credentials, so keep those two in sync if you change either.

### 4. Try it out

1. Sign up through the UI, then create a campaign at `/create-campaign`. It starts as `pending`, and you can see it, edit it or delete it from the *My Campaigns* tab on your dashboard.
2. Approve it so it appears in the public listing. There is no admin UI yet, so either use the helper script or call the admin API:
```bash
   node scripts/approveCampaign.js <campaign-slug>    # or: --all
```
3. Promote an account to admin by editing its `role` field in MongoDB (signup deliberately ignores any role in the request). After that, `PATCH /api/admin/campaigns/:id/approve` works.
4. Sign in with a **second account** to try the supporter side: creators cannot donate to or join their own campaigns. Donate through Razorpay test mode, join a participation campaign, or pledge goods, then watch the activity appear on the dashboards of both accounts.

### Testing payments locally

- **Signed requests without the Razorpay dashboard:** `scripts/generateSignature.js` and `scripts/generateWebhookSignature.js` produce valid HMAC signatures for `verify-payment` and the webhook. Edit the order and payment IDs inside the scripts first.
- **Real webhooks:** expose the backend with a tunnel (for example `ngrok http 8080`), add `https://<tunnel>/api/webhooks/razorpay` in the Razorpay dashboard, subscribe to `payment.captured` and `payment.failed`, and copy the webhook secret into `RAZORPAY_WEBHOOK_SECRET`.
- **Slug behavior checks:** `node scripts/testVerification.js` runs the slug-generation and slug-stability checks against your database.

## Project status

### Backend

- [x] Auth and account management (JWT cookies, password reset by email)
- [x] RBAC middleware (user, moderator, admin)
- [x] Campaign CRUD with slugs, ownership checks and soft delete
- [x] Admin moderation endpoints and admin user management
- [x] Filtering, sorting, pagination and field limiting
- [x] Razorpay orders, payment verification and webhook
- [x] Goods donation flow
- [x] Participation flow
- [x] Image upload endpoint
- [x] Security middleware and centralized error handling
- [ ] Nearby / within-radius discovery endpoint (schema and `2dsphere` index are ready)
- [ ] Live progress with Socket.io
- [ ] Gemini Vision trust scorer
- [ ] Auto-tagger and personalized feed
- [ ] Stats and analytics endpoints
- [ ] API documentation

### Frontend

- [x] Vite + React scaffold, Tailwind v4, shadcn/ui, light and dark themes
- [x] Axios client with normalized error handling
- [x] Router with guest-only and protected route guards
- [x] Landing page
- [x] Login, signup, forgot and reset password
- [x] Profile and account settings
- [x] Campaign discovery with URL-synced filters, sorting and pagination
- [x] Type-specific campaign detail pages
- [x] Create-campaign flow with image upload and map location picker
- [x] Edit-campaign flow (shared form in edit mode)
- [x] Donation checkout with Razorpay Checkout
- [x] Join, leave and goods-pledge actions
- [x] Dashboard: my campaigns (with manage dialog), my donations and pledges, participation
- [x] Profile and account settings page
- [ ] Dashboard notifications (tab is a placeholder)
- [ ] Admin and moderator panel (route exists, page is a placeholder)
- [ ] Role-based route guard for `/admin`
- [ ] Nearby-campaign map discovery
- [ ] Live stats on the landing page (currently placeholder values)

### Deployment

- [ ] Host the frontend and backend
- [ ] Make the CORS origin configurable through the environment
- [ ] Move image storage off local disk to persistent cloud storage

## Roadmap

1. Finish the remaining core journeys: the admin and moderator panel, role-based route guarding, notifications and real landing-page stats.
2. Add nearby discovery and real-time progress.
3. Add the AI features in this order: auto-tagger, trust scorer, personalized feed.
4. Deploy, and publish API documentation.

## Contributing

This is a personal project, but feedback, bug reports and suggestions are welcome. Feel free to open an issue.

## License

Distributed under the MIT License. See [`LICENSE`](./LICENSE) for details.

## Author

Built by **Shivadeep Kathail**, B.Tech ECE student at IIIT Nagpur.

[GitHub](https://github.com/Shivadeep-Kathail) · [LinkedIn](https://www.linkedin.com/in/shivadeep-kathail-234989332)
