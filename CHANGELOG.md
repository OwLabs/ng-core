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

-

### Added (Testing)

### Notes

-

- ***

---

## [2.0.6] — DDD + CQRS Architecture Refactoring (Major)

### Added

#### Domain-Driven Design (DDD) Structure

- Adopted **DDD folder structure** across all modules (`Auth`, `Users`, `Materials`):
  - `domain/entities/` — rich domain entities with business logic methods
  - `domain/repositories/` — repository interfaces (contracts)
  - `domain/types/` — shared domain types (`AuthResult`, `AuthTokens`, `TokenPayload`, `UserResponse`, `MaterialResponse`)
  - `domain/enums/` — domain enums (`AuthProvider`, `UserRole`, `MaterialType`)
  - `domain/value-objects/` — value objects (`Email`, `UserName`) in Users module
  - `infrastructure/repositories/` — concrete repository implementations
  - `infrastructure/schemas/` — Mongoose schemas (module-scoped)
  - `presentation/controllers/` — HTTP controllers (presentation layer)

#### CQRS (Command Query Responsibility Segregation)

- Integrated `@nestjs/cqrs` across **Users** and **Materials** modules:
  - **Users Commands**: `CreateUserCommand`, `UpdateUserRolesCommand`
  - **Users Queries**: `GetUserByIdQuery`, `GetUserByEmailQuery`, `GetAllUsersQuery`, `GetUserProfileQuery`
  - **Materials Commands**: `UploadMaterialCommand`, `DeleteMaterialCommand`
  - **Materials Queries**: `GetAllMaterialsQuery`, `GetMaterialByIdQuery`, `GetStudentMaterialsQuery`
  - **Materials Events**: `MaterialUploadedEvent`
- Auth module communicates with Users module via `CommandBus` / `QueryBus` instead of direct repository access

#### Value Objects

- Added `Email` value object with built-in validation
- Added `UserName` value object with built-in validation
- Domain entities now use value objects for type-safe field access (e.g. `user.email.getValue()`)

#### Repository Interfaces & DI Tokens

- Defined `IRefreshTokenRepository` interface with DI symbol token (`REFRESH_TOKEN_REPOSITORY`)
- Defined `IUserRepository` interface with DI symbol token
- Defined `IMaterialRepository` interface with DI symbol token
- Repository implementations injected via `{ provide: TOKEN, useClass: Impl }` pattern

#### Utility

- Added `extract-ip.util.ts` for clean IP extraction in Auth presentation layer
- Added `crypto.ts` utility in `common/utils/`
- Moved API config enums (`ApiVersionEnum`, `SwaggerVersionEnum`, `ApiPlatformEnum`) to `common/config/`

### Changed

#### Module Architecture

- **Auth Module**: imports `UsersModule` instead of individual `UserRepository` / `UsersService`; registers `RefreshTokenSchema` locally via `MongooseModule.forFeature()`
- **Users Module**: fully self-contained with own schema, repository, CQRS handlers, and controller
- **Materials Module**: fully self-contained with own schema, repository, CQRS handlers, and controller
- **Database Module**: stripped down to only provide the MongoDB connection; no longer registers individual schemas

#### Auth Service Refactoring

- `register()` uses `CommandBus.execute(CreateUserCommand)` instead of direct `UserRepository.create()`
- `validateUser()` uses `QueryBus.execute(GetUserByEmailQuery)` instead of direct `UserRepository.findByEmail()`
- `validateGoogleUser()` uses `CommandBus` / `QueryBus` for user lookup and creation
- `login()` now accepts `UserResponse` type and returns `AuthTokens` type
- Password hashing salt rounds now **configurable** via `BCRYPT_SALT_ROUNDS` env variable (default: 10)
- Replaced hardcoded `'local'` / `'google'` strings with `AuthProvider` enum
- Replaced hardcoded `['user']` role arrays with domain enum defaults
- Replaced `sanitizeUser()` utility with entity method `user.toResponse()`

#### Refresh Token Service Refactoring

- Uses `IRefreshTokenRepository` interface via `@Inject(REFRESH_TOKEN_REPOSITORY)` instead of concrete class
- Uses `QueryBus` (`GetUserByIdQuery`) instead of direct `UserRepository` for user lookups
- `createToken()` returns `Promise<string>` (raw token) instead of object
- `rotateRefreshToken()` returns `AuthTokens` type instead of `RefreshTokenPayload`
- `validateRefreshToken()` uses entity methods (`isRevoked()`, `isExpired()`) instead of raw property checks
- `revokeTokenById()` no longer makes an extra DB call to fetch user name

#### Strategies

- `JwtStrategy`, `LocalStrategy`, `GoogleStrategy` updated to work with new entity/type signatures

#### Roles Guard & Decorator

- Updated `RolesGuard` to align with new `UserExpressRequest` interface
- Updated `@Roles()` decorator to use new type definitions

### Fixed

#### Security

- **Fixed placeholder hash race condition** in refresh token creation:
  - **Before**: created a DB record with a placeholder hash, then updated it — leaving an attackable window
  - **After**: generates token ID upfront, hashes the real token, then creates the DB record in a single atomic write
- Replaced non-null assertions (`!`) with proper null checks across Auth service
- Improved error messages (e.g. Google login prompt instead of generic "reset password" message)

#### Type Safety

- Eliminated `IUser` interface usage — replaced with `User` entity and `UserResponse` type
- Eliminated `RefreshTokenEntity` — replaced with `RefreshToken` domain entity
- Eliminated `MaterialEntity` — replaced with `Material` domain entity
- Eliminated `AuthResult` type from old location — moved to `auth/domain/types/`

### Removed

- Removed **centralized `core/domain/`** layer:
  - `core/domain/entities/` (user, material, refresh-token entities)
  - `core/domain/interfaces/` (user, material, refresh-token interfaces)
- Removed **centralized `core/infrastructure/repositories/`**:
  - `UserRepository`, `MaterialRepository`, `RefreshTokenRepository` (moved into respective modules)
- Removed **centralized `core/infrastructure/database/schemas/`**:
  - `user.schema.ts`, `material.schema.ts`, `refresh-token.schema.ts` (moved into respective modules)
- Removed **`src/api/`** directory:
  - `api-platform.enum.ts`, `api-version.enum.ts`, `swagger-version.enum.ts` → relocated to `common/config/`
- Removed `sanitize-user.ts` utility — replaced by entity `toResponse()` method
- Removed `auth-result.type.ts` from old location — moved to `auth/domain/types/`
- Removed old controller barrel exports (`auth/controllers/`, `users/controllers/`, `materials/controllers/`) — replaced by `presentation/controllers/`
- Removed old service barrel exports (`users/services/`, `materials/services/`) — replaced by module-scoped exports

### Notes

- This is a **major architectural refactoring** — the version bump from 1.x to 2.x reflects breaking internal structure changes
- Each module now **owns its own domain**: entities, schemas, repositories, and presentation
- Modules communicate through **CQRS boundaries** (CommandBus / QueryBus), not direct imports
- The centralized `core/` layer is now minimal (database connection only)
- Future modules should follow the same DDD + CQRS pattern established here

---

## [1.0.6] — Material Module (Upload, RBAC, Multipart Safety, Tests)

### Added

- Implemented **Materials Module** with clean Controller → Service → Repository layering.
- Added **material upload flow** with multipart/form-data support:
  - `POST /v1/material/upload`
- Stored uploaded material metadata:
  - title
  - description
  - type (`document` | `video`)
  - subject
  - fileUrl (local storage path)
  - fileSize
  - mimeType
  - originalName
  - uploadedBy (User reference)
  - optional courseId
- Added other endpoint as well in **material controller**:
  - `GET /v1/material/:id`
  - `GET /v1/material/download/:id`
  - `GET /v1/material`
- Integrated **local file upload handling** using `@nestjs/platform-express` (`FileInterceptor`).
- Added `Material` MongoDB schema with timestamps.
- Added `MaterialEntity` and `IMaterial` domain interface.
- Implemented `MaterialRepository` with:
  - `create()` — persist material
  - `findAll()` — retrieve all materials
  - `findById()` — retrieve material by it's ID
- Implemented `MaterialService` with:
  - `uploadMaterial()`
  - `getAllMaterials()`
  - `getMaterialById()`
  - `downloadMaterial()`

#### Access Control (RBAC)

- Protected all material routes using:
  - `JwtAuthGuard`
  - `RolesGuard`
- Applied **role-based access rules**:
  - Tutors & Admins → upload materials
  - Students, Tutors & Admins → view materials
- Centralized guards at controller level to avoid repetition.

#### Multipart Request Safety (RBAC + File Upload)

- Enhanced `RolesGuard` to **safely handle multipart/form-data requests**:
  - Drains the request stream (`request.resume()`) before throwing `ForbiddenException`
  - Prevents unhandled stream errors when access is denied during file uploads
  - Prevents NestJS from crashing due to stream-related errors (e.g. `ECONNRESET`, `ERR_STREAM_PREMATURE_CLOSE`)
- Ensures NestJS does **not crash or hang** when:
  - User uploads a file
  - User lacks required role
- Guard now gracefully handles:
  - readable streams
  - early RBAC rejection
  - stream completion (`end` / `error`)

#### API & Validation

- Added `UploadMaterialDto` with validation rules using `class-validator`.
- Integrated material routes into versioned API (`/v1/material`).
- Materials endpoints included in Swagger documentation.

### Changed

- Adopted **ObjectId consistency**:
  - `uploadedBy` is stored as `Types.ObjectId` at persistence layer.
  - Service layer accepts string userId and converts internally.
- Standardized controller return types to use `MaterialEntity`.
- Updated `RolesGuard` to use the new `UserExpressRequest` interface:
  - Strongly typed `request.user`
  - Explicit support for stream-related properties (`readable`, `readableEnded`, `resume`)
  - Improved type safety for multipart/form-data handling

### Fixed

- Fixed NestJS crash scenario when:
  - multipart upload is rejected by RBAC
  - request stream is not consumed
- Ensured forbidden uploads:
  - do not reach service layer
  - do not leave hanging streams
- Resolved TypeScript mismatches between:
  - DTOs
  - domain interfaces
  - entity constructors

### Added (Testing)

- Added **unit tests** for `MaterialService`:
  - upload material
  - retrieve materials
- Added **unit tests** for `RolesGuard`:
  - denies access when role does not match
  - drains multipart streams before throwing `ForbiddenException`
- Added **E2E tests** for Materials module:
  - Tutor can upload material
  - Student is forbidden from uploading
  - Forbidden upload returns proper 403 response
  - Service method is not invoked on RBAC failure
- Added reusable **test helpers**:
  - `seedUser()` for controlled role-based E2E setup
- Verified RBAC behavior using real JWT tokens and multipart requests.

### Notes

- File storage currently uses **local filesystem** (`/uploads/*`).
- Developers must create an **`uploads/`** folder at the project root to ensure file uploads work correctly during development and testing.
- Guard-level stream draining is critical when combining:
  - Multer
  - file uploads
  - role-based authorization
- Future improvements (planned):
  - AWS S3 integration
  - File streaming / secure download endpoint
  - Pagination & filtering for material listing
  - Material ownership & course-based access control

---

## [1.0.5] — Google OAuth Authentication + Token Integration

### Added

- Implemented **Google OAuth 2.0 authentication flow** using Passport:
  - `GET /auth/google` — initiates Google OAuth login
  - `GET /auth/google/redirect` — handles Google callback and login completion
- Added `GoogleStrategy` with profile validation and user provisioning.
- Integrated Google login with existing **JWT + Refresh Token System**.
- Automatically creates a new user on first Google login.
- Issued both:
  - JWT access token
  - Rotating refresh token on successful Google authentication
- Captured login context during Google login:
  - User-Agent
  - IP address

### Changed

- Extended `AuthService.login()` to support OAuth-based users.
- Reused existing refresh token rotation logic for Google-authenticated users.
- Unified login token issuance logic across local and Google providers.

### Fixed

- Ensured Google-authenticated users never expose password fields.
- Prevented refresh token creation without proper user context.
- Corrected Google strategy validation signature to align with Passport flow.

### Added (Testing)

### Notes

- Skip **E2E and unit tests** for Google Oauth callback flow.
- Will spillover to the next sprint for this particular test.
- Google OAuth is fully integrated with multi-device session support.
- Refresh token security rules (rotation, revocation, expiry) apply identically to local and Google logins.
- OAuth provider logic is isolated and reusable for future providers (e.g. Github, Facebook and etc)

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
