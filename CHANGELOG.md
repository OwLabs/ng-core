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

---

## [1.0.4] — Refresh Token Module (Rotation, Revocation, E2E + Unit Tests)

### Added

- Implemented full **Refresh Token Module** with secure token rotation.
- Added new authentication flows:
  - `POST /auth/refresh` — rotate refresh token, return new access & refresh tokens.
  - `POST /auth/logout` — revoke only current device's refresh token.
  - `POST /auth/logout-all-devices` — revoke _all_ tokens for current user (JWT-protected).
- Added `RefreshTokenService` with:
  - `createToken()` — creates DB record + hashed token
  - `validateRefreshToken()` — validates hash, expiry, and revocation status
  - `rotateRefreshToken()` — rotates token, revokes old, generates new pair
  - `revokeTokenById()` — invalidate a single session
  - `revokeAllForUser()` — invalidate all sessions
- Added `RefreshTokenRepository` and Mongo schema.
- Added refresh token hashing using **bcrypt**.
- Added support for storing login context:
  - IP address
  - User-Agent
  - Token TTL (default 30 days)

### Changed

- Updated `AuthController`:
  - Added `refresh`, `logout`, and `logout-all-devices` routes.
  - Login now extracts IP and user agent automatically via `req.headers`.
  - Updated login response to include `{ access_token, newRawToken }`.

- Updated E2E auth setup to support new routes.

### Fixed

- Fixed scenario where expired or revoked refresh tokens were not validated correctly.
- Fixed login flow to properly record device metadata.

### Added (Testing)

- Added **unit tests** for `RefreshTokenService`:
  - token creation
  - validation (revoked, expired, hash mismatch)
  - rotation logic
  - revocation logic
- Added spies for repository methods and bcrypt comparisons.
- Ensured unit tests use isolated DI container with mocked repositories.
- Updated **E2E tests** to align with the new auth flow.

### Notes

- Token rotation now follows industry standards (similar to Google, Amazon, Auth0).
- Backend now supports full **multi-device session management**.
- Next step (optional): integrating refresh tokens into Google OAuth login.

---

## [1.0.3] — Compodoc Documentation Setup

### Added

- Integrated Compodoc for auto-generated documentation.
- Initial documentation for all modules, providers, and controllers.

### Notes

- Compodoc is traditionally for **Angular** but works seamlessly with **NestJS** due to their similar structure.
- Useful for API docs, class diagrams, dependency graphs.
- Future step: integrate Compodoc into **CI/CD** (optional).

---

## [1.0.2] — CI Test Workflow (Unit + E2E)

### Added

- Added GitHub Actions workflow for automated testing.
- Configured separate execution for:
  - **Unit tests** (`npm run unit`)
  - **E2E tests** (`npm run e2e`)
- Test workflow triggers on:
  - pushes to `main`
  - pull requests to `main`
- Ensured Node.js version consistency using `setup-node@v4`.

### Fixed

- Resolved PR update issue by ensuring workflow file exists and can be committed.

### Notes

- This workflow currently uses **MongoDB Memory Server** for E2E tests.
- A real MongoDB service via Docker can be added later once the project reaches the containerization stage.
- Every pull request must now pass **unit + e2e** tests before merging.

---

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
