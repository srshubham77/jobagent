import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from apply.api.applications import router as applications_router
from apply.api.drafts import router as drafts_router
from apply.api.submit import router as submit_router

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="JobAgent Apply Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(applications_router)
app.include_router(drafts_router)
app.include_router(submit_router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
