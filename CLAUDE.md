# Jobeda ERP — Frontend guide

Industry-grade React SPA for the Jobeda Madrasa ERP API. Backend (FastAPI) is the **sibling folder `../jobeda/`** — read `../jobeda/HANDOFF.md` for live status, the backend API surface, and the prioritized next steps.

## Run
```
npm install
npm run dev      # http://localhost:5173 ; dev server proxies /api -> http://127.0.0.1:8000
```
Backend must be running on :8000 first (`cd ../jobeda && ./venv/Scripts/python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000`).
Demo login: **owner@jobeda.com / Owner@123 / tenant slug `jobeda`**.

## Stack & conventions
- React 18 + TS (**strict**), Vite, **Mantine 7** (UI), **TanStack Query** (server state), React Router 6, **Zustand** (auth store), **RHF + Zod** (forms), axios.
- `@/` = `src`. **Feature-first**: `src/features/<domain>/{*Page.tsx, api.ts}`. Shared: `src/components` (AppLayout, AsyncBoundary, StatCard…), `src/lib` (`money.ts`, `date.ts`, `env.ts`), `src/api` (`client.ts`, `errors.ts`, `generated/types.ts`), `src/auth`, `src/app` (router, theme, queryClient).
- **API client** (`src/api/client.ts`): axios, `withCredentials: true`, in-memory access token, **single-flight 401 refresh** (one refresh shared across concurrent 401s, then retry).
- **Types are generated** from the backend OpenAPI: `npm run gen:api` → `src/api/generated/types.ts`. Re-run after backend route/model changes.
- **Money**: always `formatMoney` (`src/lib/money.ts`) — handles `number | string`, negatives, renders ৳. Never do float math.
- **Loading/error**: wrap data views in `<AsyncBoundary loading error>`. Normalize errors via `normalizeError` (`src/api/errors.ts`) — handles 422 field-error arrays vs `{detail:"..."}`.
- **Roles**: from the auth store (`user.role_name`). Gate finance UI (Take Payment, fee assign) to owner/admin/accountant; `RoleRoute` guards pages.
- **Verify**: `npm run build` (tsc + vite build) must pass before committing.

## Gotchas
- Restart the dev server fresh before browser end-to-end checks — HMR churn can leave a Mantine **modal rendered empty**.
- The backend returns money as strings on some endpoints and numbers on others — `formatMoney` already absorbs this; don't add ad-hoc parsing.

## Status (see ../jobeda/HANDOFF.md for the full picture + backlog)
Built & browser-verified through `57f04f1`: auth, owner dashboard, students (list with Reg-No/Section/Roll/Group columns + filters, admission, detail, **Edit**, payment history), guardian picker, **Fees** section (groups CRUD, structure editor, group-aware Generate modal), Take Payment.
**Remote**: `github.com/Saadasw/jobeda_02_f` (pushed; `main` tracks `origin/main`).
**What's next** lives in `../jobeda/HANDOFF.md §5` — top items: role-gate the open writes, contract-phase migration, roll assignment + class transfer, and several missing admin UIs (Users, Fee Types, Expenses/Income/Payroll).
