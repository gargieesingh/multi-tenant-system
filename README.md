# Multi-Tenant REST API

A **production-grade Multi-Tenant REST API** built with **Node.js, Express, PostgreSQL, and Prisma ORM**. Enforces strict data isolation between organizations and projects with three role levels: `SUPERADMIN`, `ADMIN`, and `MEMBER`.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT (`jsonwebtoken`) |
| Password Hashing | `bcryptjs` |
| Dev Server | Nodemon |

---

## 🚀 Setup Instructions

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd multi-tenant-system
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your actual PostgreSQL connection string and JWT secret:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/multitenant_db
JWT_SECRET=your_super_secret_jwt_key_here
PORT=3000
```

### 3. Run Database Migration

```bash
npm run db:migrate
```

This creates all database tables from the Prisma schema.

### 4. Generate Prisma Client

```bash
npm run db:generate
```

> This is usually run automatically after `db:migrate`, but run it explicitly if needed.

### 5. Seed the Database

```bash
npm run seed
```

This populates the database with test users, organizations, and projects.

### 6. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The API runs at: `http://localhost:3000`

---

## 🔐 Role System

| Role | Permissions |
|------|------------|
| `SUPERADMIN` | Full access to everything across all organizations |
| `ADMIN` | Full access within their own organization only |
| `MEMBER` | Restricted to only projects they are explicitly added to |

> **Security Note:** Roles are **never stored in JWT tokens**. Every request re-fetches the user from the database to get the live role.

---

## 📡 API Endpoints

### Auth

| Method | Path | Auth Required | Roles | Description |
|--------|------|:---:|-------|-------------|
| `POST` | `/api/auth/register` | ❌ | - | Register a new user |
| `POST` | `/api/auth/login` | ❌ | - | Login and receive JWT |
| `GET` | `/api/auth/me` | ✅ | All | Get current user profile |

### Organizations

| Method | Path | Auth Required | Roles | Description |
|--------|------|:---:|-------|-------------|
| `POST` | `/api/organizations` | ✅ | SUPERADMIN | Create an organization |
| `GET` | `/api/organizations` | ✅ | SUPERADMIN | Get all organizations |
| `GET` | `/api/organizations/:orgId` | ✅ | SUPERADMIN, ADMIN | Get one org (with org access check) |
| `DELETE` | `/api/organizations/:orgId` | ✅ | SUPERADMIN | Delete an organization |

### Projects

| Method | Path | Auth Required | Roles | Description |
|--------|------|:---:|-------|-------------|
| `POST` | `/api/projects` | ✅ | SUPERADMIN, ADMIN | Create a project |
| `GET` | `/api/projects` | ✅ | SUPERADMIN | Get ALL projects across all orgs |
| `GET` | `/api/projects/org/:orgId` | ✅ | SUPERADMIN, ADMIN | Get all projects in an org |
| `GET` | `/api/projects/:projectId` | ✅ | SUPERADMIN, ADMIN, MEMBER | Get single project (project access check) |
| `DELETE` | `/api/projects/:projectId` | ✅ | SUPERADMIN, ADMIN | Delete a project |
| `POST` | `/api/projects/:projectId/members` | ✅ | SUPERADMIN, ADMIN | Add a member to a project |
| `DELETE` | `/api/projects/:projectId/members/:userId` | ✅ | SUPERADMIN, ADMIN | Remove a member from a project |

---

## 🔑 Authentication

All protected routes require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

---

## 📦 Available Scripts

```bash
npm run dev          # Start dev server with nodemon
npm start            # Start production server
npm run seed         # Seed database with test data
npm run db:migrate   # Run Prisma migrations
npm run db:generate  # Generate Prisma client
npm run db:studio    # Open Prisma Studio (DB GUI)
```

---

## 🌱 Test Credentials (from seed)

### Superadmin
| Field | Value |
|-------|-------|
| Email | `super@admin.com` |
| Password | `super123` |

### Org Alpha — Admin
| Field | Value |
|-------|-------|
| Email | `admin@alpha.com` |
| Password | `admin123` |

### Org Alpha — Member (added to Project Alpha)
| Field | Value |
|-------|-------|
| Email | `member@alpha.com` |
| Password | `member123` |

### Org Beta — Admin
| Field | Value |
|-------|-------|
| Email | `admin@beta.com` |
| Password | `admin123` |

### Org Beta — Member (added to Project Beta only)
| Field | Value |
|-------|-------|
| Email | `member@beta.com` |
| Password | `member123` |

---

## 📋 API Response Format

**Success:**
```json
{
  "data": { ... },
  "message": "Human readable success message"
}
```

**Error:**
```json
{
  "error": "Human readable error message"
}
```

---

## 🗄️ Database Schema

```
User ────────────────── Organization
  |                          |
  └── ProjectMember ── Project
```

- A **User** belongs to at most one **Organization**
- An **Organization** has many **Projects**
- **ProjectMember** is the join table linking Users to Projects (MEMBER access control)
- All cascade deletes are handled at the database level

---

## 🔒 Security Features

1. **Role never stored in JWT** — always re-fetched from DB
2. **Password hashing** with bcrypt (salt rounds: 10)
3. **Passwords never returned** in any API response (Prisma `select` exclusion)
4. **Organization scoping** — ADMINs cannot access or modify other orgs
5. **Project scoping** — MEMBERs can only see projects they are explicitly added to
6. **Parameterized queries** only via Prisma — no raw SQL string concatenation
