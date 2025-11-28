from django import forms
from .models import ExamRequest

class ExamRequestForm(forms.ModelForm):
    class Meta:
        model = ExamRequest
        fields = ['subject', 'topics', 'marks', 'question_type']
        widgets = {
            'subject': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Enter Subject (e.g. Physics)'}),
            'topics': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'Enter Topics separated by comma'}),
            'marks': forms.NumberInput(attrs={'class': 'form-control', 'min': 20, 'max': 100}),
            'question_type': forms.Select(attrs={'class': 'form-select'}),
        }

    def clean_marks(self):
        marks = self.cleaned_data.get('marks')
        if marks < 20 or marks > 100:
            raise forms.ValidationError("Marks must be between 20 and 100.")
        return marks
