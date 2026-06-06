# Jobeda Madrasa ERP — Frontend

React + TypeScript SPA for the Jobeda Madrasa ERP API (separate from the backend repo).

## Stack
- React 18 + TypeScript (strict) + Vite
- Mantine 7 (UI), TanStack Query (server state), React Router 6 (routing)
- Zustand (auth/UI state), React Hook Form + Zod (forms), i18next (i18n)
- Typed API client generated from the backend's OpenAPI schema

## Prerequisites
- Node 18+ (developed on Node 22)
- The backend API running (default `http://127.0.0.1:8000`)

## Getting started
```bash
npm install
npm run dev          # http://localhost:5173  (proxies /api -> backend)
```

## Scripts
- `npm run dev` — start the dev server (Vite), proxying `/api` to the backend
- `npm run build` — type-check + production build
- `npm run typecheck` — TypeScript only
- `npm run gen:api` — regenerate `src/api/generated/types.ts` from the live OpenAPI schema

## Configuration
`VITE_API_BASE_URL` (see `.env.example`) — the API base. Defaults to `/api`, which Vite
proxies to the backend in dev so the httpOnly refresh-token cookie stays first-party.

## Status
Foundation milestone: scaffold, theme, routing shell, and placeholder login/dashboard.
Next: typed API client + auth (login/refresh/logout, route guards, RBAC).
