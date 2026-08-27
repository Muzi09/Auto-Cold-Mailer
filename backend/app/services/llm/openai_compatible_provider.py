import json
import logging
import httpx
from typing import Optional, Tuple, List
from app.services.llm.base_provider import BaseLLMProvider
from app.services.exceptions import LLMTokenLimitError

logger = logging.getLogger("auto_cold_mailer")

class OpenAICompatibleProvider(BaseLLMProvider):
    def __init__(
        self,
        api_key: str,
        provider_name: str,
        base_url: str,
        default_model: str,
        model: Optional[str] = None
    ):
        super().__init__(api_key, model or default_model)
        self.provider_name = provider_name
        self.base_url = base_url.rstrip("/")
        self.default_model = default_model
        self.fallback_models = self._get_fallback_models()

    def _get_fallback_models(self) -> List[str]:
        p = self.provider_name.lower()
        if "openai" in p:
            return ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo", "o3-mini", "o1-mini", "o1"]
        elif "groq" in p:
            return ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", "deepseek-r1-distill-llama-70b", "gemma2-9b-it"]
        elif "openrouter" in p:
            return ["meta-llama/llama-3.3-70b-instruct", "google/gemini-2.0-flash-001", "deepseek/deepseek-chat", "anthropic/claude-3.5-sonnet", "openai/gpt-4o-mini"]
        elif "together" in p:
            return ["meta-llama/Llama-3.3-70B-Instruct-Turbo", "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo", "mistralai/Mixtral-8x7B-Instruct-v0.1", "Qwen/Qwen2.5-72B-Instruct-Turbo"]
        elif "cerebras" in p:
            return ["llama3.3-70b", "llama3.1-8b", "llama-3.3-70b"]
        return [self.default_model]

    async def validate_connection(self) -> Tuple[bool, str, List[str]]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        if "openrouter" in self.base_url.lower():
            headers["HTTP-Referer"] = "https://autocoldmailer.com"
            headers["X-Title"] = "Auto Cold Mailer"

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                # 1. Try fetching models list from /models
                resp = await client.get(f"{self.base_url}/models", headers=headers)
                if resp.status_code == 200:
                    res_json = resp.json()
                    raw_items = []
                    if isinstance(res_json, dict):
                        raw_items = res_json.get("data") or res_json.get("models") or []
                    elif isinstance(res_json, list):
                        raw_items = res_json

                    models: List[str] = []
                    for item in raw_items:
                        if isinstance(item, dict):
                            mid = item.get("id") or item.get("name")
                            if mid and isinstance(mid, str):
                                models.append(mid.strip())
                        elif isinstance(item, str):
                            models.append(item.strip())

                    # Filter irrelevant non-chat models
                    p_lower = self.provider_name.lower()
                    if "openai" in p_lower:
                        excluded = ["tts", "whisper", "embedding", "moderation", "dall-e", "davinci", "babbage", "realtime", "audio"]
                        filtered = [m for m in models if not any(x in m.lower() for x in excluded)]
                        models = filtered if filtered else models
                    elif "groq" in p_lower:
                        excluded = ["whisper", "guard", "embedding"]
                        filtered = [m for m in models if not any(x in m.lower() for x in excluded)]
                        models = filtered if filtered else models

                    if not models:
                        models = self.fallback_models
                    return True, self.provider_name, models
                elif resp.status_code in [401, 403]:
                    return False, "Invalid API Key", []
                else:
                    # Fallback test with a lightweight chat completion ping if /models is unsupported
                    payload = {
                        "model": self.model or self.default_model,
                        "messages": [{"role": "user", "content": "ping"}],
                        "max_tokens": 1
                    }
                    ping_resp = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
                    if ping_resp.status_code == 200:
                        return True, self.provider_name, self.fallback_models
                    elif ping_resp.status_code in [401, 403]:
                        return False, "Invalid API Key", []
                    else:
                        err_text = ping_resp.text.lower()
                        if "invalid" in err_text or "api_key" in err_text or "auth" in err_text:
                            return False, "Invalid API Key", []
                        return False, f"Unable to connect to {self.provider_name}", []
            except httpx.TimeoutException:
                return False, "Provider Timeout", []
            except Exception as e:
                logger.error(f"{self.provider_name} connection error: {e}")
                return False, f"Unable to connect to {self.provider_name}", []

    async def generate_email(
        self,
        company_name: str,
        job_title: str,
        skills: str,
        job_description: str,
        sender_name: str
    ) -> Tuple[str, str]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        if "openrouter" in self.base_url.lower():
            headers["HTTP-Referer"] = "https://autocoldmailer.com"
            headers["X-Title"] = "Auto Cold Mailer"

        prompt = f"""
You are an expert career consultant and cold email copywriter.
Write a personalized cold application email for candidate "{sender_name}".

Company Name: {company_name}
Job Title: {job_title}
Key Skills: {skills}
Job Description Context: {job_description}

Return only valid JSON with exactly two keys: "subject" and "body".
The "body" value must be a properly formatted email using real newline characters (\n) to separate greeting, paragraphs, and closing.
Do not include any explanation, markdown, code fences, or extra text outside the JSON object.
"""

        payload = {
            "model": self.model or self.default_model,
            "messages": [
                {"role": "system", "content": "You are an AI assistant that outputs strictly valid JSON with keys 'subject' and 'body'."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "response_format": {"type": "json_object"}
        }

        async with httpx.AsyncClient(timeout=45.0) as client:
            try:
                resp = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
                if resp.status_code != 200:
                    # Retry without response_format if provider doesn't support json_object mode
                    if "response_format" in payload:
                        del payload["response_format"]
                    resp = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)

                if resp.status_code != 200:
                    err_txt = resp.text.lower()
                    if resp.status_code == 429 or "rate_limit" in err_txt or "quota" in err_txt or "token limit" in err_txt:
                        raise LLMTokenLimitError(f"{self.provider_name} token/rate limit reached (429): {resp.text[:200]}")
                    err_msg = f"{self.provider_name} API Error {resp.status_code}: {resp.text[:200]}"
                    logger.error(err_msg)
                    raise Exception(err_msg)

                res_json = resp.json()
                content = res_json["choices"][0]["message"]["content"].strip()
                if content.startswith("```json"):
                    content = content.replace("```json", "").replace("```", "").strip()
                elif content.startswith("```"):
                    content = content.replace("```", "").strip()

                parsed = json.loads(content)
                subject = parsed.get("subject", f"Application for {job_title} - {sender_name}")
                body = parsed.get("body", f"Dear Hiring Manager,\n\nI am writing to apply for the {job_title} role at {company_name}.\n\nBest regards,\n{sender_name}")
                return subject, body
            except Exception as e:
                logger.error(f"Error generating email with {self.provider_name} model {self.model}: {e}")
                raise Exception(f"{self.provider_name} Generation Failed: {str(e)}")
