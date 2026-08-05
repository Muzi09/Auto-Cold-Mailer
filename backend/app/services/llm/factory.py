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
                fallback_models=["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo", "o1-mini", "o3-mini"],
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
                fallback_models=["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", "gemma2-9b-it", "qwen-2.5-32b"],
                model=model
            )
        elif p_clean in ["openrouter", "open router"]:
            return OpenAICompatibleProvider(
                api_key=api_key,
                provider_name="OpenRouter",
                base_url="https://openrouter.ai/api/v1",
                default_model="meta-llama/llama-3.3-70b-instruct",
                fallback_models=["meta-llama/llama-3.3-70b-instruct", "google/gemini-flash-1.5", "openai/gpt-4o-mini", "anthropic/claude-3.5-haiku", "deepseek/deepseek-r1"],
                model=model
            )
        elif p_clean in ["together", "together ai", "togetherai"]:
            return OpenAICompatibleProvider(
                api_key=api_key,
                provider_name="Together AI",
                base_url="https://api.together.xyz/v1",
                default_model="meta-llama/Llama-3.3-70B-Instruct-Turbo",
                fallback_models=["meta-llama/Llama-3.3-70B-Instruct-Turbo", "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo", "Qwen/Qwen2.5-72B-Instruct-Turbo"],
                model=model
            )
        elif p_clean in ["cerebras"]:
            return OpenAICompatibleProvider(
                api_key=api_key,
                provider_name="Cerebras",
                base_url="https://api.cerebras.ai/v1",
                default_model="llama3.3-70b",
                fallback_models=["llama3.3-70b", "llama3.1-8b"],
                model=model
            )
        else:
            logger.warning(f"Unknown provider '{provider}', falling back to OpenAI format.")
            return OpenAICompatibleProvider(
                api_key=api_key,
                provider_name=provider.title() if provider else "OpenAI",
                base_url="https://api.openai.com/v1",
                default_model="gpt-4o-mini",
                fallback_models=["gpt-4o-mini"],
                model=model
            )
