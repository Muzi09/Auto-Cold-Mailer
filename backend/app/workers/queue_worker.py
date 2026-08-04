import logging
import asyncio
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from app.db.database import db
from app.services.gemini_service import gemini_service
from app.services.email_service import email_service
from app.services.ws_manager import ws_manager

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

    async def add_to_queue(
        self,
        applications: List[dict],
        smtp_config: Dict[str, Any],
        resume_path: Optional[str] = None,
        cover_letter_path: Optional[str] = None
    ):
        """
        Populates the sequential queue with applications and SMTP config.
        """
        self.total_count = len(applications)
        self.processed_count = 0
        self.smtp_config = smtp_config
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

                # Step 1: Generating Subject & Body via Gemini
                await db.update_application(app_id, {"status": "Generating Subject"})
                await ws_manager.broadcast({
                    "current": self.processed_count,
                    "total": self.total_count,
                    "companyName": company_name,
                    "jobTitle": job_title,
                    "status": "Generating Subject",
                    "applicationId": app_id
                })

                subject, email_body = await gemini_service.generate_email(
                    company_name=company_name,
                    job_title=job_title,
                    skills=skills,
                    job_description=job_description,
                    sender_name=sender_name
                )



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
