# Wardrobe App — Backend

FastAPI + SQLAlchemy 2.0 + PostgreSQL. Layered architecture: **router → service →
repository → DB**. See the repo-root `CLAUDE.md` for the full architecture overview.

## Running (Docker — recommended)

From the **repo root**:

```bash
docker compose up --build
```

API docs: http://localhost:8000/docs  
Health check: http://localhost:8000/health
Keycloak admin: http://localhost:8080 (`admin` / `admin`)
Garage S3 API: http://localhost:3900
Garage public image endpoint: http://localhost:3902

DB migrations run automatically on startup.

## Running locally (without Docker)

Prerequisites: Python 3.12+, Docker (for PostgreSQL).

Run everything from the **`backend/`** directory.

```powershell
# 1. Virtual environment
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# 2. Environment file
Copy-Item .env.example .env
# Edit .env — at minimum set DATABASE_URL and SECRET_KEY

# 3. Start PostgreSQL only
docker compose -f ..\docker-compose.yml up -d postgres

# 4. Apply migrations
alembic upgrade head

# 5. Run
python -m uvicorn app.main:app --reload
```

`.env` must contain at least:
```
DATABASE_URL=postgresql://user:password@localhost:5433/wardrobe
SECRET_KEY=<any-non-empty-string-for-dev>
AUTH_MODE=keycloak
KEYCLOAK_ISSUER=http://localhost:8080/realms/wardrobe
KEYCLOAK_JWKS_URL=http://localhost:8080/realms/wardrobe/protocol/openid-connect/certs
KEYCLOAK_AUDIENCE=wardrobe-api
GEMINI_API_KEY=<your-key-if-using-ai>
OBJECT_STORAGE_ENDPOINT=http://localhost:3900
OBJECT_STORAGE_PUBLIC_URL=http://localhost:3902
OBJECT_STORAGE_ACCESS_KEY=GKwardrobedev0000000000000000
OBJECT_STORAGE_SECRET_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
OBJECT_STORAGE_BUCKET=localhost
OBJECT_STORAGE_REGION=garage
BACKGROUND_REMOVAL_ENABLED=true
BACKGROUND_REMOVAL_MODEL=u2net
```

> The DB runs on host port **5433** (mapped from the container's 5432).

## Project layout

```
app/
  main.py          # FastAPI app, CORS, exception handlers, router registration
  config.py        # settings from .env (DATABASE_URL, SECRET_KEY, ...)
  database.py      # engine, SessionLocal, Base, get_db()
  dependencies.py  # DI wiring (Session -> repositories -> services) + CurrentUser
  exceptions.py    # domain errors (NotFoundError -> 404, ValidationError -> 400)
  models/          # SQLAlchemy models: user, garment, outfit
  schemas/         # Pydantic request/response models
  repositories/    # persistence layer
  services/        # business rules / use cases
  routers/         # thin HTTP endpoints
alembic/           # migrations
```

## API endpoints

| Resource | Routes |
|----------|--------|
| Garments | `POST/GET /garments`, `GET/PATCH/DELETE /garments/{id}` (`?category=` filter on list) |
| Outfits  | `POST/GET /outfits`, `GET/PATCH/DELETE /outfits/{id}` (`garment_ids` sets the items) |
| Stats    | `/stats/summary`, `/stats/spending-by-category`, `/stats/colors`, `/stats/spending-over-time` |

## Database migrations

After changing a model, generate and apply a migration:

```powershell
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
```

## Auth

Authentication uses Keycloak/OIDC by default. The backend validates bearer access tokens
against the Keycloak JWKS, verifies issuer/audience, then maps the token `email` claim to
the local `users` table.

Local Docker setup imports `keycloak/realm-export.json`:

- Realm: `wardrobe`
- SPA client: `wardrobe-frontend`
- API audience: `wardrobe-api`
- Demo app user: `demo@wardrobe.local` / `demo`

For backend-only development, set `AUTH_MODE=demo` to use the original seeded demo user
without requiring a bearer token.

## Object storage

Garment photos are stored in Garage, an S3-compatible object store. The Docker stack runs
Garage in single-node dev mode, creates the local bucket, and enables Garage's website
endpoint so image URLs can be loaded directly by the browser.

## Photo analysis and image processing direction

`POST /ai/analyze-garment-photo` uploads the original image to Garage, calls the Gemini
vision client, and returns editable garment metadata for the frontend form. Live provider
calls require `GEMINI_API_KEY`.

Background removal is implemented as an optional backend step with `rembg[cpu]` and the
configured `BACKGROUND_REMOVAL_MODEL`. The original image is kept, and the frontend can
choose between the original URL and the generated transparent PNG cutout when available.

Multi-garment import should be a second phase: detect garment regions first, segment/cut
out each accepted item, and let the frontend review candidates before creating garments.
