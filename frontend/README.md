# Wardrobe App — Frontend

Angular 20 SPA: standalone components, **zoneless** change detection, signals,
`@ngrx/signals` state, Tailwind v4. Talks to the FastAPI backend.

## Prerequisites

- Node 20.19+ or 22.12+ (matches Angular 20's engines)
- The backend running on `http://localhost:8000` (see `../backend/README.md`)

## Setup & run

```bash
cd frontend
npm install
npm start          # ng serve -> http://localhost:4200
```

`npm start` runs the dev server with a proxy: requests to `/api/*` are forwarded to
`http://localhost:8000` with the `/api` prefix stripped (see `proxy.conf.json`). Start the
backend first, or API calls will fail.

```bash
npm run build      # production build into dist/
```

## Architecture — `component → store → API service → HTTP`

```
src/app/
  core/                 # API_BASE, functional HTTP error interceptor
  shared/ui/            # hand-rolled primitives: icon, button (directive), card, sheet
  features/
    garments/
      data/             # garment-api.service.ts, garment.models.ts (+ DTO mappers)
      state/            # garment.store.ts  (@ngrx/signals signalStore + withEntities)
      components/       # garment-card, garment-form        (dumb, signal in/out)
      pages/            # garment-list.page, garment-detail.page  (smart containers)
    outfits/            # same shape
    activity/           # wear/wash logging (data + api only)
    dashboard/          # stats: data/, state/, pages/
  app.config.ts         # zoneless, router (+ input binding), httpClient + interceptor
  app.routes.ts         # lazy loadComponent routes
  app.ts                # shell: slim sidebar + <router-outlet>
```

- **Layers**: dumb components and pages only talk to **stores**; stores call **API
  services**; API services do HTTP + DTO mapping. (The fire-and-forget wear/wash logging
  via `ActivityApi` is the one intentional shortcut.)
- **DTO mapping**: the backend uses snake_case and serializes money (`Decimal`) as
  **strings**. Each `data/*.models.ts` defines a `*Dto` (wire format) plus a camelCase
  domain model with `number` money, and mapper functions. Nothing above `data/` sees the
  wire format.

## Styling

Tailwind v4. Design tokens live in `src/styles.css` under `@theme` ("warm editorial
neutral", terracotta accent). Change `--color-accent` to restyle the whole app. Utilities
like `bg-canvas`, `text-ink`, `border-line`, `bg-accent-soft` come from those tokens.

Components are hand-rolled on Tailwind (+ Angular CDK where behavior is needed). We did
**not** adopt Spartan UI — it was the original plan, but to avoid version-compat risk on
an unattended build we stuck to plain Tailwind/CDK. Spartan components can be layered in
later without disturbing this structure.

## Notes / TODO

- No real auth yet — the backend treats every request as a single demo user. When JWT is
  added, wire a token interceptor in `core/` + route guards + a login page.
- No unit tests yet (the generated `app.spec.ts` was removed when the shell changed).
- Possible next steps: edit/detail for outfits, richer charts, dark mode, a collapsible
  sidebar for small screens.
