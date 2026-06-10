# Integration Guide

This document is for engineering teams integrating the Multi-Tenant API into an existing platform.

---

## How It Works

This system provides three-tier multi-tenancy:

- **Organizations** map to your top-level tenants (schools, companies, cohorts)
- **Projects** map to groups/classes/workspaces within an org
- **Project Members** are the explicit access-control join — a user sees nothing unless added

All access control is enforced server-side via middleware. There is no client-side trust.

---

## Step 1 — Run the Service

### Docker (Recommended — zero setup)

```bash
git clone https://github.com/gargieesingh/multi-tenant-system
cd multi-tenant-system
docker-compose up
```

Migrations run automatically. Test data is seeded. API is live at `http://localhost:3000`.

### Local (requires PostgreSQL)

```bash
npm install
cp .env.example .env
# Fill in DATABASE_URL and JWT_SECRET in .env
npx prisma migrate deploy
node seed.js
npm start
```

---

## Step 2 — Authenticate

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "super@admin.com",
  "password": "super123"
}
```

Response:

```json
{
  "data": {
    "token": "<JWT>",
    "user": { "id": "...", "email": "...", "role": "SUPERADMIN" }
  },
  "message": "Login successful."
}
```

Pass the token on every subsequent request:

```
Authorization: Bearer <JWT>
```

---

## Step 3 — Create Your Tenant Structure

```
1. POST /api/organizations              → create your org (SUPERADMIN only)
2. POST /api/auth/register              → register an admin user for that org
   (set organizationId + role: "ADMIN" in the request body)
3. POST /api/projects                   → admin creates projects within their org
4. POST /api/auth/register              → register member users
5. POST /api/projects/:id/members       → add users to specific projects
```

---

## Step 4 — Register Users with Roles

The register endpoint accepts optional `role` and `organizationId` fields:

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "admin@yourcompany.com",
  "password": "securepassword",
  "role": "ADMIN",
  "organizationId": "<org-uuid>"
}
```

> **Note:** In production, you should restrict who can set `role: "ADMIN"` or `role: "SUPERADMIN"` — consider adding a SUPERADMIN-only "promote user" endpoint.

---

## Role Reference

| Role       | What They Can Access                                        |
|------------|-------------------------------------------------------------|
| SUPERADMIN | Everything across all orgs — create orgs, view all data     |
| ADMIN      | All projects + users **within their org only**              |
| MEMBER     | Only projects they are **explicitly added to** via ProjectMember |

---

## Response Format

All responses follow this consistent structure:

**Success:**
```json
{
  "data": { ... },
  "message": "Human readable description"
}
```

**Error:**
```json
{
  "error": "Human readable error message"
}
```

---

## HTTP Status Codes

| Code | Meaning                                        |
|------|------------------------------------------------|
| 200  | Success                                        |
| 201  | Resource created                               |
| 400  | Validation error / missing required field      |
| 401  | Not authenticated (no token or invalid token)  |
| 403  | Authenticated but not authorized (wrong role)  |
| 404  | Resource not found                             |
| 409  | Conflict (e.g. duplicate email or org name)    |
| 500  | Internal server error                          |

---

## Security Architecture

| Property | Implementation |
|---|---|
| JWT payload | Contains only `userId` — role is always re-fetched from DB |
| Password storage | bcrypt with salt rounds: 10 — never returned in responses |
| SQL injection | Impossible — all queries via Prisma parameterized ORM |
| Cross-org access | Blocked at middleware level for ADMIN — not just application logic |
| Project access | MEMBERs must be in `ProjectMember` join table — no implicit access |

---

## Full Endpoint Reference

### Auth

| Method | Path | Auth | Roles | Description |
|--------|------|:---:|-------|-------------|
| `POST` | `/api/auth/register` | ❌ | — | Register a new user |
| `POST` | `/api/auth/login` | ❌ | — | Login and receive JWT |
| `GET` | `/api/auth/me` | ✅ | All | Get current user profile |

### Organizations

| Method | Path | Auth | Roles | Description |
|--------|------|:---:|-------|-------------|
| `POST` | `/api/organizations` | ✅ | SUPERADMIN | Create an organization |
| `GET` | `/api/organizations` | ✅ | SUPERADMIN | Get all organizations |
| `GET` | `/api/organizations/:orgId` | ✅ | SUPERADMIN, ADMIN | Get one org |
| `DELETE` | `/api/organizations/:orgId` | ✅ | SUPERADMIN | Delete an organization |

### Projects

| Method | Path | Auth | Roles | Description |
|--------|------|:---:|-------|-------------|
| `POST` | `/api/projects` | ✅ | SUPERADMIN, ADMIN | Create a project |
| `GET` | `/api/projects` | ✅ | SUPERADMIN | Get ALL projects |
| `GET` | `/api/projects/org/:orgId` | ✅ | SUPERADMIN, ADMIN | Get projects in an org |
| `GET` | `/api/projects/:projectId` | ✅ | All (project access) | Get single project |
| `DELETE` | `/api/projects/:projectId` | ✅ | SUPERADMIN, ADMIN | Delete a project |
| `POST` | `/api/projects/:projectId/members` | ✅ | SUPERADMIN, ADMIN | Add member to project |
| `DELETE` | `/api/projects/:projectId/members/:userId` | ✅ | SUPERADMIN, ADMIN | Remove member |

---

## Test Credentials (seeded)

| Role | Email | Password |
|------|-------|----------|
| SUPERADMIN | `super@admin.com` | `super123` |
| ADMIN (Org Alpha) | `admin@alpha.com` | `admin123` |
| MEMBER (Org Alpha) | `member@alpha.com` | `member123` |
| ADMIN (Org Beta) | `admin@beta.com` | `admin123` |
| MEMBER (Org Beta) | `member@beta.com` | `member123` |
