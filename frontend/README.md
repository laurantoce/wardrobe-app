# Wardrobe App — Frontend

Angular 22 SPA: standalone components, **zoneless** change detection, signals,
`@ngrx/signals` state, Tailwind v4. Talks to the FastAPI backend.

## Running (Docker — recommended)

From the **repo root**:

```bash
docker compose up --build
```

App: http://localhost:4200  
Uses `proxy.conf.docker.json` to proxy `/api` → `http://backend:8000`.
Keycloak: http://localhost:8080 (`demo@wardrobe.local` / `demo` for app login)
Garage public image endpoint: http://localhost:3902

## Running locally

Prerequisites: Node 20.19+ or 22.12+, backend running on `http://localhost:8000`.

```bash
cd frontend
npm install
npm start          # ng serve -> http://localhost:4200
```

`npm start` runs `ng serve` with `proxy.conf.json`, which proxies `/api/*` to
`http://localhost:8000` with the `/api` prefix stripped.

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
    dashboard/          # stats: data/, state/, pages/
  app.config.ts         # zoneless, router (+ input binding), httpClient + interceptor
  app.routes.ts         # lazy loadComponent routes
  app.ts                # shell: slim sidebar + <router-outlet>
```

- **Layers**: dumb components and pages only talk to **stores**; stores call **API
  services**; API services do HTTP + DTO mapping.
- **DTO mapping**: the backend uses snake_case and serializes money (`Decimal`) as
  **strings**. Each `data/*.models.ts` defines a `*Dto` (wire format) plus a camelCase
  domain model with `number` money, and mapper functions. Nothing above `data/` sees the
  wire format.

## Proxy configs

| File | Used by | Target |
|------|---------|--------|
| `proxy.conf.json` | `npm start` (local dev) | `http://localhost:8000` |
| `proxy.conf.docker.json` | Frontend Dockerfile | `http://backend:8000` |

## Styling

Tailwind v4. Design tokens live in `src/styles.css` under `@theme` ("warm editorial
neutral", terracotta accent). Change `--color-accent` to restyle the whole app. Utilities
like `bg-canvas`, `text-ink`, `border-line`, `bg-accent-soft` come from those tokens.

Components are hand-rolled on Tailwind (+ Angular CDK where behavior is needed).

## Auth

The app uses `angular-auth-oidc-client` with the local Keycloak realm imported by Docker
Compose:

- Authority: `http://localhost:8080/realms/wardrobe`
- Client: `wardrobe-frontend`
- Flow: Authorization Code + PKCE
- Login route: `/login`

Feature routes are guarded, and API requests to `/api` receive the bearer access token
through `core/auth.interceptor.ts`.

## Photo upload direction

The current garment form uploads a photo, stores it through the backend in Garage, and
uses `/ai/analyze-garment-photo` to pre-fill editable garment fields.

Upload UX: after selecting a photo, the form keeps the original image by default and
shows a Cutout option when the backend returns a background-removed PNG. Multi-garment
import is still planned as a review-grid flow that creates editable draft garments only
for accepted detections.

## Notes / TODO

- Capacitor Android packaging still needs mobile redirect URI testing against the native
  wrapper.
- Next: multi-garment import, outfit detail/edit page, richer charts, dark mode.
