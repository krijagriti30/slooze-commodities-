
# Slooze Commodities Management

A full-stack application for managing commodity products and inventory with role-based access for Managers and Store Keepers.

## Live Links

- **Frontend:** https://slooze-commodities-frontend-ivory.vercel.app/login
- **Backend API:** https://slooze-commodities-api-n4j4.onrender.com/graphql
- **GitHub:** https://github.com/krijagriti30/slooze-commodities-

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, Apollo Client
- **Backend:** NestJS 10, GraphQL, Apollo Server 4
- **Database:** SQLite, Prisma ORM
- **Authentication:** Secure HTTP-only cookies and database sessions

## Features

- Secure user login and session management
- Role-based access control
- Manager-only dashboard
- View, add, and edit products
- Product search and filtering
- Light and dark mode
- Responsive user interface

## User Roles

| Feature | Manager | Store Keeper |
|---|---|---|
| Dashboard | Yes | No |
| View Products | Yes | Yes |
| Add Products | Yes | Yes |
| Edit Products | Yes | Yes |

## Project Structure

```text
slooze-commodities/
├── backend/
│   ├── prisma/
│   ├── scripts/
│   └── src/
├── frontend/
│   └── src/
└── README.md
```

## Getting Started

### Prerequisites

- Node.js
- npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/krijagriti30/slooze-commodities-.git
cd slooze-commodities-
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file using `.env.example` and configure your database URL.

```bash
npm run prisma:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Backend runs at `http://localhost:4000/graphql`.

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
```

Configure the environment variables using `.env.example`.

```bash
npm run dev
```

Frontend runs at `http://localhost:3000`.

## Demo Credentials

For local development:

| Role | Email | Password |
|---|---|---|
| Manager | manager@slooze.xyz | Manager@123 |
| Store Keeper | storekeeper@slooze.xyz | Store@12345 |

## Security

- Passwords are stored as hashes.
- Sessions are stored in the database.
- Authentication uses HTTP-only cookies.
- Role permissions are checked on the backend.
- Unauthorized users cannot access Manager-only features.

## Developer

**Jagriti Kumari**

[GitHub Profile](https://github.com/krijagriti30)
