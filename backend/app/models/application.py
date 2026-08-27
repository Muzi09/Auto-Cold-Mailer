from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class ApplicationBase(BaseModel):
    applicationId: int
    companyName: str
    jobTitle: str
    skills: str = ""
    contactEmail: str
    jobDescription: str = ""


class ApplicationCreate(ApplicationBase):
    pass


class EmailValidationInfo(BaseModel):
    isValid: bool = True
    reason: str = ""
    validatedAt: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ApplicationInDB(ApplicationBase):
    id: Optional[str] = Field(None, alias="_id")
    subject: str = ""
    emailBody: str = ""
    status: str = "Pending"  # Pending, Validating Email, Generating Subject, Generating Email, Sending, Sent, Failed, Invalid Email, Retrying, Completed
    error: Optional[str] = ""
    emailValidation: Optional[EmailValidationInfo] = None
    retryCount: int = 0
    sentAt: Optional[str] = None
    createdAt: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updatedAt: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat())

    model_config = ConfigDict(populate_by_name=True)


class ApplicationResponse(ApplicationInDB):
    pass


class SMTPConfig(BaseModel):
    smtpHost: str
    smtpPort: int = 465
    smtpUser: str
    smtpPassword: str
    smtpFromEmail: Optional[str] = None
    smtpFromName: Optional[str] = "Applicant"
    useTls: bool = True


class LLMConfig(BaseModel):
    provider: str
    apiKey: str
    model: str


class ResumeData(BaseModel):
    fileName: Optional[str] = "resume.pdf"
    fileData: Optional[str] = None  # Base64 encoded string


class StartApplicationsRequest(BaseModel):
    applications: List[ApplicationCreate]
    smtpConfig: SMTPConfig
    llm: Optional[LLMConfig] = None
    resume: Optional[ResumeData] = None


class SettingsUpdate(BaseModel):
    openaiModel: Optional[str] = None
    geminiModel: Optional[str] = None
