import aiosmtplib

class LLMTokenLimitError(Exception):
    """Raised when LLM API returns token limit, rate limit, or quota exceeded error."""
    pass

class SMTPSendingLimitError(Exception):
    """Raised when SMTP server returns sending limit, daily quota, or rate limit error."""
    pass

def is_llm_token_limit_error(e: Exception) -> bool:
    """
    Checks if an exception represents an LLM token limit, rate limit, or quota exceeded error.
    """
    if isinstance(e, LLMTokenLimitError):
        return True
    
    err_str = str(e).lower()
    keywords = [
        "token limit",
        "rate limit",
        "quota exceeded",
        "insufficient_quota",
        "resource_exhausted",
        "rate_limit_exceeded",
        "tokens per minute",
        "requests per minute",
        "tpm limit",
        "rpm limit",
        "context_length_exceeded",
        "maximum context length",
        "out of tokens",
        "too many requests",
        "429"
    ]
    return any(kw in err_str for kw in keywords)

def is_smtp_limit_error(e: Exception) -> bool:
    """
    Checks if an exception represents an SMTP email sending limit or rate limit error.
    """
    if isinstance(e, SMTPSendingLimitError):
        return True

    # Check aiosmtplib specific response exceptions
    if isinstance(e, (aiosmtplib.SMTPResponseException, aiosmtplib.SMTPDataError, aiosmtplib.SMTPRecipientRefused)):
        code = getattr(e, 'code', None)
        message = str(getattr(e, 'message', str(e))).lower()
        
        # Standard SMTP status codes associated with rejection, limit, or quota
        if code in [421, 450, 451, 452, 550, 552, 554]:
            limit_keywords = [
                "limit", "quota", "rate", "too many", "exceeded", 
                "daily", "hourly", "threshold", "max", "rejected", "recipient"
            ]
            if any(kw in message for kw in limit_keywords):
                return True

    err_str = str(e).lower()
    keywords = [
        "sending limit",
        "daily limit",
        "hourly limit",
        "quota exceeded",
        "rate limit",
        "too many emails",
        "too many messages",
        "too many recipients",
        "too many",
        "limit exceeded",
        "limit reached",
        "user has exceeded",
        "recipient limit",
        "sending quota",
        "daily sending",
        "email limit",
        "daily email",
        "message limit"
    ]
    return any(kw in err_str for kw in keywords)
