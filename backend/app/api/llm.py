import logging
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.llm.factory import LLMProviderFactory

logger = logging.getLogger("auto_cold_mailer")

router = APIRouter(tags=["LLM Configuration"])

class LLMConnectRequest(BaseModel):
    provider: str
    apiKey: str

class LLMConnectResponse(BaseModel):
    success: bool
    provider: Optional[str] = ""
    defaultModel: Optional[str] = ""
    models: Optional[list[str]] = []
    error: Optional[str] = ""

@router.post("/llm/connect", response_model=LLMConnectResponse)
@router.post("/api/llm/connect", response_model=LLMConnectResponse)
async def connect_llm(payload: LLMConnectRequest):
    if not payload.provider or not payload.provider.strip():
        return LLMConnectResponse(success=False, error="Provider is required")

    if not payload.apiKey or not payload.apiKey.strip():
        return LLMConnectResponse(success=False, error="API key is required")

    provider_name = payload.provider.strip()
    api_key = payload.apiKey.strip()

    try:
        provider_inst = LLMProviderFactory.create_provider(provider_name, api_key)
        success, res_provider, models, default_model = await provider_inst.validate_connection()

        if success:
            return LLMConnectResponse(
                success=True,
                provider=res_provider,
                defaultModel=default_model,
                models=models
            )
        else:
            return LLMConnectResponse(
                success=False,
                error=res_provider or "Authentication Failed"
            )
    except Exception as e:
        logger.error(f"Error connecting to LLM provider {provider_name}: {e}")
        return LLMConnectResponse(
            success=False,
            error="Unable to connect"
        )
