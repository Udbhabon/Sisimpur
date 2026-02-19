from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated

from . import views as auth_views


# ---------------------------------------------------------------------------
# Auth – JSON / AJAX endpoints
# ---------------------------------------------------------------------------

@swagger_auto_schema(
    method="post",
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
    operation_summary="Login",
    operation_description="Authenticate with email and password. Returns session cookie.",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=["email", "password"],
        properties={
            "email": openapi.Schema(type=openapi.TYPE_STRING, description="Gmail address"),
            "password": openapi.Schema(type=openapi.TYPE_STRING, description="Account password"),
            "action": openapi.Schema(
                type=openapi.TYPE_STRING,
                description="Must be 'login'",
                default="login",
            ),
        },
    ),
    responses={200: "Redirect / JSON depending on client"},
)
@api_view(["POST"])
@permission_classes([AllowAny])
@parser_classes([JSONParser])
def login(request):
    """Proxy login through the signupin view (action=login)."""
    return auth_views.signupin(request._request)


@swagger_auto_schema(
    method="post",
    operation_summary="Signup",
    operation_description="Complete signup after OTP verification. Sets password and activates account.",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=["email", "password", "password_confirm"],
        properties={
            "email": openapi.Schema(type=openapi.TYPE_STRING),
            "password": openapi.Schema(type=openapi.TYPE_STRING),
            "password_confirm": openapi.Schema(type=openapi.TYPE_STRING),
            "action": openapi.Schema(
                type=openapi.TYPE_STRING,
                description="Must be 'signup'",
                default="signup",
            ),
        },
    ),
    responses={200: "Redirect / JSON depending on client"},
)
@api_view(["POST"])
@permission_classes([AllowAny])
@parser_classes([JSONParser])
def signup(request):
    """Proxy signup through the signupin view (action=signup)."""
    return auth_views.signupin(request._request)


@swagger_auto_schema(
    method="post",
    operation_summary="Logout",
    operation_description="Log out the current user and invalidate the session.",
    responses={200: "Redirect to home page"},
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    return auth_views.logout_view(request._request)


@swagger_auto_schema(
    method="get",
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
    operation_summary="Google OAuth Callback",
    operation_description="Callback endpoint for Google OAuth2 flow. Do not call directly.",
    responses={302: "Redirect to dashboard"},
)
@api_view(["GET"])
@permission_classes([AllowAny])
def google_callback(request):
    return auth_views.google_callback(request._request)
