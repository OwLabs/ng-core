# 🧠 NeuralGuru Core (`ng-core`)

## Overview

`ng-core` is the **main backend service** of the **NeuralGuru** platform — a virtual learning environment (VLE) built as a microservices system.

As the central hub, `ng-core` handles core business logic (users, materials, assessments, scheduling, analytics) and orchestrates communication between the other NeuralGuru services.

---

## NeuralGuru Ecosystem

```
ng-web (Frontend)
    ↓
ng-core (Main Backend)   ← this repo
    ↓
    ├── ng-payment (Payment Service)
    └── ng-ai (AI Backend)
```

| Service       | Description                                                    |
| ------------- | -------------------------------------------------------------- |
| `ng-web`      | Frontend — Next.js (web), React Native / Flutter (mobile)      |
| **`ng-core`** | **Main backend — core business logic & service orchestration** |
| `ng-payment`  | Payment gateways — Stripe, Billplz, SenangPay, IPay88          |
| `ng-ai`       | AI-powered features — RAG (Retrieval-Augmented Generation)     |

---

## Architecture

|                     |                                               |
| ------------------- | --------------------------------------------- |
| **Framework**       | NestJS (Modular Monolith, microservice-ready) |
| **Design Patterns** | CQRS + DDD + OOP                              |
| **Database**        | MongoDB (Mongoose)                            |
| **Storage**         | AWS S3                                        |
| **Authentication**  | JWT / Passport (Local, JWT, Google OAuth)     |
| **API Docs**        | Swagger (`@nestjs/swagger`), Compodoc         |
| **Testing**         | Jest + @swc/jest, mongodb-memory-server       |

### Design Principles

- **CQRS** — Commands (writes) and Queries (reads) are separated into distinct handlers via `@nestjs/cqrs`, with support for domain Events
- **DDD** — Each module is structured into `domain`, `application`, `infrastructure`, and `presentation` layers. Business rules live in rich domain entities, not services
- **OOP** — Entities use private fields with read-only getters, private constructors with factory methods, and immutable value objects for type safety

### Dependency Flow

```
Presentation (Controllers)
    → Application (Command/Query Handlers)
        → Domain (Entities, Value Objects, Repository Interfaces)
            ← Infrastructure (Mongoose Repositories, Schemas)
```

> Domain has zero framework dependencies. Infrastructure implements domain contracts via NestJS DI.

---

## Project Structure

```
ng-core/
├── src/
│   ├── main.ts                          # App bootstrap, versioning, Swagger
│   ├── app.module.ts                    # Root module
│   │
│   ├── core/
│   │   └── infrastructure/
│   │       └── database/                # DatabaseModule (MongoDB connection)
│   │
│   ├── common/
│   │   ├── config/                      # API & Swagger version enums
│   │   ├── decorators/                  # @Roles() decorator
│   │   ├── guards/                      # JwtAuthGuard, RolesGuard
│   │   ├── types/                       # Shared interfaces
│   │   └── utils/                       # Crypto utilities
│   │
│   └── modules/
│       ├── auth/                        # Authentication & authorization
│       ├── users/                       # User management (CQRS)
│       └── materials/                   # Learning materials (CQRS + Events)
│
├── test/
│   ├── e2e/                             # E2E test specs
│   │   └── _support/                    # Helpers, setup, constants
│   ├── unit/                            # Unit tests
│   └── fixtures/                        # Test fixtures
│
├── package.json
├── tsconfig.json
└── README.md
```

### Module Layers (DDD)

Each module follows a consistent layered structure:

```
module/
├── domain/              # Business logic — entities, value objects, enums, repository interfaces, types
├── application/         # Use cases — commands/, queries/, events/ (each with impl/ and handlers/)
├── infrastructure/      # Persistence — Mongoose repository implementations & schemas
├── presentation/        # HTTP — REST controllers
├── dto/                 # Request validation
├── services/            # Application services (used where CQRS is not applied)
└── strategies/          # Passport strategies (auth module only)
```

---

## Core Capabilities

- Role-based authentication and authorization (Student, Tutor, Parent, Admin)
- Material management (upload and serve PDFs, videos, notes)
- Quiz and assessment system with score tracking
- Tutor profile management and session booking
- Performance analytics and report generation
- Orchestration layer for `ng-payment` and `ng-ai` microservices

---

## Microservice Integration

| Service      | Communication | Purpose                                        |
| ------------ | ------------- | ---------------------------------------------- |
| `ng-payment` | REST          | Payment sessions, transaction status, refunds  |
| `ng-ai`      | REST          | AI recommendations, content analysis, tutoring |

> Future support for asynchronous messaging (RabbitMQ / gRPC) in scalable environments.

---

## Getting Started

### 1. Clone & Install

```bash
git clone <repository-url>
cd ng-core
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

### 3. Development

```bash
npm run start:dev
```

### 4. Production

```bash
npm run build
npm run start:prod
```

### 5. Testing

```bash
npm run unit        # Unit tests
npm run e2e         # E2E tests (mongodb-memory-server)
npm run test        # All tests
```

### 6. Documentation

```bash
# Swagger API docs
http://localhost:3000/internal-ng-core-api

# Compodoc (project documentation)
npm run docs        # serve at http://localhost:8080
npm run docs:dev    # serve with live reload
```
