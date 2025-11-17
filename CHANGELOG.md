# 📝 Changelog

All notable changes to this project will be documented in this file.  
This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification.

---

## [Release Version] - _title/description_

### Added

-

### Changed

-

### Fixed

-

### Removed

- ***

## [1.0.1] — Authentication, Users, RBAC & API Documentation

### Added

#### Authentication Module

- Local registration with password hashing
- Local login via Passport LocalStrategy
- Google OAuth2 login integration
- Provider handling (`local` / `google`)
- JWT token generation with `JwtService`
- User sanitization using `sanitizeUser`
- **API Endpoints:**
  - `POST /auth/register`
  - `POST /auth/login`
  - `GET /auth/google`
  - `GET /auth/google/redirect`

#### Users Module

- Fetch user by ID or email
- Fetch all users (admin / super admin only)
- Update user roles using `updateRoles`
- Retrieve authenticated user's profile
- **API Endpoints:**
  - `GET /users`
  - `GET /users/profile`

#### Security / RBAC

- Implemented `JwtAuthGuard` for protected routes
- Implemented `RolesGuard` using metadata-based role checks
- Added `@Roles()` decorator
- Added `RoleEnum` (super_admin, admin, student, tutor, parent)
- RBAC applied to Users module routes

#### Swagger API Documentation

- Integrated Swagger using `SwaggerModule`
- Configured Swagger metadata using `DocumentBuilder`
- Added internal API documentation endpoint:
  - `GET /internal-ng-core-api`

#### API Versioning

- Enabled URI-based versioning (`/v1/...`)
- Set default version to `v1`
- Versioning applied in both `main.ts` and E2E test setup

#### Database Module

- Connected MongoDB using `MongooseModule.forRootAsync()`
- Env-based configuration (`MONGO_URI`, `MONGO_DB_NAME`)
- Implemented `User` schema with timestamps and role/provider fields
- Added `DatabaseService` with connection logging

#### E2E Testing Infrastructure

- In-memory MongoDB using `mongodb-memory-server`
- Bootstrapped NestJS test environment via `setupE2EApp()`
- Added versioned API endpoint helper for tests
- Automatically closes database + app after tests

#### Utility

- Added `sanitizeUser()` to remove password fields before returning responses

---

### Notes

- Authentication supports both **local login** and **Google OAuth**.
- Auto-provision roles:
  - Local users → `user`
  - Google users → `student`
- Users module fully protected with JWT and RBAC rules.
- Swagger documentation auto-generates from decorators.
- E2E test environment mirrors real app configuration (minus persistent DB).

---

## [1.0.0] - Initial setup

### Added

- Initial release of **ng-core**

---

### Notes

- Use **semantic versioning**: `MAJOR.MINOR.PATCH` (e.g., 1.0.0 → 1.1.0 → 1.1.1)
- Bootstrapped the ng-core project
- Always add the newest version **on top** of the file.

---
