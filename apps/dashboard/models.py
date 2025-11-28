from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from apps.brain.models import ProcessingJob, QuestionAnswer
import json


class ExamSession(models.Model):
    """Model to track exam sessions and attempts"""

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('expired', 'Expired'),
        ('abandoned', 'Abandoned'),
    ]

    # Basic fields
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='exam_sessions')
    processing_job = models.ForeignKey(ProcessingJob, on_delete=models.CASCADE, related_name='exam_sessions')
    session_id = models.CharField(max_length=100, unique=True)

    # Session configuration
    total_questions = models.PositiveIntegerField()
    time_limit_minutes = models.PositiveIntegerField(default=60)  # 1 minute per question default
    allow_navigation = models.BooleanField(default=True)  # Configurable: allow going back to previous questions
    max_attempts = models.PositiveIntegerField(default=3)  # Configurable: maximum retry attempts
    attempt_number = models.PositiveIntegerField(default=1)

    # Session state
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    current_question_index = models.PositiveIntegerField(default=0)
    questions_order = models.JSONField(default=list)  # Store randomized question order

    # Timing
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    time_remaining_seconds = models.PositiveIntegerField(null=True, blank=True)

    # Results
    total_score = models.PositiveIntegerField(default=0)
    max_possible_score = models.PositiveIntegerField(default=0)
    percentage_score = models.FloatField(default=0.0)
    credit_points = models.PositiveIntegerField(default=0)  # For leaderboard system

    # Metadata
    session_metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-started_at']
        unique_together = ['user', 'processing_job', 'attempt_number']

    def __str__(self):
        return f"{self.user.username} - {self.processing_job.document_name} (Attempt {self.attempt_number})"

    def get_time_elapsed_seconds(self):
        """Get elapsed time in seconds"""
        if self.completed_at:
            return (self.completed_at - self.started_at).total_seconds()
        return (timezone.now() - self.started_at).total_seconds()

    def get_remaining_time_seconds(self):
        """Get remaining time in seconds"""
        if self.status != 'active':
            return 0

        elapsed = self.get_time_elapsed_seconds()
        total_time = self.time_limit_minutes * 60
        remaining = total_time - elapsed
        return max(0, int(remaining))

    def is_expired(self):
        """Check if exam session has expired"""
        return self.get_remaining_time_seconds() <= 0

    def can_retry(self):
        """Check if user can retry this exam"""
        user_attempts = ExamSession.objects.filter(
            user=self.user,
            processing_job=self.processing_job
        ).count()
        return user_attempts < self.max_attempts

    def calculate_score(self):
        """Calculate final score and credit points"""
        answers = self.exam_answers.all()
        
        # Check if this is a short answer exam
        short_answer_evaluations = self.short_answer_evaluations.all()
        
        if short_answer_evaluations.exists():
            # For short answer exams, use detailed evaluation scores
            total_score = sum(eval.score for eval in short_answer_evaluations)
            max_score = sum(eval.max_score for eval in short_answer_evaluations)
            correct_answers = sum(1 for eval in short_answer_evaluations if eval.score >= (eval.max_score * 0.6))
            total_questions = short_answer_evaluations.count()
            
            if max_score > 0:
                self.percentage_score = (total_score / max_score) * 100
                self.total_score = total_score
                self.max_possible_score = max_score
                
                # Credit points calculation for short answers
                # Base points: proportional to score achieved
                # Time bonus: up to 5 extra points per question based on speed
                base_points = int((total_score / max_score) * total_questions * 10)
                
                # Time bonus calculation
                time_efficiency = min(1.0, (self.time_limit_minutes * 60) / max(1, self.get_time_elapsed_seconds()))
                time_bonus = int(total_questions * 5 * time_efficiency)
                
                self.credit_points = base_points + time_bonus
        else:
            # For multiple choice exams, use the old method
            correct_answers = answers.filter(is_correct=True).count()
            total_questions = answers.count()

            if total_questions > 0:
                self.percentage_score = (correct_answers / total_questions) * 100
                self.total_score = correct_answers
                self.max_possible_score = total_questions

                # Credit points calculation (for leaderboard)
                # Base points: 10 per correct answer
                # Time bonus: up to 5 extra points per question based on speed
                # Difficulty bonus: based on question difficulty if available
                base_points = correct_answers * 10

                # Time bonus calculation
                time_efficiency = min(1.0, (self.time_limit_minutes * 60) / max(1, self.get_time_elapsed_seconds()))
                time_bonus = int(correct_answers * 5 * time_efficiency)

                self.credit_points = base_points + time_bonus

        self.save()


class ExamAnswer(models.Model):
    """Model to store individual exam answers"""

    exam_session = models.ForeignKey(ExamSession, on_delete=models.CASCADE, related_name='exam_answers')
    question = models.ForeignKey(QuestionAnswer, on_delete=models.CASCADE)
    question_index = models.PositiveIntegerField()  # Order in the exam

    # Answer data
    user_answer = models.TextField()
    is_correct = models.BooleanField(default=False)
    points_earned = models.PositiveIntegerField(default=0)

    # Timing
    answered_at = models.DateTimeField(auto_now_add=True)
    time_taken_seconds = models.PositiveIntegerField(default=0)

    # Metadata
    answer_metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        unique_together = ['exam_session', 'question']
        ordering = ['question_index']

    def __str__(self):
        return f"{self.exam_session.user.username} - Q{self.question_index + 1}"


class ShortAnswerEvaluation(models.Model):
    """Model to store detailed evaluation results for short answer questions"""
    
    exam_session = models.ForeignKey(ExamSession, on_delete=models.CASCADE, related_name='short_answer_evaluations')
    question = models.ForeignKey(QuestionAnswer, on_delete=models.CASCADE)
    question_index = models.PositiveIntegerField()
    
    # User's answer
    user_answer = models.TextField()
    
    # Evaluation results
    score = models.PositiveIntegerField(default=0)
    max_score = models.PositiveIntegerField(default=10)
    feedback = models.TextField(blank=True)
    ideal_answer = models.TextField(blank=True)
    
    # Detailed scoring breakdown
    accuracy_score = models.FloatField(default=0.0)
    completeness_score = models.FloatField(default=0.0)
    clarity_score = models.FloatField(default=0.0)
    structure_score = models.FloatField(default=0.0)
    
    # Evaluation metadata
    evaluated_at = models.DateTimeField(auto_now_add=True)
    evaluation_metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        unique_together = ['exam_session', 'question']
        ordering = ['question_index']
    
    def __str__(self):
        return f"{self.exam_session.user.username} - Q{self.question_index + 1} - {self.score}/{self.max_score}"
    
    @property
    def percentage_score(self):
        """Calculate percentage score for this answer"""
        if self.max_score == 0:
            return 0.0
        return (self.score / self.max_score) * 100


class FlashcardSession(models.Model):
    """Model to track flashcard study sessions"""

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('abandoned', 'Abandoned'),
    ]

    # Basic fields
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='flashcard_sessions')
    processing_job = models.ForeignKey(ProcessingJob, on_delete=models.CASCADE, related_name='flashcard_sessions')
    session_id = models.CharField(max_length=100, unique=True)

    # Session configuration
    total_cards = models.PositiveIntegerField()
    time_per_card_seconds = models.PositiveIntegerField(default=60)  # 1 minute per card
    auto_advance = models.BooleanField(default=True)  # Auto advance after timer

    # Session state
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    current_card_index = models.PositiveIntegerField(default=0)
    cards_order = models.JSONField(default=list)  # Store randomized card order

    # Timing
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Progress tracking
    cards_studied = models.PositiveIntegerField(default=0)
    total_study_time_seconds = models.PositiveIntegerField(default=0)

    # Metadata
    session_metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.user.username} - {self.processing_job.document_name} (Flashcards)"

    def get_progress_percentage(self):
        """Get study progress as percentage"""
        if self.total_cards == 0:
            return 0
        return (self.cards_studied / self.total_cards) * 100


class FlashcardProgress(models.Model):
    """Model to track individual flashcard progress"""

    flashcard_session = models.ForeignKey(FlashcardSession, on_delete=models.CASCADE, related_name='card_progress')
    question = models.ForeignKey(QuestionAnswer, on_delete=models.CASCADE)
    card_index = models.PositiveIntegerField()  # Order in the session

    # Progress data
    viewed_at = models.DateTimeField(auto_now_add=True)
    time_spent_seconds = models.PositiveIntegerField(default=0)
    was_skipped = models.BooleanField(default=False)

    # Metadata
    progress_metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        unique_together = ['flashcard_session', 'question']
        ordering = ['card_index']

    def __str__(self):
        return f"{self.flashcard_session.user.username} - Card {self.card_index + 1}"


# Configuration model for system-wide settings
class ExamConfiguration(models.Model):
    """Global configuration for exam system"""

    # Timing settings
    default_time_per_question_minutes = models.PositiveIntegerField(default=1)
    max_exam_duration_hours = models.PositiveIntegerField(default=3)

    # Attempt settings
    default_max_attempts = models.PositiveIntegerField(default=3)
    retry_cooldown_hours = models.PositiveIntegerField(default=24)

    # Navigation settings
    allow_question_navigation = models.BooleanField(default=True)
    allow_answer_change = models.BooleanField(default=True)

    # Scoring settings
    points_per_correct_answer = models.PositiveIntegerField(default=10)
    time_bonus_multiplier = models.FloatField(default=0.5)

    # Flashcard settings
    default_flashcard_time_seconds = models.PositiveIntegerField(default=60)
    auto_advance_flashcards = models.BooleanField(default=True)

    # System settings
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Exam Configuration'
        verbose_name_plural = 'Exam Configurations'

    def __str__(self):
        return f"Exam Config (Updated: {self.updated_at.strftime('%Y-%m-%d %H:%M')})"

    @classmethod
    def get_current_config(cls):
        """Get the current active configuration"""
        config = cls.objects.filter(is_active=True).first()
        if not config:
            # Create default configuration if none exists
            config = cls.objects.create()
        return config


class ExamRequest(models.Model):
    """Model to store user requests for new exams"""
    
    QUESTION_TYPE_CHOICES = [
        ('MCQ', 'Multiple Choice Questions (MCQ)'),
        ('CQ', 'Creative Questions (CQ)'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending Confirmation'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='exam_requests')
    subject = models.CharField(max_length=100)
    topics = models.TextField(help_text="Comma separated topics")
    marks = models.PositiveIntegerField(help_text="Marks between 20 and 100")
    question_type = models.CharField(max_length=10, choices=QUESTION_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.subject} ({self.status})"

