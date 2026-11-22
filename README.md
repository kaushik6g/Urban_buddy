# UrbanBuddy

UrbanBuddy helps people in a campus, residential community, or workplace report local problems and follow them through resolution. A resident can report a leaking pipe with a photo and location. Their community admin can review the evidence, record what is being done, and tell the reporter when the repair is complete.

[Open UrbanBuddy](https://urban-buddy-delta.vercel.app/) · [API health check](https://urban-buddy-api.vercel.app/api/health)

## How a report moves through the app

1. **Join a community.** An admin registers a community and chooses a permanent invite code or lets UrbanBuddy generate one. Citizens enter the code at registration. Returning users sign in with email and password.
2. **Report an issue.** The citizen adds a title, description, category, and coordinates from GPS or manual entry. They can include an address and JPEG or PNG photos. New reports enter the review queue as **Pending**.
3. **Review and track the work.** The community admin approves or rejects the report. After approval, the admin can mark it **In Progress** or **Resolved** and leave a comment. Rejections include a reason.
4. **Follow the outcome.** The citizen dashboard shows status counts, recent reports, and a dated feed of decisions and point changes. Profile holds the full issue details, rejected reports, and deletion history.

Approval awards **15 points**. Resolving an approved report adds **35**, bringing its total to **50**. Rejecting or deleting a report removes the points it earned. The community leaderboard ranks citizen accounts by points.

## Architecture

| Part | Implementation | Responsibility |
| --- | --- | --- |
| Citizen and admin portals | React, TypeScript, Vite, Tailwind CSS | Reporting, review, filters, profile, and dashboards |
| Application API | Node.js, Express, JWT, bcrypt, Multer | Authentication, community-scoped admin review, and uploads |
| Database | PostgreSQL on Supabase | Communities, accounts, complaints, review history, and rewards |
| Photos | Supabase Storage on Vercel by default | Private complaint photos served through signed links |

The frontend and API deploy as separate Vercel projects. In production, the browser sends application requests through the frontend’s `/backend-api` rewrite. A separate server-side function serves the community leaderboard. Local development uses the Express API directly.

## Run locally

Use Node.js 22.12+ and npm. Clone the repository and open two terminals at its root.

### 1. Prepare a development database

Create a Supabase project and run the following files in its SQL Editor, in the order shown. This sequence is for a **fresh database**. Some migrations backfill existing rows and replace earlier functions.

| Order | SQL file | Purpose |
| --- | --- | --- |
| 1 | [schema.sql](backend/supabase/schema.sql) | Base tables and relationships |
| 2 | [switch community](backend/supabase/20261121_switch_community.sql) | Confirmed community transfers |
| 3 | [archive complaints](backend/supabase/20261122_archive_complaints.sql) | Per-user deletion history |
| 4 | [deduct deleted points](backend/supabase/20261122_deduct_deleted_points.sql) | Reverse rewards on deletion |
| 5 | [reward events](backend/supabase/20261122_reward_events.sql) | Track earned points and complaint updates |
| 6 | [revoke rejected points](backend/supabase/20261122_revoke_rejected_points.sql) | Reverse rewards on rejection |
| 7 | [complaint identity views](backend/supabase/20261122_complaint_identity_views.sql) | Restricted reporter and deletion lookups |
| 8 | [scope complaint reviews](backend/supabase/20261122_scope_complaint_reviews.sql) | Check community membership during review writes |

### 2. Start the API

Create `backend/.env` using the following values. Generate a private signing secret for `JWT_SECRET`. Keep it and the Supabase server key out of Git and browser-exposed variables.

```dotenv
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVER_KEY
JWT_SECRET=YOUR_RANDOM_SIGNING_SECRET
CLIENT_URL=http://localhost:5173
PORT=5000
```

```sh
cd backend
npm ci
npm run dev
```

Check that the API starts successfully at [localhost:5000/api/health](http://localhost:5000/api/health).

### 3. Start the frontend

Use the second terminal to start Vite.

```sh
cd frontend
npm ci
npm run dev
```

Open the local URL printed by Vite, normally [localhost:5173](http://localhost:5173). The default API address is `http://localhost:5000/api`. To use another local port, set `VITE_API_URL` and `VITE_API_ASSET_URL` in `frontend/.env`.

### 4. Try both roles

Register an **Admin** and copy the community invite code. In a second browser profile, register a **User** with that code and submit a report. In the admin session, open **Complaint Review**, approve the report, then mark it **Resolved** with a comment. The citizen dashboard should show the comment and a total of 50 points for that report. Deleting it from Profile should move it to **Deleted complaints** and reverse those points.

## Deployment

- **API project** — Set the Vercel root directory to `backend`. Configure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, and the deployed frontend origin in `CLIENT_URL`.
- **Frontend project** — Set the root directory to `frontend`, use the Vite preset, build with `npm run build`, and publish `dist`. Set `URBANBUDDY_SUPABASE_SECRET` as a server-side environment variable for the leaderboard function.
- **Deploying a fork** — Update the API destination in [vercel.json](frontend/vercel.json) and the API and Supabase URLs in [leaderboard.js](frontend/api/leaderboard.js) to point to your deployments.
- **Photo storage** — Local uploads use the backend’s uploads directory. On Vercel, the API creates the private `urbanbuddy-complaint-photos` bucket on first upload if needed. Optional Cloudinary configuration takes precedence. [Storage implementation](backend/src/services/storageService.js)

## Working in the repository

| Directory | Contents |
| --- | --- |
| [frontend/src](frontend/src) | Pages, shared components, authentication state, and API client |
| [frontend/api](frontend/api) | Server-side Vercel functions for the frontend project |
| [backend/src](backend/src) | Express routes, controllers, middleware, and services |
| [backend/supabase](backend/supabase) | Base schema and ordered SQL migrations |

Run `npm run build` from `frontend` to type-check and build the production bundle. Run `npm run lint` there for ESLint checks. For the API contract, start with the [Express routes](backend/src/routes).
