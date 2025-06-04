#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Create and activate a virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
    source venv/bin/activate
    pip install -q -r requirements.txt
else
    source venv/bin/activate
fi

# Run all tests with verbose output
python manage.py test apps/frontend/tests apps/authentication/tests -v 2

# Run specific test modules if needed
# python manage.py test apps.frontend.tests.test_views
# python manage.py test apps.authentication.tests.test_models

# Run with coverage (if installed)
# coverage run --source='apps' manage.py test apps.frontend.tests apps.authentication.tests
# coverage report
# coverage html  # generates htmlcov/coming_soon.html
