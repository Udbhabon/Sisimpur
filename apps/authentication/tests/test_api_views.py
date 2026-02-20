"""
Comprehensive tests for the authentication REST API endpoints.
Covers all endpoints defined in apps/authentication/api_urls.py:
  POST /api/auth/send-otp/
  POST /api/auth/verify-otp/
  POST /api/auth/login/
  POST /api/auth/signup/
  POST /api/auth/logout/
  GET  /api/auth/me/
  GET  /api/auth/google/login/
  GET  /api/auth/google/callback/
"""

import hashlib
import json
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase, Client
from django.urls import reverse
from django.utils import timezone

User = get_user_model()


class SendOtpAPITest(TestCase):
    """Tests for POST /api/auth/send-otp/"""

    def setUp(self):
        self.client = Client()
        self.url = reverse("auth_api:send_otp")

    def _post(self, payload):
        return self.client.post(
            self.url, data=json.dumps(payload), content_type="application/json"
        )

    @patch("apps.authentication.email_service.EmailService.send_otp_email", return_value=True)
    def test_send_otp_valid_gmail(self, mock_email):
        """Valid Gmail address returns success."""
        with patch("apps.authentication.models.OTPRateLimit.check_rate_limit", return_value=(True, "OK")):
            response = self._post({"email": "testuser@gmail.com"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])

    def test_send_otp_non_gmail_rejected(self):
        """Non-Gmail address is rejected with an error."""
        response = self._post({"email": "user@yahoo.com"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data["success"])
        self.assertIn("Gmail", data["message"])

    def test_send_otp_missing_email(self):
        """Missing email field returns failure."""
        response = self._post({})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data["success"])

    def test_send_otp_already_registered_email(self):
        """Email already registered returns failure with helpful message."""
        User.objects.create_user(
            username="existing", email="existing@gmail.com", password="pass"
        )
        with patch("apps.authentication.models.OTPRateLimit.check_rate_limit", return_value=(True, "OK")):
            response = self._post({"email": "existing@gmail.com"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data["success"])
        self.assertIn("already registered", data["message"])

    def test_send_otp_wrong_http_method(self):
        """GET request to send-otp returns 405."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 405)


class VerifyOtpAPITest(TestCase):
    """Tests for POST /api/auth/verify-otp/"""

    def setUp(self):
        self.client = Client()
        self.url = reverse("auth_api:verify_otp")
        # Create a pending (inactive) user
        self.pending_user = User.objects.create_user(
            username="pendinguser",
            email="pendinguser@gmail.com",
            password="temp_password",
            is_active=False,
        )

    def _post(self, payload):
        return self.client.post(
            self.url, data=json.dumps(payload), content_type="application/json"
        )

    def test_verify_otp_no_pending_session(self):
        """Verify without a pending session returns failure."""
        response = self._post({"email": "pendinguser@gmail.com", "otp_code": "123456"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data["success"])
        self.assertIn("pending verification", data["message"])

    def test_verify_otp_invalid_code(self):
        """Submitting a wrong OTP code returns failure."""
        from apps.authentication.models import EmailOTP

        otp_instance = EmailOTP.generate_otp(
            self.pending_user, "pendinguser@gmail.com"
        )

        session = self.client.session
        session["pending_user_id"] = self.pending_user.id
        session["pending_email"] = "pendinguser@gmail.com"
        session.save()

        response = self._post({"email": "pendinguser@gmail.com", "otp_code": "000000"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data["success"])

    def test_verify_otp_correct_code(self):
        """Correct OTP returns success and activates the user."""
        from apps.authentication.models import EmailOTP

        otp_instance = EmailOTP.generate_otp(
            self.pending_user, "pendinguser@gmail.com"
        )
        plain_otp = otp_instance._plain_otp

        session = self.client.session
        session["pending_user_id"] = self.pending_user.id
        session["pending_email"] = "pendinguser@gmail.com"
        session.save()

        response = self._post({"email": "pendinguser@gmail.com", "otp_code": plain_otp})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])

        # After OTP verification, the user should be activated
        self.pending_user.refresh_from_db()
        self.assertTrue(self.pending_user.is_active)

    def test_verify_otp_wrong_http_method(self):
        """GET request to verify-otp returns 405."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 405)


class LoginAPITest(TestCase):
    """Tests for POST /api/auth/login/"""

    def setUp(self):
        self.client = Client()
        self.url = reverse("auth_api:login")
        self.user = User.objects.create_user(
            username="loginuser",
            email="loginuser@gmail.com",
            password="SecurePass123!",
            is_active=True,
        )

    def _post(self, payload):
        return self.client.post(
            self.url, data=json.dumps(payload), content_type="application/json"
        )

    def test_login_valid_credentials(self):
        """Valid credentials log the user in and return success JSON."""
        response = self._post({"email": "loginuser@gmail.com", "password": "SecurePass123!"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("Welcome back", data["message"])

    def test_login_invalid_password(self):
        """Wrong password returns 401 with failure JSON."""
        response = self._post({"email": "loginuser@gmail.com", "password": "WrongPassword!"})
        self.assertEqual(response.status_code, 401)
        data = response.json()
        self.assertFalse(data["success"])
        self.assertIn("Invalid email or password", data["message"])

    def test_login_nonexistent_email(self):
        """Unknown email returns 401 with failure JSON."""
        response = self._post({"email": "nobody@gmail.com", "password": "SomePass123!"})
        self.assertEqual(response.status_code, 401)
        data = response.json()
        self.assertFalse(data["success"])

    def test_login_non_gmail_rejected(self):
        """Non-Gmail email is rejected with 400."""
        response = self._post({"email": "user@hotmail.com", "password": "SomePass123!"})
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertFalse(data["success"])
        self.assertIn("Gmail", data["message"])

    def test_login_missing_fields(self):
        """Missing email or password returns 400."""
        response = self._post({"email": "loginuser@gmail.com"})
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertFalse(data["success"])

    def test_login_disabled_account(self):
        """Disabled user account returns 403."""
        self.user.is_active = False
        self.user.save()
        response = self._post({"email": "loginuser@gmail.com", "password": "SecurePass123!"})
        self.assertEqual(response.status_code, 403)
        data = response.json()
        self.assertFalse(data["success"])
        self.assertIn("disabled", data["message"])

    def test_login_wrong_http_method(self):
        """GET request to login returns 405."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 405)

    def test_login_sets_session(self):
        """Successful login sets an authenticated session."""
        self._post({"email": "loginuser@gmail.com", "password": "SecurePass123!"})
        me_url = reverse("auth_api:me")
        response = self.client.get(me_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["email"], "loginuser@gmail.com")


class SignupAPITest(TestCase):
    """Tests for POST /api/auth/signup/"""

    def setUp(self):
        self.client = Client()
        self.url = reverse("auth_api:signup")
        # Create an active pending user (simulates post-OTP-verification state)
        self.pending_user = User.objects.create_user(
            username="signupuser",
            email="signupuser@gmail.com",
            password="temp_password",
            is_active=True,  # OTP verification activates the user
        )

    def _post(self, payload):
        return self.client.post(
            self.url, data=json.dumps(payload), content_type="application/json"
        )

    def _set_verified_session(self):
        session = self.client.session
        session["pending_user_id"] = self.pending_user.id
        session["pending_email"] = "signupuser@gmail.com"
        session.save()

    def test_signup_without_session(self):
        """Signup without a pending session returns 400."""
        response = self._post(
            {
                "email": "signupuser@gmail.com",
                "password": "StrongPass123!",
                "password_confirm": "StrongPass123!",
            }
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertFalse(data["success"])

    def test_signup_with_invalid_session(self):
        """Signup with mismatched session email returns 400."""
        session = self.client.session
        session["pending_user_id"] = self.pending_user.id
        session["pending_email"] = "different@gmail.com"
        session.save()

        response = self._post(
            {
                "email": "signupuser@gmail.com",
                "password": "StrongPass123!",
                "password_confirm": "StrongPass123!",
            }
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertFalse(data["success"])

    def test_signup_passwords_mismatch(self):
        """Mismatched passwords return 400."""
        self._set_verified_session()
        response = self._post(
            {
                "email": "signupuser@gmail.com",
                "password": "StrongPass123!",
                "password_confirm": "DifferentPass456!",
            }
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertFalse(data["success"])
        self.assertIn("do not match", data["message"])

    def test_signup_success(self):
        """Valid signup activates user, logs them in, returns success JSON."""
        self._set_verified_session()

        response = self._post(
            {
                "email": "signupuser@gmail.com",
                "password": "StrongPass123!",
                "password_confirm": "StrongPass123!",
            }
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("Welcome", data["message"])

        # User should now be active
        self.pending_user.refresh_from_db()
        self.assertTrue(self.pending_user.is_active)

    def test_signup_clears_session(self):
        """Successful signup clears pending session keys."""
        self._set_verified_session()

        self._post(
            {
                "email": "signupuser@gmail.com",
                "password": "StrongPass123!",
                "password_confirm": "StrongPass123!",
            }
        )

        session = self.client.session
        self.assertIsNone(session.get("pending_user_id"))
        self.assertIsNone(session.get("pending_email"))

    def test_signup_wrong_http_method(self):
        """GET request to signup returns 405."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 405)


class LogoutAPITest(TestCase):
    """Tests for POST /api/auth/logout/"""

    def setUp(self):
        self.client = Client()
        self.url = reverse("auth_api:logout")
        self.user = User.objects.create_user(
            username="logoutuser",
            email="logoutuser@gmail.com",
            password="SecurePass123!",
        )

    def test_logout_authenticated_user(self):
        """Authenticated user can log out and receives success JSON."""
        self.client.force_login(self.user)
        response = self.client.post(self.url, content_type="application/json")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("Goodbye", data["message"])

    def test_logout_unauthenticated_returns_403(self):
        """Unauthenticated request to logout returns 403."""
        response = self.client.post(self.url, content_type="application/json")
        self.assertEqual(response.status_code, 403)

    def test_logout_clears_session(self):
        """After logout, the /me/ endpoint returns 403."""
        self.client.force_login(self.user)
        self.client.post(self.url, content_type="application/json")

        me_url = reverse("auth_api:me")
        response = self.client.get(me_url)
        self.assertEqual(response.status_code, 403)

    def test_logout_wrong_http_method(self):
        """GET request to logout returns 405."""
        self.client.force_login(self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 405)


class MeAPITest(TestCase):
    """Tests for GET /api/auth/me/"""

    def setUp(self):
        self.client = Client()
        self.url = reverse("auth_api:me")
        self.user = User.objects.create_user(
            username="meuser",
            email="meuser@gmail.com",
            password="SecurePass123!",
            first_name="Me",
            last_name="User",
        )

    def test_me_authenticated(self):
        """Authenticated request returns user data."""
        self.client.force_login(self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["email"], "meuser@gmail.com")
        self.assertEqual(data["username"], "meuser")
        self.assertEqual(data["first_name"], "Me")
        self.assertEqual(data["last_name"], "User")
        self.assertIn("full_name", data)
        self.assertIn("id", data)

    def test_me_unauthenticated_returns_403(self):
        """Unauthenticated request to /me/ returns 403."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 403)

    def test_me_wrong_http_method(self):
        """POST request to /me/ returns 405."""
        self.client.force_login(self.user)
        response = self.client.post(self.url, content_type="application/json")
        self.assertEqual(response.status_code, 405)


class GoogleLoginAPITest(TestCase):
    """Tests for GET /api/auth/google/login/"""

    def setUp(self):
        self.client = Client()
        self.url = reverse("auth_api:google_login")

    def test_google_login_with_invalid_credentials_redirects(self):
        """Google login attempt (with no real credentials) redirects or redirects to sign-in."""
        response = self.client.get(self.url)
        # Should be a redirect (either to Google or back to sign-in on error)
        self.assertIn(response.status_code, [302, 301])

    def test_google_login_wrong_http_method(self):
        """POST request to google/login returns 405."""
        response = self.client.post(self.url, content_type="application/json")
        self.assertEqual(response.status_code, 405)


class GoogleCallbackAPITest(TestCase):
    """Tests for GET /api/auth/google/callback/"""

    def setUp(self):
        self.client = Client()
        self.url = reverse("auth_api:google_callback")

    def test_google_callback_missing_state_redirects(self):
        """Callback with no state parameter redirects back to sign-in."""
        response = self.client.get(self.url)
        self.assertIn(response.status_code, [302, 301])

    def test_google_callback_invalid_state_redirects(self):
        """Callback with an invalid state redirects back to sign-in."""
        response = self.client.get(self.url, {"state": "invalid_state", "code": "fake_code"})
        self.assertIn(response.status_code, [302, 301])

    def test_google_callback_wrong_http_method(self):
        """POST request to google/callback returns 405."""
        response = self.client.post(self.url, content_type="application/json")
        self.assertEqual(response.status_code, 405)
