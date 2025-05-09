from django.test import TestCase, Client
from django.urls import reverse


class IndexViewTest(TestCase):
    """Test cases for the index view"""

    def setUp(self):
        """Set up test client"""
        self.client = Client()
        self.url = reverse('index')

    def test_index_view_status_code(self):
        """Test that the index view returns a 200 status code"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)

    def test_index_view_uses_correct_template(self):
        """Test that the index view uses the correct template"""
        response = self.client.get(self.url)
        self.assertTemplateUsed(response, 'index.html')

    def test_index_view_contains_expected_content(self):
        """Test that the index view contains expected content"""
        response = self.client.get(self.url)
        self.assertContains(response, 'SISIMPUR')
        self.assertContains(response, 'Transform any study material into customized exam questions with AI')
        self.assertContains(response, 'Launching Soon')

    def test_countdown_elements_present(self):
        """Test that countdown elements are present in the response"""
        response = self.client.get(self.url)
        self.assertContains(response, 'countdown-item')
        self.assertContains(response, 'id="days"')
        self.assertContains(response, 'id="hours"')
        self.assertContains(response, 'id="minutes"')
        self.assertContains(response, 'id="seconds"')

    def test_features_section_present(self):
        """Test that features section is present in the response"""
        response = self.client.get(self.url)
        self.assertContains(response, 'Key Features')
        self.assertContains(response, 'features-item')
        self.assertContains(response, 'Document to Quiz')
        self.assertContains(response, 'AI-Powered')
