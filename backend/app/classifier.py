from pathlib import Path

import joblib


MODEL_PATH = Path(__file__).with_name("ticket_model.joblib")

_model = None


def load_model():
    global _model

    if _model is None and MODEL_PATH.exists():
        _model = joblib.load(MODEL_PATH)

    return _model


def classify_ticket(title: str, description: str) -> dict:
    text = f"{title.strip()} {description.strip()}".strip()

    model = load_model()

    if model is None:
        return {
            "category": "General Inquiry",
            "confidence": 0.0,
            "matched_keywords": [],
            "method": "model_unavailable",
        }

    probabilities = model.predict_proba([text])[0]
    predicted_index = probabilities.argmax()

    category = str(model.classes_[predicted_index])
    confidence = float(probabilities[predicted_index])

    return {
        "category": category,
        "confidence": round(confidence, 2),
        "matched_keywords": [],
        "method": "tfidf_logistic_regression",
    }