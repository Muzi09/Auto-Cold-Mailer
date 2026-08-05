import json
import logging
import httpx
from typing import List, Tuple, Optional
from app.services.llm.base_provider import BaseLLMProvider

logger = logging.getLogger("auto_cold_mailer")

class GeminiProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model: Optional[str] = None):
        super().__init__(api_key, model or "gemini-1.5-flash")
        self.default_model = "gemini-1.5-flash"
        self.fallback_models = [
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-1.5-pro"
        ]

    async def validate_connection(self) -> Tuple[bool, str, List[str], str]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models?key={self.api_key}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    models = []
                    if "models" in data:
                        for m in data["models"]:
                            name = m.get("name", "").replace("models/", "")
                            if "gemini" in name:
                                models.append(name)
                    if not models:
                        models = self.fallback_models
                    else:
                        models = list(dict.fromkeys(models))
                    return True, "Gemini", models[:50], self.default_model
                elif resp.status_code in [400, 401, 403]:
                    return False, "Invalid API Key", [], ""
                else:
                    return False, "Unable to connect to Gemini", [], ""
            except httpx.TimeoutException:
                return False, "Provider Timeout", [], ""
            except Exception as e:
                logger.error(f"Gemini connection error: {e}")
                return False, "Authentication Failed", [], ""

    async def generate_email(
        self,
        company_name: str,
        job_title: str,
        skills: str,
        job_description: str,
        sender_name: str
    ) -> Tuple[str, str]:
        model_name = self.model or self.default_model
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.api_key}"
        prompt = f"""
You are an expert cold email writer.
Write a personalized cold email for candidate "{sender_name}".

Company: {company_name}
Role: {job_title}
Key Skills: {skills}
Job Description: {job_description}

Return your response strictly as valid JSON format with keys "subject" and "body".
Do not include any explanation or extra text outside JSON.
"""
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.7,
                "responseMimeType": "application/json"
            }
        }
        async with httpx.AsyncClient(timeout=45.0) as client:
            try:
                resp = await client.post(url, json=payload)
                if resp.status_code != 200:
                    if "responseMimeType" in payload.get("generationConfig", {}):
                        del payload["generationConfig"]["responseMimeType"]
                    resp = await client.post(url, json=payload)

                if resp.status_code != 200:
                    err_msg = f"Gemini API error {resp.status_code}: {resp.text[:200]}"
                    logger.error(err_msg)
                    raise Exception(err_msg)

                res_json = resp.json()
                text = res_json["candidates"][0]["content"]["parts"][0]["text"].strip()
                if text.startswith("```json"):
                    text = text.replace("```json", "").replace("```", "").strip()
                elif text.startswith("```"):
                    text = text.replace("```", "").strip()

                parsed = json.loads(text)
                subject = parsed.get("subject", f"Application for {job_title} - {sender_name}")
                body = parsed.get("body", f"Dear Hiring Manager,\n\nI am writing to express my interest in {job_title} at {company_name}.\n\nBest regards,\n{sender_name}")
                return subject, body
            except Exception as e:
                logger.error(f"Gemini generation error with model {self.model}: {e}")
                raise Exception(f"Gemini Generation Failed: {str(e)}")
