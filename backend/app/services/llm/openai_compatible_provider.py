import json
import logging
import httpx
from typing import List, Tuple, Optional
from app.services.llm.base_provider import BaseLLMProvider

logger = logging.getLogger("auto_cold_mailer")

class OpenAICompatibleProvider(BaseLLMProvider):
    def __init__(
        self,
        api_key: str,
        provider_name: str,
        base_url: str,
        default_model: str,
        fallback_models: List[str],
        model: Optional[str] = None
    ):
        super().__init__(api_key, model or default_model)
        self.provider_name = provider_name
        self.base_url = base_url.rstrip("/")
        self.default_model = default_model
        self.fallback_models = fallback_models

    async def validate_connection(self) -> Tuple[bool, str, List[str], str]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        if "openrouter" in self.base_url.lower():
            headers["HTTP-Referer"] = "https://autocoldmailer.com"
            headers["X-Title"] = "Auto Cold Mailer"

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.get(f"{self.base_url}/models", headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    model_list = []
                    if "data" in data and isinstance(data["data"], list):
                        for item in data["data"]:
                            if isinstance(item, dict) and "id" in item:
                                model_list.append(item["id"])
                    elif isinstance(data, list):
                        for item in data:
                            if isinstance(item, dict) and "id" in item:
                                model_list.append(item["id"])
                            elif isinstance(item, str):
                                model_list.append(item)

                    model_list = list(dict.fromkeys(model_list))
                    if not model_list:
                        model_list = self.fallback_models
                    elif self.default_model not in model_list and self.fallback_models:
                        model_list = list(dict.fromkeys([self.default_model] + model_list))

                    return True, self.provider_name, model_list[:60], self.default_model
                elif resp.status_code in [401, 403]:
                    return False, "Invalid API Key", [], ""
                else:
                    return await self._test_completion_ping(client, headers)
            except httpx.TimeoutException:
                return False, "Provider Timeout", [], ""
            except Exception as e:
                logger.error(f"{self.provider_name} connection error: {e}")
                return False, f"Unable to connect to {self.provider_name}", [], ""

    async def _test_completion_ping(self, client: httpx.AsyncClient, headers: dict) -> Tuple[bool, str, List[str], str]:
        payload = {
            "model": self.default_model,
            "messages": [{"role": "user", "content": "hi"}],
            "max_tokens": 1
        }
        try:
            resp = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
            if resp.status_code == 200:
                return True, self.provider_name, self.fallback_models, self.default_model
            elif resp.status_code in [401, 403]:
                return False, "Invalid API Key", [], ""
            else:
                err_text = resp.text.lower()
                if "invalid" in err_text or "api_key" in err_text or "auth" in err_text:
                    return False, "Invalid API Key", [], ""
                return False, "Authentication Failed", [], ""
        except Exception:
            return False, "Authentication Failed", [], ""

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

Format your response strictly as valid JSON with keys "subject" and "body".
Do not include any explanation or extra text outside JSON.
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
