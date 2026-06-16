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

## Auth (current state)

Authentication is **stubbed**: every request acts as a single demo user, auto-created
on first use (`app/dependencies.py::get_current_user`). Real JWT auth (Keycloak/OIDC)
is on the roadmap; swapping it in only requires changing that one function.
