import logging
import json
import httpx
from typing import Tuple
from app.config import settings

logger = logging.getLogger("auto_cold_mailer")


class GeminiService:
    @staticmethod
    async def generate_email(
        company_name: str,
        job_title: str,
        skills: str,
        job_description: str,
        sender_name: str = "Applicant"
    ) -> Tuple[str, str]:
        """
        Generates personalized subject and email body using Google Gemini API.
        Strictly requires GEMINI_API_KEY to be present in backend environment (.env).
        """
        api_key = settings.GEMINI_API_KEY.strip('"').strip("'")

        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY is missing in backend .env file. Please add your Gemini API key.")

        model = settings.GEMINI_MODEL or "gemini-2.5-flash"
        clean_sender_name = sender_name.strip() or "Applicant"

        prompt = f"""You are an expert recruiter.
Generate a concise, professional, personalized job application email.

Input:
Company Name: {company_name}
Job Title: {job_title}
Skills: {skills}
Job Description: {job_description}
Sender / Candidate Display Name: {clean_sender_name}

STRICT REQUIREMENTS FOR GREETING, SIGN-OFF, AND FORMATTING:
1. GREETING: Start the email body with a generic greeting using the actual company name, specifically "Dear {company_name} Hiring Team," or "Dear {company_name} Recruitment Team,". Never use placeholders like "[Hiring Team / Name]" or "[Company Name]".
2. SENDER NAME: Use "{clean_sender_name}" as the candidate's name. In the subject line, use "Application for {job_title} - {clean_sender_name}". At the end of the email body, sign off with "Best regards,\\n{clean_sender_name}". Never use placeholders like "[Your Name]", "[Candidate Name]", or "Your Name".
3. COMPANY NAME: Mention the actual company name ("{company_name}") naturally in the body text.
4. JOB TITLE: Mention the actual job title ("{job_title}") naturally in the body text.
5. Reference key skills from the job description.
6. Be concise, professional, human, and direct.

Respond ONLY with valid JSON in this exact structure:
{{
  "subject": "Application for {job_title} - {clean_sender_name}",
  "body": "Dear {company_name} Hiring Team,\\n\\nI am writing to express my strong interest in the {job_title} position at {company_name}...\\n\\nBest regards,\\n{clean_sender_name}"
}}
"""

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.7
            }
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(url, json=payload)
            res.raise_for_status()
            data = res.json()

            try:
                content = data["candidates"][0]["content"]["parts"][0]["text"]
            except (KeyError, IndexError) as e:
                logger.error(f"Unexpected response structure from Gemini API: {data}")
                raise ValueError(f"Gemini API returned unexpected response format: {e}")

            parsed = json.loads(content)
            subject = parsed.get(
                "subject", f"Application for {job_title} - {clean_sender_name}")
            body = parsed.get("body", "")
            if not body:
                raise ValueError("Gemini API returned an empty email body.")

            # Post-processing sanitization to guarantee no leftover placeholders
            for placeholder in ["[Your Name]", "[Candidate Name]", "[Your Name Here]", "[Name]"]:
                subject = subject.replace(placeholder, clean_sender_name)
                body = body.replace(placeholder, clean_sender_name)

            for placeholder in ["[Hiring Team / Name]", "[Hiring Team]", "[Hiring Manager]", "[Company Name]", "[Company]"]:
                body = body.replace(placeholder, f"{company_name} Hiring Team")

            return subject, body


gemini_service = GeminiService()

