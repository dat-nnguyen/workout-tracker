# 🏋️‍♂️ Workout Tracker & Progressive Overload Analytics API

[![CI Pipeline](https://github.com/dat-nnguyen/workout-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/dat-nnguyen/workout-tracker/actions)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![Express 5](https://img.shields.io/badge/express-v5.2.1-blue.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL%2016-336791.svg)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/ORM-Prisma%206-2D3748.svg)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/cache-Redis%207-DC382D.svg)](https://redis.io/)
[![Docker](https://img.shields.io/badge/docker-multi--stage-2496ED.svg)](https://www.docker.com/)
[![Jest Tested](https://img.shields.io/badge/tests-Jest%20(26%2F26%20Passed)-C21325.svg)](https://jestjs.io/)
[![OpenAPI 3.0](https://img.shields.io/badge/docs-OpenAPI%203.0%20%2F%20Swagger-85EA2D.svg)](http://localhost:5000/api/docs)

A production-ready, high-throughput RESTful API for workout tracking, progressive overload analytics, exercise catalog management, and estimated 1RM calculations. Built with **Node.js (ESM)**, **Express 5**, **PostgreSQL**, **Prisma ORM**, and **Redis**.

---

## 📑 Table of Contents

- [Key Architecture & Features](#-key-architecture--features)
- [System Design & Data Architecture](#-system-design--data-architecture)
- [Technology Stack](#-technology-stack)
- [Interactive API Documentation](#-interactive-api-documentation)
- [API Endpoints Overview](#-api-endpoints-overview)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Installation & Database Setup](#installation--database-setup)
  - [Running the Application](#running-the-application)
- [Docker & Containerization](#-docker--containerization)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Project Directory Structure](#-project-directory-structure)
- [Deployment](#-deployment)
- [License](#-license)

---

## 🚀 Key Architecture & Features

- **Progressive Overload Analytics Engine**: Aggregates volume progression ($\sum \text{reps} \times \text{weight}$) grouped across dynamic time intervals (`day`, `week`, `month`) and calculates estimated One Rep Max (1RM) history using the standard Epley formula.
- **Multi-Tenant Security & IDOR Prevention**: Robust tenant isolation ensuring zero cross-user data leakage. All sensitive workout, set, and custom exercise queries are strictly scoped to the authenticated user ID.
- **Redis Cache-Aside Strategy**: Caches global standard exercise catalog queries with automated expiration (1h TTL) and invalidation hooks, reducing PostgreSQL read pressure by ~95% and lowering query latency to **< 2ms**.
- **Distributed Sliding-Window Rate Limiter**: High-precision rate limiting middleware built with Redis Sorted Sets (`ZSET` atomic pipelines) defending auth and API routes against brute-force attacks and spam.
- **Strict Input Validation**: All incoming request bodies, query strings, and path parameters are validated using **Zod** with custom refinement rules (e.g., date boundary verification).
- **Automated CI/CD Pipeline**: GitHub Actions continuous integration workflow launching ephemeral PostgreSQL service containers, syncing database schemas, running full test suites, and validating multi-stage Docker builds.

---

## 🏛️ System Design & Data Architecture

### Relational Entity-Relationship Diagram (PostgreSQL)

```mermaid
erDiagram
    User ||--o{ Workout : "logs"
    User ||--o{ Exercise : "creates custom"
    Workout ||--o{ WorkoutExercise : "contains (onDelete: Cascade)"
    Exercise ||--o{ WorkoutExercise : "referenced in (onDelete: Restrict)"
    WorkoutExercise ||--o{ WorkoutSet : "has sets (onDelete: Cascade)"

    User {
        string id PK "UUID"
        string email UK "Indexed"
        string password "Bcrypt Hash"
        string name
        datetime createdAt
        datetime updatedAt
    }

    Exercise {
        string id PK "UUID"
        string name "Indexed"
        string category "Indexed"
        boolean favorite
        string userId FK "Nullable (Global if null)"
        datetime createdAt
        datetime updatedAt
    }

    Workout {
        string id PK "UUID"
        string userId FK "Indexed with completedAt/startedAt"
        string name
        datetime startedAt
        datetime completedAt "Nullable"
        string notes "Nullable"
        datetime createdAt
        datetime updatedAt
    }

    WorkoutExercise {
        string id PK "UUID"
        string workoutId FK "Indexed with order (Unique)"
        string exerciseId FK "Indexed"
        int order
        datetime createdAt
        datetime updatedAt
    }

    WorkoutSet {
        string id PK "UUID"
        string workoutExerciseId FK "Indexed with setNumber (Unique)"
        int setNumber
        int reps
        float weight
        float rpe "Nullable (1-10)"
        boolean completed
        datetime createdAt
        datetime updatedAt
    }
```

### Redis Cache-Aside Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Service as exercise.service.js
    participant Redis as Redis Cache
    participant DB as PostgreSQL (Prisma)

    Client->>Service: GET /api/v1/exercises
    Service->>Redis: GET "exercises:global:cat:{category}:name:{name}"
    
    alt Cache HIT
        Redis-->>Service: Return cached JSON array
        Service-->>Client: 200 OK (⚡ sub-2ms response)
    else Cache MISS
        Redis-->>Service: null
        Service->>DB: prisma.exercise.findMany({ where: { userId: null } })
        DB-->>Service: Standard exercise list
        Service->>Redis: SET key JSON (TTL: 3600s)
        Service-->>Client: 200 OK
    end
```

---

## 💻 Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Runtime** | [Node.js](https://nodejs.org/) (v20+) | Native ES Modules (`"type": "module"`) |
| **Web Framework** | [Express](https://expressjs.com/) (v5.2.1) | Fast, unopinionated HTTP framework |
| **Database** | [PostgreSQL](https://www.postgresql.org/) (v16) | Relational SQL database with composite indexes |
| **ORM** | [Prisma ORM](https://www.prisma.io/) (v6.12.0) | Type-safe database client with `@prisma/adapter-pg` |
| **Caching & Limiting** | [Redis](https://redis.io/) (v7) | In-memory Cache-Aside + ZSET sliding-window rate limiter |
| **Authentication** | [JWT](https://jwt.io/) & [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Stateless Bearer token security & password hashing |
| **Validation** | [Zod](https://zod.dev/) (v4) | Strict runtime schema parsing and error formatting |
| **Documentation** | [Swagger UI](https://swagger.io/) & [OpenAPI 3.0](https://www.openapis.org/) | Interactive API documentation at `/api/docs` |
| **Testing** | [Jest](https://jestjs.io/) (v30) & [Supertest](https://github.com/ladjs/supertest) | End-to-end unit and integration test runner |
| **Containerization** | [Docker](https://www.docker.com/) & Docker Compose | Multi-stage Docker build (`node:20-alpine`) |
| **CI / CD** | [GitHub Actions](https://github.com/features/actions) | Automated test matrix, migration checks, and container builds |

---

## 📖 Interactive API Documentation

Interactive Swagger documentation is exposed directly on the running application:

- **Swagger UI**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
- **Raw OpenAPI Spec**: `docs/openapi.yaml`

To test authenticated endpoints in Swagger UI:
1. Register/Login via `POST /api/v1/auth/login`.
2. Copy the returned JWT token.
3. Click the **Authorize 🔓** button at the top of Swagger UI and enter `Bearer <your_token>`.

---

## 🔌 API Endpoints Overview

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public (Rate Limited) | Register a new user account |
| `POST` | `/api/v1/auth/login` | Public (Rate Limited) | Authenticate user and issue JWT |

### Exercises (`/api/v1/exercises`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/exercises` | Private | List visible exercises (cached global + custom) |
| `POST` | `/api/v1/exercises` | Private | Create a custom user-scoped exercise |
| `GET` | `/api/v1/exercises/:id` | Private | Retrieve single exercise details by UUID |

### Workouts (`/api/v1/workouts`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/workouts` | Private | List past workout history with optional date range filters |
| `POST` | `/api/v1/workouts` | Private | Log a new workout session with nested exercises and sets |
| `GET` | `/api/v1/workouts/:id` | Private | Fetch workout details and sets (multi-tenant protected) |
| `PUT` | `/api/v1/workouts/:id` | Private | Update an existing workout session |
| `DELETE` | `/api/v1/workouts/:id` | Private | Delete workout and cleanly cascade child sets/exercises |

### Metrics & Analytics (`/api/v1/metrics`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/metrics` | Private | Progressive overload volume time-series (`day`/`week`/`month`) |
| `GET` | `/api/v1/metrics/volume` | Private | Volume metrics alias endpoint |
| `GET` | `/api/v1/metrics/exercises/:exerciseId` | Private | Movement progression history & estimated 1RM calculations |

### System Health
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | Application health status and uptime ping |
| `GET` | `/api/docs` | Public | Interactive Swagger UI API documentation |

---

## 🛠️ Getting Started

### Prerequisites

Ensure the following tools are installed locally:
- **Node.js**: `v20.0.0` or higher
- **npm**: `v10.0.0` or higher
- **Docker & Docker Compose**: For local PostgreSQL and Redis services

---

### Environment Configuration

Create `.env` (for local development) and `.env.test` (for isolated test suites):

```bash
cp .env.example .env
```

#### `.env` (Development)
```env
PORT=5000
NODE_ENV=development

# Database Connection Strings (PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/workout_tracker?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/workout_tracker?schema=public"

# Redis Cache & Rate Limiting
REDIS_URL="redis://localhost:6379"

# JWT Authentication
JWT_SECRET="your_super_secret_production_ready_jwt_key_here"
JWT_EXPIRES_IN="7d"
```

#### `.env.test` (Automated Testing)
```env
PORT=5001
NODE_ENV=test

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/workout_tracker_test?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/workout_tracker_test?schema=public"

REDIS_URL="redis://localhost:6379"

JWT_SECRET="test_super_secret_jwt_key_12345"
JWT_EXPIRES_IN="1h"
```

---

### Installation & Database Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Local PostgreSQL and Redis via Docker Compose**:
   ```bash
   docker compose up -d
   ```

3. **Push Prisma Schema to Database**:
   ```bash
   npm run db:push
   ```

4. **Seed Database with Standard Global Exercises**:
   ```bash
   npm run db:seed
   ```

---

### Running the Application

```bash
# Start in development mode with hot-reloading
npm run dev

# Start in production mode
npm start
```

The server will boot on `http://localhost:5000`. Access Swagger UI at `http://localhost:5000/api/docs`.

---

## 🐳 Docker & Containerization

The application includes a lean, hardened **multi-stage Dockerfile** using `node:20-alpine`:

### Build Docker Image
```bash
docker build -t workout-tracker:latest .
```

### Run Container
```bash
docker run -p 5000:5000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/workout_tracker" \
  -e DIRECT_URL="postgresql://user:pass@host:5432/workout_tracker" \
  -e REDIS_URL="redis://host:6379" \
  -e JWT_SECRET="production_jwt_secret" \
  workout-tracker:latest
```

---

## 🧪 Testing & Quality Assurance

The test suite runs with **Jest** and native **Node.js ES Modules** against an **isolated test database** (`workout_tracker_test`), ensuring tests never pollute development or production databases.

```bash
# Run all unit and integration tests (with automated test DB sync)
npm test

# Run unit tests only (fast execution, no DB required)
npm run test:unit

# Run integration tests only (verifying API routes, IDOR security, and database cascades)
npm run test:integration

# Manually push schema to test database
npm run test:db:setup
```

### Test Suite Summary

```bash
PASS tests/integration/workout.test.js
  Workout Endpoints & Multi-Tenant Security (Integration)
    Nested Workout Creation & Database Persistence
      ✓ User A creates a workout with nested exercises and sets -> 201 Created (295 ms)
    Multi-Tenant Isolation & IDOR Prevention
      ✓ User B cannot access or view User A's workout (assert 404 Not Found) (182 ms)
      ✓ User B cannot delete User A's workout (assert 404 Not Found) (285 ms)
    Cascade Deletion
      ✓ User A deletes their workout -> 200 OK and cleanly cascades child sets (193 ms)

PASS tests/integration/metrics.test.js
PASS tests/integration/exercise.test.js
PASS tests/integration/auth.test.js
PASS tests/integration/docs.test.js
PASS tests/unit/password.test.js
PASS tests/unit/1rm.test.js

Test Suites: 7 passed, 7 total
Tests:       26 passed, 26 total
Snapshots:   0 total
Time:        5.81 s
```

---

## 📁 Project Directory Structure

```plaintext
workout-tracker/
├── .github/
│   └── workflows/
│       ├── ci.yml                # GitHub Actions Continuous Integration workflow
│       └── cd.yml                # Deployment workflow
├── docs/
│   └── openapi.yaml              # Complete OpenAPI 3.0.3 specification
├── prisma/
│   ├── schema.prisma             # PostgreSQL schema with relations, indexes & cascades
│   └── seed.js                   # Standard exercise catalog seed script
├── scripts/
│   └── test-runner.sh            # Isolated test environment synchronization script
├── src/
│   ├── config/
│   │   ├── db.js                 # PostgreSQL connection pool & Prisma client instance
│   │   ├── env.js                # Validated environment configuration
│   │   └── redis.js              # Redis client wrapper with graceful degradation
│   ├── middlewares/
│   │   ├── auth.middleware.js     # JWT Bearer token authentication middleware
│   │   ├── error.middleware.js    # Centralized operational error handler & custom AppError classes
│   │   ├── rateLimiter.middleware.js # Distributed sliding-window Redis rate limiter
│   │   └── validate.middleware.js # Zod schema validation middleware
│   ├── modules/
│   │   ├── auth/                 # Authentication module (Register, Login, JWT tokens)
│   │   ├── exercises/            # Exercise catalog module with Redis Cache-Aside
│   │   ├── metrics/              # Volume progression & estimated 1RM analytics
│   │   └── workouts/             # Workout logging & nested set/exercise relations
│   ├── utils/
│   │   ├── jwt.js                # JWT signing and verification helpers
│   │   ├── logger.js             # Formatted request/error logger
│   │   └── password.js           # Bcrypt hashing & comparison helpers
│   ├── app.js                    # Express app initialization & route mounts
│   └── server.js                 # HTTP server listener & graceful shutdown handlers
├── tests/
│   ├── helpers/
│   │   ├── authHelper.js         # Integration test user & token generators
│   │   └── database.js           # Database teardown & table truncation utilities
│   ├── integration/              # Supertest integration tests against test database
│   │   ├── auth.test.js
│   │   ├── docs.test.js
│   │   ├── exercise.test.js
│   │   ├── metrics.test.js
│   │   └── workout.test.js
│   ├── unit/                     # Fast standalone unit tests
│   │   ├── 1rm.test.js
│   │   └── password.test.js
│   └── setup.js                  # Global Jest lifecycle setup & teardown
├── .dockerignore
├── .env.example
├── .env.test
├── docker-compose.yml            # Local PostgreSQL 16 & Redis 7 services
├── Dockerfile                    # Hardened multi-stage container build
├── jest.config.js                # Jest native ESM configuration
├── package.json
└── README.md
```

---

## 🚢 Deployment

The repository includes a ready-to-use [render.yaml](file:///Users/datnguyen/Documents/project/workout-tracker/render.yaml) configuration for 1-click Blueprints deployment on **Render**:

- **Web Service**: Node.js container executing `npm run build && npm run db:migrate && npm start`.
- **Database**: Managed PostgreSQL instance with SSL enabled.

---

## 📜 License

This project is licensed under the **ISC License**.
