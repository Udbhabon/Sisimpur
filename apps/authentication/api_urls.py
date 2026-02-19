from django.urls import path
from . import api_views

app_name = "auth_api"

urlpatterns = [
    path("send-otp/", api_views.send_otp, name="send_otp"),
    path("verify-otp/", api_views.verify_otp, name="verify_otp"),
    path("login/", api_views.login, name="login"),
    path("signup/", api_views.signup, name="signup"),
    path("logout/", api_views.logout, name="logout"),
    path("google/login/", api_views.google_login, name="google_login"),
    path("google/callback/", api_views.google_callback, name="google_callback"),
]
