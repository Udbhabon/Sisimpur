from django.urls import path
from . import api_views

app_name = "dashboard_api"

urlpatterns = [
    # Quizzes
    path("my-quizzes/", api_views.my_quizzes, name="my_quizzes"),
    path("quiz-results/<int:job_id>/", api_views.quiz_results, name="quiz_results"),

    # Leaderboard
    path("leaderboard/", api_views.leaderboard, name="leaderboard"),

    # Exam lifecycle
    path("exam/start/<int:job_id>/", api_views.start_exam, name="start_exam"),
    path("exam/session/<str:session_id>/", api_views.exam_session, name="exam_session"),
    path("exam/answer/<str:session_id>/", api_views.answer_question, name="answer_question"),
    path("exam/submit/<str:session_id>/", api_views.submit_exam, name="submit_exam"),
    path("exam/result/<str:session_id>/", api_views.exam_result, name="exam_result"),

    # Flashcards
    path("flashcard/start/<int:job_id>/", api_views.start_flashcard, name="start_flashcard"),
    path("flashcard/session/<str:session_id>/", api_views.flashcard_session, name="flashcard_session"),
    path("flashcard/advance/<str:session_id>/", api_views.advance_flashcard, name="advance_flashcard"),
]
