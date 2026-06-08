# Wardrobe App — Project Context

> This file is auto-loaded by Claude Code at the start of every session. It's the
> "context.md" — keep it current as the project evolves.

## What we're building

A wardrobe management app. A user catalogs their clothes and tracks usage so they can
answer questions like:

- How much money have I spent on clothes? (total, by category, over time)
- How many times have I worn / washed a given garment? (and cost-per-wear)
- Which colors do I wear most?
- What outfits do I have and how often do I wear them?

**Future:** AI integration (Anthropic) for outfit suggestions and insights. Image
hosting via Cloudinary. Neither is wired up yet — keys are stubbed in config.

## Stack

| Layer    | Choice                                            |
|----------|---------------------------------------------------|
| Backend  | FastAPI + SQLAlchemy 2.0 (typed `Mapped`) + Pydantic v2 |
| DB       | PostgreSQL 18 (via Docker Compose, host port **5433**)  |
| Migrations | Alembic                                         |
| Frontend | Angular 20 (standalone, signals, zoneless) + @ngrx/signals + Tailwind v4 |
| Deploy   | Dockerfile + CI/CD — **planned, not built yet**   |

## Repo layout

```
backend/
  app/
    main.py          # FastAPI app, CORS, exception handlers, router registration
    config.py        # pydantic-settings (reads backend/.env)
    database.py      # engine, SessionLocal, Base, get_db()
    dependencies.py  # DI wiring: Session -> repositories -> services; CurrentUser (STUBBED)
    exceptions.py    # domain errors (NotFoundError, ValidationError)
    models/          # SQLAlchemy models: user, garment, outfit, wear, wash
    schemas/         # Pydantic request/response models
    repositories/    # persistence layer (one repo per aggregate + a generic base)
    services/        # business rules + orchestration (the use-case layer)
    routers/         # thin HTTP adapters: parse request -> call service -> return
  alembic/           # migrations
  requirements.txt
  .env.example
frontend/
  src/app/
    core/            # API base, functional HTTP error interceptor
    shared/ui/       # hand-rolled primitives: icon, button (directive), card, sheet
    features/
      garments/      # data/ (api + models + mappers), state/ (signalStore), components/, pages/
      outfits/       # same layered shape
      activity/      # wear/wash logging (data/ + api)
      dashboard/     # stats: data/, state/, pages/
    app.config.ts    # providers: zoneless, router (+input binding), httpClient + interceptor
    app.routes.ts    # lazy loadComponent routes
    app.ts           # shell: slim sidebar + <router-outlet>
  proxy.conf.json    # dev: /api -> http://localhost:8000 (strips /api)
docker-compose.yml   # Postgres only, for now
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
  (totalValue, cost-per-wear inputs), `withMethods` for commands. Components read store
  signals and call store methods — they never call API services directly (the fire-and-
  forget wear/wash logging via `ActivityApi` is the one intentional exception).
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
- **Wear** — a usage event. Linked to a garment and/or an outfit, with `worn_date`.
- **Wash** — a wash event for a garment, with `washed_date` and `method`.

All child rows carry `user_id` (denormalized for simple per-user scoping/queries) and
cascade-delete with the user.

## Auth — IMPORTANT (current state)

Auth is **stubbed for development**. `app/dependencies.py::get_current_user` returns a
single seeded demo user (via `UserRepository.get_or_create_demo`, auto-created on first
request). Every service scopes its work to this user's id, so when we add real JWT auth
later we only change `get_current_user` — services and routers stay untouched.
`requirements.txt` already includes `python-jose` and `passlib` for that future work
(we'll also need to add a `bcrypt` backend then).

**Chosen direction for real auth: Keycloak (self-hosted via Docker, OIDC).** Plan: add a
`keycloak` service to compose; the FastAPI backend validates bearer JWTs against
Keycloak's JWKS (replacing the body of `get_current_user`); the Angular app uses
`angular-auth-oidc-client` (auth-code + PKCE) with a token HTTP interceptor + route
guards + a login page. Same login then serves a future mobile app. Not built yet — auth
stays stubbed until we implement it.

## Running locally

```bash
docker compose up -d postgres          # starts Postgres on localhost:5433
cd backend
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt
# create backend/.env from .env.example first (DATABASE_URL must use port 5433)
alembic upgrade head
uvicorn app.main:app --reload   # run from backend/, NOT backend/app/  -> http://localhost:8000/docs
```

Frontend (separate terminal; needs Node 20.19+/22.12+):

```bash
cd frontend
npm install
npm start            # ng serve on http://localhost:4200, proxies /api -> :8000
```

Start the backend first so the dev proxy has something to talk to. See `frontend/README.md`.

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

- [ ] **Keycloak auth** (Docker service + OIDC; replace `get_current_user`, add
      interceptor/guards/login in Angular) — chosen direction, not built yet
- [ ] Cloudinary image upload for garments (frontend has `imageUrl`/`sourceUrl` fields ready)
- [ ] Anthropic-powered outfit suggestions; also "paste a product URL → vision AI fills
      category/color/name" (more robust than HTML scraping; reuses Cloudinary + Anthropic)
- [x] Angular frontend — Dashboard / Items / Outfits + wear-wash logging
- [x] Temporal analytics — date-range presets + spending/wear/wash over-time charts
- [x] Smart color picker — curated palette (`color_name`) + color-family analytics
- [x] Mobile responsive — collapsible sidebar drawer + responsive layout
- [ ] Wardrobe planning (calendar of future-dated wears/outfits, packing lists)
- [ ] Frontend polish: edit/detail for outfits, richer (line) charts, dark mode
- [ ] "Build an app": PWA (cheapest) or Capacitor wrapper — clean API + OIDC make it easy
- [ ] Backend Dockerfile + add API service to compose
- [ ] CI/CD pipeline (lint, test, build image, deploy)
- [ ] Tests — none yet (backend pytest; frontend has no specs)
