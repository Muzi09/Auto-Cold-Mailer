import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str = "AI Cold Mailer Engine"
    API_V1_STR: str = "/api"
    
    # MongoDB Configuration (Supports MongoDB Atlas SRV connection strings)
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_USERNAME: Optional[str] = os.getenv("MONGODB_USERNAME", None)
    MONGODB_PASSWORD: Optional[str] = os.getenv("MONGODB_PASSWORD", None)
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "auto_cold_mailer")
    
    # Gemini Settings (Loaded strictly from .env)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "AQ.Ab8RN6Joh2hGaZUG_fNJ0442gWO9zXlPBSIIRJLAkwriCM0Jbg")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    
    @property
    def OPENAI_API_KEY(self) -> str:
        return self.GEMINI_API_KEY

    @property
    def OPENAI_MODEL(self) -> str:
        return self.GEMINI_MODEL

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

