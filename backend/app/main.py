import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.database import db
from app.api import applications, ws, settings as settings_api

# Setup structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s"
)
logger = logging.getLogger("auto_cold_mailer")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing AI Cold Mailer FastAPI backend...")
    await db.connect()
    yield
    await db.close()
    logger.info("FastAPI backend shutdown complete.")

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(applications.router, prefix=settings.API_V1_STR)
app.include_router(settings_api.router, prefix=settings.API_V1_STR)
app.include_router(ws.router)

@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "status": "Online",
        "mongoConnected": db.is_connected,
        "docsUrl": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
