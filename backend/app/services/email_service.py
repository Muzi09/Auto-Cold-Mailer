import logging
import asyncio
import os
import aiosmtplib
from email.message import EmailMessage
from typing import Optional, List, Dict, Any
from app.services.exceptions import SMTPSendingLimitError, is_smtp_limit_error

logger = logging.getLogger("auto_cold_mailer")


class EmailService:
    @staticmethod
    async def send_email_with_retry(
        to_email: str,
        subject: str,
        body: str,
        smtp_config: Dict[str, Any],
        attachments: Optional[List[str]] = None,
        max_retries: int = 3
    ) -> bool:
        """
        Sends real email using SMTP configuration provided per request batch.
        Retries up to max_retries with exponential backoff.
        """
        smtp_host = smtp_config.get("smtpHost")
        smtp_port = int(smtp_config.get("smtpPort", 465))
        smtp_user = smtp_config.get("smtpUser")
        smtp_password = smtp_config.get("smtpPassword")
        from_email = smtp_config.get("smtpFromEmail") or smtp_user
        from_name = smtp_config.get("smtpFromName") or "Applicant"
        use_tls = smtp_config.get("useTls", True)

        if not smtp_host or not smtp_user or not smtp_password:
            raise ValueError(
                "Incomplete SMTP credentials provided in request.")

        delay = 2.0
        for attempt in range(1, max_retries + 1):
            try:
                logger.info(
                    f"Attempting SMTP send to {to_email} via {smtp_host}:{smtp_port} (Attempt {attempt}/{max_retries})...")

                message = EmailMessage()
                message["From"] = f"{from_name} <{from_email}>"
                message["To"] = to_email
                message["Subject"] = subject
                message.set_content(body)

                # Attach PDF files if provided
                if attachments:
                    for filepath in attachments:
                        if os.path.exists(filepath):
                            with open(filepath, "rb") as f:
                                file_data = f.read()
                                file_name = os.path.basename(filepath)
                                message.add_attachment(
                                    file_data,
                                    maintype="application",
                                    subtype="pdf",
                                    filename=file_name
                                )

                await aiosmtplib.send(
                    message,
                    hostname=smtp_host,
                    port=smtp_port,
                    username=smtp_user,
                    password=smtp_password,
                    start_tls=use_tls,
                    timeout=20.0
                )
                logger.info(f"Successfully delivered email to {to_email}")
                return True

            except Exception as e:
                logger.warning(
                    f"Failed to send email to {to_email} on attempt {attempt}: {e}")
                if is_smtp_limit_error(e):
                    logger.error(
                        f"SMTP sending limit detected for {to_email}: {e}")
                    raise SMTPSendingLimitError(
                        f"SMTP email sending limit reached: {e}")
                if attempt < max_retries:
                    await asyncio.sleep(delay)
                    delay *= 2.0  # Exponential backoff: 2s, 4s, 8s
                else:
                    logger.error(
                        f"Exhausted all retries for sending email to {to_email}: {e}")
                    raise e
        return False


email_service = EmailService()
