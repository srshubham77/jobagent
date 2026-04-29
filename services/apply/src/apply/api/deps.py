import uuid
from typing import Annotated

from fastapi import Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from apply.db.session import get_db  # noqa: F401 — re-exported for router use

Db = Annotated[AsyncSession, "injected by FastAPI"]


async def current_user_id(x_user_id: Annotated[str | None, Header()] = None) -> uuid.UUID:
    if not x_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="X-User-Id header required")
    try:
        return uuid.UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid X-User-Id")
