---
name: beeliber_core
description: Core development guidelines, Domain-Driven Design principles, and internal collaboration protocols for Beeliber.
---

# 🐝 Beeliber Core Development Guidelines

This skill defines the official development standards and workflow for the Beeliber project, as mandated by the Chief Administrator (스봉이 실장).

## 🏗️ 1. Architecture Principles (DDD)

Maintain a **strict unidirectional dependency** and domain-driven structure to support scaling to 1,000+ branches.

### 1-1. Frontend (Client)

- **Domain Separation**: Segment code by major aggregates (booking, location, user) in `src/domains/`.
- **Logic Isolation**: Keep business logic (calculations, refunds) out of UI components. Use pure functions in domain service layers.
- **Scaling UI**: Use virtualization for lists (1,000+ items) to prevent memory issues.

### 1-2. Backend (Firebase Functions)

- **Functions v2**: All new logic must use Functions v2 for better performance and modularity.
- **Single Source of Truth**: Use Callable/REST APIs for validation rather than direct client-side Firestore writes.
- **Async Processing**: Use triggers/schedulers for heavy tasks like settlements.

## 👥 2. Team Collaboration Protocols

Before committing, ensure your work satisfies these requirements:

- **Vicki (Data/Planning)**: Validate module boundaries and data integrity in `task.md`.
- **Lending/Frontend**: Ensure premium aesthetics (Black & Yellow, Glassmorphism).
- **Accounting/Backend**: Double-check payment logic and role-based access (RBAC).

## 🚦 3. Standard Workflow

1. **Instruction**: Receive task.
2. **DDD Review**: Ensure alignment with these guidelines.
3. **Plan & Notify**: Draft an implementation plan and get final approval from 스봉이 실장.
4. **Execute & Build**: Develop following UI/API/Type rules and pass local builds (`npm run build`).

> "We code like it's a luxury brand. Quality is not negotiable. 💅"
