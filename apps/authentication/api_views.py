from django.contrib.auth import (
    authenticate as auth_authenticate,
    get_user_model,
    login as auth_login,
    logout as auth_logout,
)
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from . import views as auth_views
from .email_service import EmailService

from apps.utils import send_normal_signin_webhook, send_user_signup_webhook

User = get_user_model()


# ---------------------------------------------------------------------------
# Auth – JSON / AJAX endpoints
# ---------------------------------------------------------------------------

@swagger_auto_schema(
    method="post",
    tags=["Auth - OTP Verification"],
    operation_summary="Send OTP",
    operation_description="Send an OTP verification code to the given Gmail address for signup.",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=["email"],
        properties={
            "email": openapi.Schema(type=openapi.TYPE_STRING, description="Gmail address"),
        },
    ),
    responses={
        200: openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "success": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                "message": openapi.Schema(type=openapi.TYPE_STRING),
            },
        ),
    },
)
@api_view(["POST"])
@permission_classes([AllowAny])
@parser_classes([JSONParser])
def send_otp(request):
    return auth_views.send_otp_ajax(request._request)


@swagger_auto_schema(
    method="post",
    tags=["Auth - OTP Verification"],
    operation_summary="Verify OTP",
    operation_description="Verify the OTP code sent to the user's email during signup.",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=["email", "otp_code"],
        properties={
            "email": openapi.Schema(type=openapi.TYPE_STRING, description="Gmail address"),
            "otp_code": openapi.Schema(type=openapi.TYPE_STRING, description="6-digit OTP code"),
        },
    ),
    responses={
        200: openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "success": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                "message": openapi.Schema(type=openapi.TYPE_STRING),
            },
        ),
    },
)
@api_view(["POST"])
@permission_classes([AllowAny])
@parser_classes([JSONParser])
def verify_otp(request):
    return auth_views.verify_otp_ajax(request._request)


@swagger_auto_schema(
    method="post",
    tags=["Auth - Account"],
    operation_summary="Login",
    operation_description="Authenticate with email and password. Returns session cookie.",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=["email", "password"],
        properties={
            "email": openapi.Schema(type=openapi.TYPE_STRING, description="Gmail address"),
            "password": openapi.Schema(type=openapi.TYPE_STRING, description="Account password"),
        },
    ),
    responses={
        200: openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "success": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                "message": openapi.Schema(type=openapi.TYPE_STRING),
            },
        ),
        401: "Invalid credentials",
    },
)
@api_view(["POST"])
@permission_classes([AllowAny])
@parser_classes([JSONParser])
def login(request):
    """Authenticate with email and password, set session cookie, return JSON."""
    email = request.data.get("email", "").strip()
    password = request.data.get("password", "")

    if not email or not password:
        return Response({"success": False, "message": "Email and password are required."}, status=400)

    if not (email.endswith("@gmail.com") or email.endswith("@googlemail.com")):
        return Response(
            {"success": False, "message": "Only Gmail addresses (@gmail.com or @googlemail.com) are allowed."},
            status=400,
        )

    try:
        user_obj = User.objects.get(email=email)
        # Check for disabled accounts before Django's backend filters them out
        if not user_obj.is_active and user_obj.check_password(password):
            return Response({"success": False, "message": "Your account has been disabled."}, status=403)
        user = auth_authenticate(request._request, username=user_obj.username, password=password)
    except User.DoesNotExist:
        user = None

    if user is not None:
        auth_login(request._request, user)
        try:
            send_normal_signin_webhook(user)
        except Exception:
            pass
        return Response({"success": True, "message": f"Welcome back, {user.get_full_name() or user.email}!"})

    return Response({"success": False, "message": "Invalid email or password."}, status=401)


@swagger_auto_schema(
    method="post",
    tags=["Auth - Account"],
    operation_summary="Signup",
    operation_description="Complete signup after OTP verification. Sets password and activates account.",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=["email", "password", "password_confirm"],
        properties={
            "email": openapi.Schema(type=openapi.TYPE_STRING),
            "password": openapi.Schema(type=openapi.TYPE_STRING),
            "password_confirm": openapi.Schema(type=openapi.TYPE_STRING),
        },
    ),
    responses={
        200: openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "success": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                "message": openapi.Schema(type=openapi.TYPE_STRING),
            },
        ),
        400: "Validation error",
    },
)
@api_view(["POST"])
@permission_classes([AllowAny])
@parser_classes([JSONParser])
def signup(request):
    """Complete signup after OTP verification: set password, activate account, log in."""
    email = request.data.get("email", "").strip()
    password = request.data.get("password", "")
    password_confirm = request.data.get("password_confirm", "")

    pending_user_id = request._request.session.get("pending_user_id")
    pending_email = request._request.session.get("pending_email")

    if not pending_user_id or pending_email != email:
        return Response(
            {"success": False, "message": "Invalid verification session. Please start over."},
            status=400,
        )

    errors = []
    if not email:
        errors.append("Email is required.")
    elif not (email.endswith("@gmail.com") or email.endswith("@googlemail.com")):
        errors.append("Only Gmail addresses (@gmail.com or @googlemail.com) are allowed.")
    if not password:
        errors.append("Password is required.")
    elif password != password_confirm:
        errors.append("Passwords do not match.")
    if password:
        try:
            validate_password(password)
        except ValidationError as e:
            errors.extend(e.messages)

    if errors:
        return Response({"success": False, "message": " ".join(errors)}, status=400)

    try:
        # After OTP verification, the user is activated (is_active=True)
        user = User.objects.get(id=pending_user_id, email=email, is_active=True)
        user.set_password(password)
        user.save()

        request._request.session.pop("pending_user_id", None)
        request._request.session.pop("pending_email", None)

        try:
            EmailService.send_welcome_email(user, email)
        except Exception:
            pass

        auth_login(request._request, user)

        try:
            send_user_signup_webhook(user)
        except Exception:
            pass

        return Response(
            {"success": True, "message": f"Welcome to Sisimpur, {user.email}! Your account has been created successfully."}
        )
    except User.DoesNotExist:
        return Response(
            {"success": False, "message": "Invalid verification session. Please start over."},
            status=400,
        )
    except Exception as e:
        return Response({"success": False, "message": f"An error occurred: {str(e)}"}, status=500)


@swagger_auto_schema(
    method="post",
    tags=["Auth - Account"],
    operation_summary="Logout",
    operation_description="Log out the current user and invalidate the session.",
    responses={
        200: openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "success": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                "message": openapi.Schema(type=openapi.TYPE_STRING),
            },
        ),
    },
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    """Log out the current user and return JSON confirmation."""
    username = request.user.username
    auth_logout(request._request)
    return Response({"success": True, "message": f"Goodbye {username}! You have been logged out successfully."})


@swagger_auto_schema(
    method="get",
    tags=["Auth - Google OAuth"],
    operation_summary="Google OAuth Login",
    operation_description="Initiate Google OAuth2 login flow. Redirects to Google consent screen.",
    responses={302: "Redirect to Google"},
)
@api_view(["GET"])
@permission_classes([AllowAny])
def google_login(request):
    return auth_views.google_login(request._request)


@swagger_auto_schema(
    method="get",
    tags=["Auth - Google OAuth"],
    operation_summary="Google OAuth Callback",
    operation_description="Callback endpoint for Google OAuth2 flow. Do not call directly.",
    responses={302: "Redirect to dashboard"},
)
@api_view(["GET"])
@permission_classes([AllowAny])
def google_callback(request):
    return auth_views.google_callback(request._request)


@swagger_auto_schema(
    method="get",
    tags=["Auth - Account"],
    operation_summary="Current User",
    operation_description="Return the authenticated user's profile data.",
    responses={
        200: openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "id": openapi.Schema(type=openapi.TYPE_INTEGER),
                "username": openapi.Schema(type=openapi.TYPE_STRING),
                "email": openapi.Schema(type=openapi.TYPE_STRING),
                "first_name": openapi.Schema(type=openapi.TYPE_STRING),
                "last_name": openapi.Schema(type=openapi.TYPE_STRING),
                "full_name": openapi.Schema(type=openapi.TYPE_STRING),
            },
        ),
        401: "Not authenticated",
    },
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "full_name": user.get_full_name(),
    })
