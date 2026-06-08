# Wardrobe App — Backend

FastAPI + SQLAlchemy 2.0 + PostgreSQL. Layered architecture: **router → service →
repository → DB**. See the repo-root `CLAUDE.md` for the full architecture overview.

## Prerequisites

- Python 3.13
- Docker (for PostgreSQL)

## First-time setup

Run everything from the **`backend/`** directory (this folder).

```powershell
# 1. Virtual environment
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# 2. Environment file — then edit .env and set a real SECRET_KEY
Copy-Item .env.example .env

# 3. Start PostgreSQL (compose file is in the repo root, one level up)
docker compose -f ..\docker-compose.yml up -d postgres

# 4. Apply migrations
alembic upgrade head
```

`.env` must contain at least:

```
DATABASE_URL=postgresql://user:password@localhost:5433/wardrobe
SECRET_KEY=<any-non-empty-string-for-dev>
```

> The DB runs on host port **5433** (mapped from the container's 5432) — make sure
> `DATABASE_URL` uses `5433`.

## Running

```powershell
# From backend/  — NOT from backend/app/
python -m uvicorn app.main:app --reload
```

- Interactive API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

> **Common mistake:** running `uvicorn main:app` from inside `backend/app/` fails with
> `ModuleNotFoundError: No module named 'app'`. The code uses absolute imports
> (`from app...`), so `app` must be importable as a package — run from `backend/` and
> reference the app as `app.main:app`.
>
> If you configure a run config in your IDE, set the **working directory to `backend/`**
> and the module/target to `app.main:app`.

## Project layout

```
app/
  main.py          # FastAPI app, CORS, exception handlers, router registration
  config.py        # settings from .env (DATABASE_URL, SECRET_KEY, ...)
  database.py      # engine, SessionLocal, Base, get_db()
  dependencies.py  # DI wiring (Session -> repositories -> services) + CurrentUser
  exceptions.py    # domain errors (NotFoundError -> 404, ValidationError -> 400)
  models/          # SQLAlchemy models
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
| Wears    | `POST/GET /wears`, `DELETE /wears/{id}` (`?garment_id=` / `?outfit_id=` filters) |
| Washes   | `POST/GET /washes`, `DELETE /washes/{id}` (`?garment_id=` filter) |
| Stats    | `/stats/summary`, `/stats/spending-by-category`, `/stats/colors`, `/stats/most-worn`, `/stats/most-washed` |

## Database migrations

After changing a model, generate and apply a migration:

```powershell
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
```

## Auth (current state)

Authentication is **stubbed**: every request acts as a single demo user, auto-created
on first use (`app/dependencies.py::get_current_user`). Real JWT auth is on the roadmap;
swapping it in only requires changing that one function.
