"""Domain/application errors.

Services raise these instead of FastAPI's ``HTTPException`` so the business layer
stays independent of the web framework. ``main.py`` registers handlers that translate
them into HTTP responses.
"""


class DomainError(Exception):
    """Base class for application errors."""


class NotFoundError(DomainError):
    """A requested entity does not exist or is not owned by the current user."""


class ValidationError(DomainError):
    """A request is well-formed but violates a business rule."""
