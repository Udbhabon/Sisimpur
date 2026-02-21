"""
Supabase service for OTP-based email authentication.

Uses the anon/publishable key for:
  - sign_in_with_otp  → Supabase sends 6-digit OTP email
  - verify_otp        → validates token, returns Supabase session
"""

import logging
from django.conf import settings
from supabase import create_client, Client

logger = logging.getLogger(__name__)

_client: Client | None = None


def get_supabase() -> Client:
    """Return a cached Supabase client (initialised from settings)."""
    global _client
    if _client is None:
        url = settings.SUPABASE_URL
        key = settings.SUPABASE_KEY
        if not url or not key:
            raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set in .env")
        _client = create_client(url, key)
    return _client


def send_otp(email: str) -> tuple[bool, str]:
    """
    Ask Supabase to send a 6-digit OTP to *email*.

    Returns (True, "") on success or (False, error_message) on failure.
    """
    try:
        client = get_supabase()
        client.auth.sign_in_with_otp({"email": email, "options": {"should_create_user": True}})
        logger.info(f"Supabase OTP sent to {email}")
        return True, ""
    except Exception as exc:
        logger.error(f"Supabase send_otp failed for {email}: {exc}")
        return False, str(exc)


def verify_otp(email: str, token: str) -> tuple[bool, dict | None, str]:
    """
    Verify the 6-digit OTP that Supabase emailed.

    Returns:
        (True, session_dict, "")          on success
        (False, None, error_message)      on failure

    session_dict keys: access_token, refresh_token, user (dict with 'id', 'email')
    """
    try:
        client = get_supabase()
        response = client.auth.verify_otp({"email": email, "token": token, "type": "email"})
        session = response.session
        if session is None:
            return False, None, "OTP verification returned no session"
        session_dict = {
            "access_token": session.access_token,
            "refresh_token": session.refresh_token,
            "user": {
                "id": response.user.id,
                "email": response.user.email,
            },
        }
        logger.info(f"Supabase OTP verified for {email}")
        return True, session_dict, ""
    except Exception as exc:
        msg = str(exc)
        logger.error(f"Supabase verify_otp failed for {email}: {msg}")
        # Surface user-friendly messages for common errors
        if "Token has expired" in msg or "expired" in msg.lower():
            return False, None, "Verification code has expired. Please request a new one."
        if "Invalid" in msg or "invalid" in msg.lower():
            return False, None, "Invalid verification code."
        return False, None, msg
