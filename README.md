# UrbanBuddy - Smart Civic Issue Reporting Platform

UrbanBuddy is a full-stack civic issue reporting app with user rewards, moderation workflows, and admin operations.

## Stack

- Frontend: React + Vite + Tailwind CSS + Axios + React Router
- Backend: Node.js + Express + JWT + Multer + Cloudinary (optional)
- Database: Supabase (PostgreSQL)

## Project Structure

```text
Urban Buddy/
  backend/
    src/
      config/
      controllers/
      middleware/
      routes/
      services/
      utils/
      app.js
      server.js
    supabase/
      schema.sql
    uploads/
    .env.example
    package.json
  frontend/
    src/
      api/
      components/
      contexts/
      hooks/
      pages/
      types/
      utils/
      App.tsx
      main.tsx
    .env.example
    package.json
```

## 1. Supabase Setup

1. Create a Supabase project.
2. Open SQL Editor in Supabase.
3. Run SQL from `backend/supabase/schema.sql`.
4. Copy `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

## 2. Environment Variables

Create `backend/.env` from `backend/.env.example`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

JWT_SECRET=super-secret-jwt-key
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Create `frontend/.env` from `frontend/.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_API_ASSET_URL=http://localhost:5000
```

## 3. Install Dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

## 4. Start the App

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

## 5. Create an Admin User

1. Register a user via `/register`.
2. In Supabase SQL editor:

```sql
update public.users
set role = 'admin'
where email = 'admin@urbanbuddy.com';
```

## API Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

### User

- `GET /api/users/profile`
- `GET /api/users/leaderboard`

### Complaints

- `POST /api/complaints`
- `GET /api/complaints`
- `GET /api/complaints/my`

### Admin

- `GET /api/admin/complaints`
- `PUT /api/admin/complaints/:id/approve`
- `PUT /api/admin/complaints/:id/reject`
- `PUT /api/admin/complaints/:id/status`

## Sample Requests

### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Citizen",
  "email": "john@example.com",
  "password": "secure123"
}
```

Example response:

```json
{
  "success": true,
  "message": "Account created successfully",
  "token": "<jwt>",
  "user": {
    "id": "uuid",
    "name": "John Citizen",
    "email": "john@example.com",
    "role": "user",
    "points": 0,
    "createdAt": "2026-03-22T10:00:00.000Z"
  }
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secure123"
}
```

### Create Complaint (with image)

```http
POST /api/complaints
Authorization: Bearer <jwt>
Content-Type: multipart/form-data

- title: Broken Streetlight near metro station
- description: Streetlight has been non-functional for 4 days and area is unsafe at night.
- category: Streetlight
- latitude: 28.6139
- longitude: 77.2090
- address: Connaught Place, New Delhi
- image: [binary file]
```

### Approve Complaint (Admin)

```http
PUT /api/admin/complaints/<id>/approve
Authorization: Bearer <admin_jwt>
```

## Key Features Implemented

- JWT auth with role-based route protection
- Password hashing with bcryptjs
- Supabase-backed persistent data model
- Multer image upload + optional Cloudinary
- Reward points on complaint approval
- Leaderboard endpoint and frontend UI
- Duplicate complaint prevention for active issues
- Pagination and filtering in public complaints
- Admin panel for approve/reject/status updates
- Responsive modern UI with user and admin experiences
