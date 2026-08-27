from abc import ABC, abstractmethod
from typing import Optional, Tuple, List

class BaseLLMProvider(ABC):
    def __init__(self, api_key: str, model: Optional[str] = None):
        self.api_key = api_key
        self.model = model

    @abstractmethod
    async def validate_connection(self) -> Tuple[bool, str, List[str]]:
        """
        Validates API key and connection, returning available models.
        Returns: (success: bool, error_or_provider: str, models: List[str])
        """
        pass

    @abstractmethod
    async def generate_email(
        self,
        company_name: str,
        job_title: str,
        skills: str,
        job_description: str,
        sender_name: str
    ) -> Tuple[str, str]:
        """
        Generates personalized email subject and body using the configured model.
        Returns: (subject, email_body)
        """
        pass
