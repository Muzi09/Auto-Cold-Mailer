import asyncio
import logging
import dns.resolver
from email_validator import validate_email as check_syntax, EmailNotValidError

logger = logging.getLogger("auto_cold_mailer")

class EmailValidatorService:
    @staticmethod
    async def validate_email(email: str) -> tuple[bool, str]:
        """
        Validates an email address through 3 stages:
        Stage 1: Required Field Validation (non-empty, non-null, non-whitespace)
        Stage 2: Email Syntax Validation (email-validator)
        Stage 3: Domain Verification (DNS MX records check)

        Returns: (is_valid: bool, reason: str)
        """
        # Stage 1: Required Field Validation
        if not email or not isinstance(email, str) or not email.strip():
            return False, "Missing Email"

        email = email.strip()

        # Stage 2: Email Syntax Validation
        try:
            validated = check_syntax(email, check_deliverability=False)
            domain = validated.domain
        except EmailNotValidError:
            return False, "Invalid Email Format"
        except Exception:
            return False, "Invalid Email Format"

        # Stage 3: Domain Verification (MX Records)
        try:
            resolver = dns.resolver.Resolver()
            resolver.timeout = 3.0
            resolver.lifetime = 3.0
            answers = await asyncio.to_thread(resolver.resolve, domain, 'MX')
            if not answers or len(answers) == 0:
                return False, "Domain Has No MX Record"
        except Exception as e:
            logger.debug(f"MX record lookup failed for domain {domain}: {e}")
            return False, "Domain Has No MX Record"

        return True, "Valid Email"

email_validator_service = EmailValidatorService()
