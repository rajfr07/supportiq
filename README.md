# SupportIQ — AI-Powered Customer Support Intelligence

SupportIQ is a customer support ticket management and analytics application
that combines a React dashboard, FastAPI backend, and machine-learning-based
ticket classification.

The system helps support teams organize customer issues, automatically
categorize incoming tickets, monitor ticket status, and understand support
workloads through dashboard analytics.

## Features

### Ticket Management
- Create customer support tickets with titles and descriptions.
- Automatically predict ticket categories using a trained ML model.
- Search and filter tickets.
- Track ticket priorities and statuses.
- Update ticket information and close resolved tickets.

### Machine Learning
- TF-IDF text feature extraction.
- Logistic Regression classification.
- Five supported categories:
  - Billing
  - Technical Support
  - Account Access
  - Shipping
  - Product
- Prediction confidence scores.
- A separate training script for reproducing the model.

### Analytics Dashboard
- Total ticket count.
- Open and closed ticket counts.
- Ticket distribution by priority.
- Ticket distribution by category.

### Backend API
- REST API built with FastAPI.
- Request validation using Pydantic.
- Persistent data storage using SQLAlchemy.
- Interactive API documentation through Swagger UI.
- Automated API tests using pytest.

## Technology Stack

**Frontend**
- React
- Vite
- JavaScript
- CSS

**Backend**
- Python
- FastAPI
- SQLAlchemy
- Pydantic

**Machine Learning**
- scikit-learn
- TF-IDF Vectorizer
- Logistic Regression
- Joblib

**Testing and Development**
- pytest
- HTTPX
- Git and GitHub

## Machine Learning Workflow

1. Collect labeled examples of customer support tickets.
2. Combine each ticket's title and description into a text input.
3. Convert text into numerical features using TF-IDF.
4. Train a Logistic Regression classifier on the labeled examples.
5. Evaluate the training pipeline using cross-validation.
6. Save the trained model using Joblib.
7. Load the saved model in the FastAPI backend.
8. Return the predicted category and confidence score through the API.

The current training script uses a small, manually prepared dataset of
60 examples across five categories. Its initial three-fold cross-validation
scores were 65%, 80%, and 75%, averaging approximately 73.3%.

These preliminary results are based on a small demonstration dataset and
should not be interpreted as expected real-world performance. A larger,
representative dataset and independent test set are needed for a reliable
evaluation.

## Project Structure

```text
supportiq/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── classifier.py
│   │   ├── train_model.py
│   │   └── ticket_model.joblib
│   ├── tests/
│   │   └── test_api.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── api.js
│   │   ├── index.css
│   │   └── main.jsx
│   └── package.json
│
└── README.md