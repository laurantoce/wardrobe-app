# Wardrobe App — Project Context

> This file is auto-loaded by Claude Code at the start of every session. It's the
> "context.md" — keep it current as the project evolves.

## What we're building

A wardrobe management app focused on outfit curation and AI-powered suggestions. A user
catalogs their clothes and outfits, then gets AI help to make better use of what they own:

- How much money have I spent on clothes? (total, by category, over time)
- Which colors do I wear most?
- What outfits do I have?
- **AI:** Suggest outfits from my wardrobe for a given occasion, season, or vibe

**Note:** Wear/wash tracking has been intentionally removed — the focus is on the wardrobe
as a catalog and on AI-driven outfit suggestions.

**Future:** AI integration (Gemini 2.5 Flash, free tier) for outfit suggestions and
insights. Image hosting via Cloudinary. Neither is wired up yet — keys are stubbed in config.

## Project goals (beyond the product itself)

This app is also a **portfolio project** meant to demonstrate:

1. **AI integration** — LLM-powered outfit suggestions and insights wired into a real
   production-quality backend. Provider: **Google Gemini 2.5 Flash** (free tier, `google-genai` SDK).
2. **DevOps / Kubernetes** — containerized workloads orchestrated with Kubernetes;
   CI/CD pipelines (lint → test → build image → deploy) using GitHub Actions or similar.
3. **Android Play Store deployment** — ship the app as a native Android app, most likely
   via a Capacitor wrapper over the Angular frontend (PWA-first, then packaged for Play
   Store). The clean API + future OIDC auth make this straightforward.

## Stack

| Layer    | Choice                                            |
|----------|---------------------------------------------------|
| Backend  | FastAPI + SQLAlchemy 2.0 (typed `Mapped`) + Pydantic v2 |
| DB       | PostgreSQL 18 (via Docker Compose, host port **5433**)  |
| Migrations | Alembic                                         |
| Frontend | Angular 20 (standalone, signals, zoneless) + @ngrx/signals + Tailwind v4 |
| Deploy   | Kubernetes + GitHub Actions CI/CD — **planned, not built yet** |
| Mobile   | Capacitor wrapper → Android Play Store — **planned, not built yet** |
| AI       | Free-tier LLM (Gemini Flash / Groq) for outfit suggestions — **planned, not built yet** |

## Repo layout

```
backend/
  app/
    main.py          # FastAPI app, CORS, exception handlers, router registration
    config.py        # pydantic-settings (reads backend/.env)
    database.py      # engine, SessionLocal, Base, get_db()
    dependencies.py  # DI wiring: Session -> repositories -> services; CurrentUser
    exceptions.py    # domain errors (NotFoundError, ValidationError)
    models/          # SQLAlchemy models: user, garment, outfit
    schemas/         # Pydantic request/response models
    repositories/    # persistence layer (one repo per aggregate + a generic base)
    services/        # business rules + orchestration
    routers/         # thin HTTP adapters: parse request -> call service -> return
  alembic/           # migrations
  Dockerfile
  requirements.txt
  .env.example
frontend/
  src/app/
    core/            # API base, functional HTTP error interceptor
    shared/ui/       # hand-rolled primitives: icon, button (directive), card, sheet
    features/
      garments/      # data/ (api + models + mappers), state/ (signalStore), components/, pages/
      outfits/       # same layered shape
      dashboard/     # stats: data/, state/, pages/
    app.config.ts    # providers: zoneless, router (+input binding), httpClient + interceptor
    app.routes.ts    # lazy loadComponent routes
    app.ts           # shell: slim sidebar + <router-outlet>
  proxy.conf.json         # dev (local): /api -> http://localhost:8000
  proxy.conf.docker.json  # dev (Docker): /api -> http://backend:8000
  Dockerfile
docker-compose.yml   # Postgres + backend + frontend
```

### Backend architecture (layered)

Request flow: **router → service → repository → DB**.

- **Routers** do HTTP only: dependency injection, status codes, response models. No
  business logic or DB access.
- **Services** (`app/services/`) hold business rules and cross-entity orchestration
  (e.g. validating that garments in an outfit belong to the user). They raise domain
  errors from `app/exceptions.py` — never `HTTPException`.
- **Repositories** (`app/repositories/`) own all persistence. `BaseRepository` provides
  generic `get` / `add` / `save` / `delete` / `exists_for_user`; each subclass adds
  query methods. Write methods commit (one operation = one unit of work).
- **`main.py`** registers exception handlers mapping `NotFoundError → 404`,
  `ValidationError → 400`, keeping the web framework out of the service layer.
- **`dependencies.py`** is the single composition root: `get_*_repository` and
  `get_*_service` providers plus `Annotated` aliases (`GarmentServiceDep`, `CurrentUser`,
  …). Routers import only those aliases, which makes services trivial to swap in tests.

### Frontend architecture (layered)

Data flow: **component → store (signals) → API service → HTTP**.

- **Angular 20**: standalone components, **zoneless** change detection, signals
  everywhere (`signal`/`computed`/`input()`/`output()`), `@if`/`@for` control flow,
  `inject()`, `OnPush`, lazy `loadComponent` routes, `withComponentInputBinding()`.
- **Data access** (`features/*/data/`): one API service per resource. The backend speaks
  **snake_case and serializes Decimals as strings**, so each `data/*.models.ts` defines a
  `*Dto` (wire) + domain model (camelCase, numbers) + mapper functions. API services
  return domain models; nothing above this layer sees snake_case.
- **State** (`features/*/state/`): `@ngrx/signals` `signalStore` per feature, with
  `withEntities` for garment/outfit collections, `withComputed` for derived values
  (totalValue), `withMethods` for commands. Components read store signals and call store
  methods — they never call API services directly.
- **Presentation**: smart page components (`pages/`) inject stores; dumb components
  (`components/`, `shared/ui/`) use signal `input()`/`output()` and hold no state.
- **UI**: Tailwind v4 with design tokens in `src/styles.css` under `@theme` ("warm
  editorial neutral", terracotta accent — change `--color-accent` to restyle). Components
  are hand-rolled on Tailwind + (where needed) Angular CDK. **Note:** we chose this over
  Spartan UI to avoid version-compat risk; Spartan components can be added piecemeal later.
- **Errors**: `core/error.interceptor.ts` normalizes backend `{detail}` errors into
  `{status, message}`; stores catch and expose an `error` signal.

## Data model

- **User** — owns everything. `email`, `password_hash`.
- **Garment** — a single item. `name`, `category`, `color_hex`, `color_name`
  (curated-palette name, drives color analytics), `brand`, `purchase_date`,
  `purchase_price`, `image_url`, `source_url`, `notes`.
- **Outfit** — a named set of garments (M2M via `outfit_garments`). `season`, `occasion`.

All child rows carry `user_id` (denormalized for simple per-user scoping/queries) and
cascade-delete with the user.

## Auth — IMPORTANT (current state)

Auth is now wired through **Keycloak** for local development:

- `docker-compose.yml` starts Keycloak at http://localhost:8080 and imports the
  `wardrobe` realm from `keycloak/realm-export.json`.
- The Angular app uses `angular-auth-oidc-client` with Authorization Code + PKCE. It has
  a login route, protected feature routes, and a bearer-token interceptor for `/api`.
- The FastAPI backend validates bearer JWTs against Keycloak's JWKS in
  `app/auth.py`; `app/dependencies.py::get_current_user` maps the token email claim to
  the local `users` table.
- `AUTH_MODE=demo` is still available as an explicit local fallback. In demo mode,
  `get_current_user` returns the original seeded demo user.

Local dev credentials imported by the realm:

- Keycloak admin: `admin` / `admin`
- App user: `demo@wardrobe.local` / `demo`

For production or Play Store builds, Keycloak must run behind HTTPS with real secrets and
proper redirect URIs for the deployed web origin and Capacitor Android callback.

## Running locally

### Option 1 — full Docker stack (recommended)

```bash
docker compose up --build
```

- Frontend → http://localhost:4200
- Backend API → http://localhost:8000/docs
- Keycloak admin → http://localhost:8080
- DB migrations run automatically on backend startup.
- Source is mounted as a volume so hot-reload works for the backend (uvicorn --reload).
  Frontend hot-reload via `--poll 2000` (slower than native but works on Docker/Windows).

To tear down and wipe the DB:
```bash
docker compose down -v
```

### Option 2 — local dev (faster frontend HMR)

```bash
# Terminal 1 — DB only
docker compose up -d postgres

# Terminal 2 — backend
cd backend
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt
# copy .env.example to .env and edit (DATABASE_URL must use port 5433)
alembic upgrade head
uvicorn app.main:app --reload   # run from backend/, NOT backend/app/

# Terminal 3 — frontend
cd frontend
npm install
npm start   # ng serve on http://localhost:4200, proxies /api -> :8000
```

## Conventions

- SQLAlchemy 2.0 style everywhere: `Mapped[...]` + `mapped_column`, `select()` queries
  (no legacy `Query`).
- Pydantic v2: `model_config = ConfigDict(from_attributes=True)` on read schemas.
- Routers use `APIRouter(prefix=..., tags=[...])` and depend only on the `Annotated`
  service/`CurrentUser` aliases from `app/dependencies.py`. Keep new business logic in a
  service and new queries in a repository — not in the router.
- Money is `Numeric(10,2)` / `Decimal`. Dates are `date`; timestamps are tz-aware `datetime`.
- After changing a model, generate a migration: `alembic revision --autogenerate -m "..."`.

## Roadmap / TODO

### AI integration (next focus)
- [ ] **AI outfit suggestions** — given occasion/season/vibe, suggest outfits from the
      user's wardrobe. Provider: **Gemini 2.5 Flash** (free tier, `google-genai` SDK,
      `GEMINI_API_KEY` in config/env).
- [ ] "Paste a product URL → AI fills category/color/name" (vision/extraction, reuses AI service)

### DevOps / Infrastructure
- [ ] **Kubernetes deployment** — convert Docker Compose to Kubernetes manifests (Deployments,
      Services, ConfigMaps, Secrets, Ingress). Target: self-hosted or managed cluster (GKE/EKS).
- [ ] **CI/CD pipeline** — GitHub Actions: lint → test → build image → push to registry →
      deploy to K8s. Demonstrate full GitOps flow.
- [ ] Tests — backend pytest; Angular specs — needed before CI is meaningful

### Mobile (Android Play Store)
- [ ] **Capacitor wrapper** — wrap the Angular PWA with Capacitor, build APK/AAB, publish
      to Google Play Store. Auth (OIDC) and clean API make this straightforward once Keycloak
      is in place.
- [ ] PWA baseline first (service worker, offline manifest) before Capacitor packaging

### Auth
- [ ] Production hardening for Keycloak (HTTPS, real secrets, external database,
      backup/restore, mobile redirect URI, Kubernetes manifests)

### Product features
- [ ] Cloudinary image upload for garments (frontend has `imageUrl`/`sourceUrl` fields ready)
- [ ] Outfit detail/edit page
- [ ] Richer charts (line charts), dark mode

### Done
- [x] Angular frontend — Dashboard / Items / Outfits
- [x] Temporal analytics — date-range presets + spending over-time charts
- [x] Smart color picker — curated palette (`color_name`) + color-family analytics
- [x] Mobile responsive — collapsible sidebar drawer + responsive layout
- [x] Full Docker Compose stack (postgres + backend + frontend, one command)
- [x] **Local Keycloak auth** (Docker service + imported realm; FastAPI JWT validation;
      Angular OIDC login, guard, and token interceptor)
