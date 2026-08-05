import logging
import asyncio
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from app.db.database import db
from app.services.gemini_service import gemini_service
from app.services.email_service import email_service
from app.services.ws_manager import ws_manager
from app.services.email_validator_service import email_validator_service
from app.services.llm.factory import LLMProviderFactory

logger = logging.getLogger("auto_cold_mailer")

class QueueWorker:
    def __init__(self):
        self.queue: asyncio.Queue = asyncio.Queue()
        self.is_processing: bool = False
        self.current_app_id: Optional[int] = None
        self.total_count: int = 0
        self.processed_count: int = 0
        self.resume_path: Optional[str] = None
        self.cover_letter_path: Optional[str] = None
        self.smtp_config: Dict[str, Any] = {}
        self.llm_config: Optional[Dict[str, Any]] = None

    async def add_to_queue(
        self,
        applications: List[dict],
        smtp_config: Dict[str, Any],
        llm_config: Optional[Dict[str, Any]] = None,
        resume_path: Optional[str] = None,
        cover_letter_path: Optional[str] = None
    ):
        """
        Populates the sequential queue with applications, SMTP config, and LLM config.
        """
        self.total_count = len(applications)
        self.processed_count = 0
        self.smtp_config = smtp_config
        self.llm_config = llm_config
        self.resume_path = resume_path
        self.cover_letter_path = cover_letter_path
        
        for app in applications:
            await self.queue.put(app)

        if not self.is_processing:
            asyncio.create_task(self._process_queue())

    async def _process_queue(self):
        self.is_processing = True
        logger.info(f"Starting queue processing for {self.queue.qsize()} applications...")

        while not self.queue.empty():
            app = await self.queue.get()
            self.processed_count += 1
            app_id = app["applicationId"]
            self.current_app_id = app_id
            
            company_name = app.get("companyName", "Target Company")
            job_title = app.get("jobTitle", "Target Role")
            contact_email = app.get("contactEmail", "")
            skills = app.get("skills", "")
            job_description = app.get("jobDescription", "")

            try:
                sender_name = self.smtp_config.get("smtpFromName") or "Applicant"

                # Step 0: Validate Email Pipeline
                await db.update_application(app_id, {"status": "Validating Email"})
                await ws_manager.broadcast({
                    "current": self.processed_count,
                    "total": self.total_count,
                    "companyName": company_name,
                    "jobTitle": job_title,
                    "contactEmail": contact_email,
                    "status": "Validating Email",
                    "applicationId": app_id
                })

                is_valid, validation_reason = await email_validator_service.validate_email(contact_email)
                now_iso = datetime.now(timezone.utc).isoformat()
                validation_info = {
                    "isValid": is_valid,
                    "reason": validation_reason,
                    "validatedAt": now_iso
                }

                if not is_valid:
                    logger.warning(f"Validation failed for app {app_id} ({contact_email}): {validation_reason}")
                    await db.update_application(app_id, {
                        "status": "Invalid Email",
                        "error": validation_reason,
                        "emailValidation": validation_info
                    })
                    await ws_manager.broadcast({
                        "current": self.processed_count,
                        "total": self.total_count,
                        "companyName": company_name,
                        "jobTitle": job_title,
                        "contactEmail": contact_email,
                        "status": "Invalid Email",
                        "reason": validation_reason,
                        "error": validation_reason,
                        "applicationId": app_id,
                        "emailValidation": validation_info
                    })
                    continue

                # Email is valid, store emailValidation metadata
                await db.update_application(app_id, {
                    "emailValidation": validation_info
                })

                # Step 1: Generating Subject & Body via Configured LLM Provider
                await db.update_application(app_id, {"status": "Generating Subject"})
                await ws_manager.broadcast({
                    "current": self.processed_count,
                    "total": self.total_count,
                    "companyName": company_name,
                    "jobTitle": job_title,
                    "status": "Generating Subject",
                    "applicationId": app_id
                })

                if self.llm_config and self.llm_config.get("apiKey") and self.llm_config.get("provider"):
                    p_name = self.llm_config.get("provider", "OpenAI")
                    p_key = self.llm_config.get("apiKey", "")
                    p_model = self.llm_config.get("model")
                    logger.info(f"Generating email using provider '{p_name}' with model '{p_model}'...")
                    provider_inst = LLMProviderFactory.create_provider(p_name, p_key, p_model)
                    subject, email_body = await provider_inst.generate_email(
                        company_name=company_name,
                        job_title=job_title,
                        skills=skills,
                        job_description=job_description,
                        sender_name=sender_name
                    )
                else:
                    err_msg = "No LLM provider configuration supplied. Please configure an LLM Provider and API key in Settings."
                    logger.error(f"Cannot generate email for app {app_id}: {err_msg}")
                    await db.update_application(app_id, {
                        "status": "Failed",
                        "error": err_msg
                    })
                    await ws_manager.broadcast({
                        "current": self.processed_count,
                        "total": self.total_count,
                        "companyName": company_name,
                        "jobTitle": job_title,
                        "status": "Failed",
                        "error": err_msg,
                        "applicationId": app_id
                    })
                    continue



                await db.update_application(app_id, {
                    "subject": subject,
                    "emailBody": email_body,
                    "status": "Generating Email"
                })

                await ws_manager.broadcast({
                    "current": self.processed_count,
                    "total": self.total_count,
                    "companyName": company_name,
                    "jobTitle": job_title,
                    "status": "Generating Email",
                    "applicationId": app_id,
                    "subject": subject,
                    "emailBody": email_body
                })

                # Step 2: Sending Email with real SMTP
                await db.update_application(app_id, {"status": "Sending"})
                await ws_manager.broadcast({
                    "current": self.processed_count,
                    "total": self.total_count,
                    "companyName": company_name,
                    "jobTitle": job_title,
                    "status": "Sending",
                    "applicationId": app_id
                })

                attachments = []
                if self.resume_path:
                    attachments.append(self.resume_path)
                if self.cover_letter_path:
                    attachments.append(self.cover_letter_path)

                # Execute real SMTP send
                success = await email_service.send_email_with_retry(
                    to_email=contact_email,
                    subject=subject,
                    body=email_body,
                    smtp_config=self.smtp_config,
                    attachments=attachments,
                    max_retries=3
                )

                if success:
                    now_str = datetime.now(timezone.utc).isoformat()
                    await db.update_application(app_id, {
                        "status": "Sent",
                        "sentAt": now_str,
                        "error": ""
                    })
                    await ws_manager.broadcast({
                        "current": self.processed_count,
                        "total": self.total_count,
                        "companyName": company_name,
                        "jobTitle": job_title,
                        "status": "Sent",
                        "applicationId": app_id,
                        "sentAt": now_str
                    })

            except Exception as e:
                logger.error(f"Error processing application {app_id} for {company_name}: {e}")
                err_msg = str(e)
                await db.update_application(app_id, {
                    "status": "Failed",
                    "error": err_msg
                })
                await ws_manager.broadcast({
                    "current": self.processed_count,
                    "total": self.total_count,
                    "companyName": company_name,
                    "jobTitle": job_title,
                    "status": "Failed",
                    "error": err_msg,
                    "applicationId": app_id
                })
            
            finally:
                self.queue.task_done()
                await asyncio.sleep(0.3)

        self.is_processing = False
        self.current_app_id = None
        logger.info("Sequential queue processing completed.")
        
        await ws_manager.broadcast({
            "current": self.total_count,
            "total": self.total_count,
            "companyName": "All Applications",
            "jobTitle": "Batch Completed",
            "status": "Completed"
        })

queue_worker = QueueWorker()
