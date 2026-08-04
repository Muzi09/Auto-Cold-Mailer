from fastapi import APIRouter
from app.config import settings
from app.models.application import SettingsUpdate

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("")
async def get_settings():
    """
    Returns environment status. Gemini key is taken strictly from backend .env.
    """
    return {
        "hasGeminiKey": bool(settings.GEMINI_API_KEY),
        "geminiModel": settings.GEMINI_MODEL,
        "hasOpenaiKey": bool(settings.GEMINI_API_KEY),
        "openaiModel": settings.GEMINI_MODEL
    }

@router.post("")
async def update_settings(payload: SettingsUpdate):
    if payload.geminiModel is not None:
        settings.GEMINI_MODEL = payload.geminiModel
    if payload.openaiModel is not None:
        settings.GEMINI_MODEL = payload.openaiModel
    return {"message": "Settings updated successfully"}

