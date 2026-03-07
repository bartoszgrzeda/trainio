# Trainio Backend Architecture

## Purpose

This document defines the architectural assumptions, development rules, and implementation boundaries for the Trainio backend.

It serves as the primary architectural reference for the backend and is especially important for **AI-assisted development**.

All backend code generation should follow the rules described here unless an explicit architectural decision updates this document.

---

# System Context

Trainio consists of:

- a **React Native mobile application** (`app/`)
- a **backend API** (`api/`)
- **project documentation** (`docs/`)

The backend is currently being built for the **first stage of the product**, which assumes a **single trainer scenario**.

In this stage:

- there is only **one trainer**
- all data belongs to that trainer
- multi-trainer support may be introduced later

The architecture should support evolution toward a multi-user system without forcing premature complexity.

---

# Product Scope

The backend is expected to manage the following areas:

- clients
- exercises
- trainings
- training plans
- user profile
- settings
- authentication
- subscriptions

---

# Initial Implementation Priorities

The first backend functionality to implement includes:

### Profile

Profile settings management:

- set first name
- set last name
- set email
- set phone number

### Exercises

Exercise management:

- add exercise
- list exercises

Initial exercise model:

- name

Exercises are **mixed**:

- system exercises seeded by the application
- trainer-defined custom exercises

### Clients

Client management:

- add client
- list clients

Initial client model:

- first name
- last name
- birthdate
- phone number
- gender
- notes

---

# Deferred Design Areas

The following topics are **intentionally postponed** and should not be prematurely modeled:

- detailed training domain
- training session flow
- training plans structure
- relationships around trainings
- roles and authorization
- ownership model for multiple trainers
- audit trail / history
- attachment storage design

When implementing code related to these areas, avoid assumptions that would block future design decisions.

---

# Architectural Priorities

Initial architectural priorities:

1. **Simplicity**
2. **Long-term maintainability**
3. **Speed of development**
4. **Strict domain modeling**

The architecture should remain:

- easy to understand
- easy to extend
- resistant to unnecessary complexity

Avoid premature architectural sophistication.

---

# Architectural Style

The backend should be implemented as a **modular monolith**.

This means:

- one deployable backend system
- internal boundaries enforced through code structure
- modules separated logically rather than physically deployed as services

Microservices are **explicitly out of scope** for this stage.

---

# Solution Structure

The backend is split into **four projects**:

```

api/
Trainio.Api
Trainio.Application
Trainio.Domain
Trainio.Infrastructure

```

## Project Responsibilities

### Trainio.Api

Responsible for:

- HTTP controllers / endpoints
- request and response contracts
- API-level validation
- authentication integration
- HTTP error mapping
- middleware

This layer should **only contain HTTP-related concerns**.

---

### Trainio.Application

Responsible for:

- application services
- use-case orchestration
- application-level validation
- coordinating repositories and domain entities

Application services implement **business workflows**.

---

### Trainio.Domain

Responsible for:

- entities
- enums
- value objects (when useful)
- domain exceptions
- core business rules

This layer **must not depend on EF Core, ASP.NET, or infrastructure concerns**.

---

### Trainio.Infrastructure

Responsible for:

- EF Core configuration
- database access
- repository implementations
- migrations
- seed data
- integrations
- file storage integration
- external authentication providers

Infrastructure implements technical concerns required by the application.

---

# Internal Code Organization

Within each project, code should be organized primarily **by feature**.

Example structure:

```

Trainio.Api
Features
Clients
Exercises
Profile
Settings

Trainio.Application
Features
Clients
Exercises
Profile
Settings

Trainio.Domain
Features
Clients
Exercises
Profile
Settings

Trainio.Infrastructure
Features
Clients
Exercises
Profile
Settings
Persistence

```

Feature-first organization improves:

- discoverability
- maintainability
- AI-assisted development consistency

---

# Main Architectural Flow

Standard backend flow:

```

HTTP Endpoint -> Application Service -> Repository -> EF Core -> Database

```

## Rules

- endpoints must remain **thin**
- application services contain **use-case logic**
- repositories encapsulate **data access**
- EF Core usage must remain inside **Infrastructure**

---

# API Design

The backend uses **use-case-oriented endpoints** rather than strict REST purity.

Preferred endpoint style:

```

POST /clients/create
GET /clients/list

POST /exercises/create
GET /exercises/list

POST /profile/update

POST /trainings/start

```

This style is preferred because the backend primarily supports a **mobile application workflow**.

Strict REST resource modeling is intentionally not enforced.

---

# Endpoint Naming Convention

All feature endpoints should follow the same pattern:

```

/{feature}/{action}

```

Examples:

```

/clients/create
/clients/list
/exercises/create
/exercises/list
/profile/update

```

Avoid mixing with REST-style routes such as:

```

/clients
/clients/{id}

```

Consistency of endpoint style is important.

---

# API Response Strategy

Responses should follow this rule:

- **default:** clean resource responses
- **exception:** screen-specific responses when a screen requires aggregated data

Examples:

Resource responses:

```

clients list
exercise list
profile data

```

Screen-specific responses:

```

home screen summary
training workflow responses

```

This allows the backend to remain stable while supporting mobile UI needs.

---

# Validation and Error Handling

Validation happens at multiple levels.

### Domain Level

Used for:

- invalid domain state
- broken business rules
- domain invariants

Errors are represented as **Domain Exceptions**.

---

### Application Level

Used for:

- invalid use case execution
- application workflow failures
- dependency issues

Errors are represented as **Application Exceptions**.

---

### API Level

The API layer converts exceptions into **consistent HTTP error responses**.

A **shared error response format** should be implemented early.

---

# Persistence

Persistence uses:

- **EF Core**
- **PostgreSQL**

During early development, **in-memory storage may be temporarily used**, but the system should be designed assuming PostgreSQL.

---

# Database Migrations

Database migrations must be enabled **from the beginning**.

Schema evolution must be managed through migrations.

---

# Repository Rules

Repositories should:

- encapsulate EF Core access
- provide persistence operations
- expose queries needed by the application layer

Repositories must **not**:

- implement business workflows
- become generic abstraction layers
- hide logic behind unclear patterns

Business logic belongs in **Application Services**.

---

# Seed Data

The system should support seed data from the beginning.

Known seed requirements:

- system-defined exercises

Seed logic belongs in **Infrastructure**.

---

# Authentication

Authentication is required but may be implemented later.

The expected direction is:

- **external authentication provider**

The architecture must remain compatible with authenticated user context.

---

# File and Attachment Handling

The backend should be prepared for:

- files
- images
- attachments

The exact storage strategy will be defined later.

File handling should remain **isolated in Infrastructure**.

---

# Testing Strategy

Testing has a **high priority** from the start.

Testing layers:

1. unit tests for domain and application logic
2. integration tests for repositories and API behavior
3. end-to-end tests where necessary

Testing principles:

- test behavior, not frameworks
- keep tests readable
- prefer meaningful coverage over large test counts

---

# Logging

Initial logging can remain **basic**.

Structured logging and correlation IDs may be introduced later when necessary.

---

# What the Architecture Must Avoid

The backend must avoid:

- overengineering
- fat endpoints/controllers
- business logic in repositories
- unnecessary project fragmentation
- magic abstractions
- inconsistent patterns across features

The system should remain:

- simple
- explicit
- predictable

---

# Rules for AI-Assisted Code Generation

AI-generated code must follow these rules:

1. Follow the documented architecture and project boundaries.
2. Generate code inside the correct feature folders.
3. Keep endpoints thin.
4. Place business logic in Application Services.
5. Keep EF Core access inside Infrastructure and repositories.
6. Do not introduce CQRS, mediator patterns, or additional architectural frameworks unless explicitly requested.
7. Avoid unnecessary abstractions.
8. Prefer straightforward, readable implementations.
9. Maintain architectural consistency across all features.
10. Update documentation when architecture or API behavior changes.

This document is written primarily to guide **AI-assisted development workflows**.

---

# Open Design Areas

The following areas are intentionally open and will be designed later:

- training domain model
- training workflow states
- training plans
- authorization roles
- multi-trainer ownership model
- audit history
- attachment storage strategy

Until those decisions are made, implementations should remain conservative and flexible.

---

# Summary

The Trainio backend is implemented as a **modular monolith** with four projects:

- Trainio.Api
- Trainio.Application
- Trainio.Domain
- Trainio.Infrastructure

Technology stack:

- ASP.NET Core Web API
- EF Core
- PostgreSQL
- migrations enabled from the start

Main backend flow:

```

Endpoint -> Service -> Repository -> EF Core -> Database

```

The architecture prioritizes:

- simplicity
- maintainability
- consistency

over unnecessary complexity.