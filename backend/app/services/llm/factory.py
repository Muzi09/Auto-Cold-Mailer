import logging
from typing import Optional
from app.services.llm.base_provider import BaseLLMProvider
from app.services.llm.openai_compatible_provider import OpenAICompatibleProvider
from app.services.llm.gemini_provider import GeminiProvider

logger = logging.getLogger("auto_cold_mailer")

class LLMProviderFactory:
    @staticmethod
    def create_provider(provider: str, api_key: str, model: Optional[str] = None) -> BaseLLMProvider:
        p_clean = (provider or "").strip().lower()
        
        if p_clean in ["openai"]:
            return OpenAICompatibleProvider(
                api_key=api_key,
                provider_name="OpenAI",
                base_url="https://api.openai.com/v1",
                default_model="gpt-4o-mini",
                model=model
            )
        elif p_clean in ["gemini", "google gemini", "google"]:
            return GeminiProvider(api_key=api_key, model=model)
        elif p_clean in ["groq"]:
            return OpenAICompatibleProvider(
                api_key=api_key,
                provider_name="Groq",
                base_url="https://api.groq.com/openai/v1",
                default_model="llama-3.3-70b-versatile",
                model=model
            )
        elif p_clean in ["openrouter", "open router"]:
            return OpenAICompatibleProvider(
                api_key=api_key,
                provider_name="OpenRouter",
                base_url="https://openrouter.ai/api/v1",
                default_model="meta-llama/llama-3.3-70b-instruct",
                model=model
            )
        elif p_clean in ["together", "together ai", "togetherai"]:
            return OpenAICompatibleProvider(
                api_key=api_key,
                provider_name="Together AI",
                base_url="https://api.together.xyz/v1",
                default_model="meta-llama/Llama-3.3-70B-Instruct-Turbo",
                model=model
            )
        elif p_clean in ["cerebras"]:
            return OpenAICompatibleProvider(
                api_key=api_key,
                provider_name="Cerebras",
                base_url="https://api.cerebras.ai/v1",
                default_model="llama3.3-70b",
                model=model
            )
        else:
            logger.warning(f"Unknown provider '{provider}', using OpenAI-compatible behavior.")
            return OpenAICompatibleProvider(
                api_key=api_key,
                provider_name=provider.title() if provider else "OpenAI",
                base_url="https://api.openai.com/v1",
                default_model="gpt-4o-mini",
                model=model
            )
