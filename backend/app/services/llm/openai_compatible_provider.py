import json
import logging
import httpx
from typing import Optional, Tuple
from app.services.llm.base_provider import BaseLLMProvider

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

    async def validate_connection(self) -> Tuple[bool, str]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        if "openrouter" in self.base_url.lower():
            headers["HTTP-Referer"] = "https://autocoldmailer.com"
            headers["X-Title"] = "Auto Cold Mailer"

        payload = {
            "model": self.model or self.default_model,
            "messages": [{"role": "user", "content": "ping"}],
            "max_tokens": 1
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
                if resp.status_code == 200:
                    return True, self.provider_name
                elif resp.status_code in [401, 403]:
                    return False, "Invalid API Key"
                else:
                    err_text = resp.text.lower()
                    if "invalid" in err_text or "api_key" in err_text or "auth" in err_text:
                        return False, "Invalid API Key"
                    return False, f"Unable to connect to {self.provider_name}"
            except httpx.TimeoutException:
                return False, "Provider Timeout"
            except Exception as e:
                logger.error(f"{self.provider_name} connection error: {e}")
                return False, f"Unable to connect to {self.provider_name}"

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
