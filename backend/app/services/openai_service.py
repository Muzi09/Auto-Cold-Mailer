import logging
from typing import Tuple
from app.services.gemini_service import gemini_service

logger = logging.getLogger("auto_cold_mailer")


class OpenAIService:
    @staticmethod
    async def generate_email(
        company_name: str,
        job_title: str,
        skills: str,
        job_description: str,
        sender_name: str = "Applicant"
    ) -> Tuple[str, str]:
        """
        Delegates to GeminiService to generate personalized email via Gemini API.
        """
        return await gemini_service.generate_email(
            company_name=company_name,
            job_title=job_title,
            skills=skills,
            job_description=job_description,
            sender_name=sender_name
        )


openai_service = OpenAIService()


