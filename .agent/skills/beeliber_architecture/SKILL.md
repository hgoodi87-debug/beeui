---
name: beeliber_architecture
description: Technical architecture overview, page structures, and the "Hyper-Gap" future roadmap for Beeliber.
---

# 🏗️ Beeliber Systems & Future Roadmap

This skill provides a technical overview of the Beeliber application architecture and the strategic "Hyper-Gap" roadmap.

## 📍 1. System Structure

Beeliber is built as a React SPA with Firebase integration (Firestore, Auth, Functions v2, Storage, Hosting).

### 🚀 Page Architecture (ViewTypes)

- **User Facing**: `LandingRenewal`, `ServicesPage`, `LocationsPage`, `BookingPage`, `TrackingPage`.
- **Administrative**: `AdminDashboard`, `BranchAdminPage`, `StaffScanPage`.
- **Informative**: `ManualPage`, `Terms`, `Privacy`.

### 🛡️ Admin Dashboard Modules

The dashboard is segmented by `AdminTab`:

- **Logistics**: Delivery and Storage booking management.
- **Operations**: Location management, Promotions, Accounting, Settlement.
- **System**: HR (Staff roles), System config, Cloud API settings, Hero/Notice editors.
- **CS**: Partnership inquiries, Live Chat history.

## 👩‍💻 2. Current Optimizations

- **Modular Functions v2**: Dedicated domains for booking, notification, and locations.
- **Lazy Loading**: Use `React.lazy()` and `Suspense` for heavy admin modules to keep user-facing pages fast.
- **SEO Strategy**: Meta-tag optimization per page (Landing, Branches).

## 🛰️ 3. "Hyper-Gap" Master Plan

- **Phase 1 (AI & Trust)**: Digital Twin Luggage 관제(Visualization), Demand Forecasting, Emotional AI CS.
- **Phase 2 (Automation)**: Zero-PII (QR-based anonymous tracking), Smart Contract Insurance (instant compensation), AMR robot delivery integration.
- **Phase 3 (Evolution)**: Next.js migration for SSR, Dynamic Routing based on user context, B2B Omichannel gateways.

> "We are not just building a website; we are replacing the heart of Beeliber with cutting-edge tech. 💅🛰️"
