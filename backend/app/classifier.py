import re


CATEGORY_KEYWORDS = {
    "Billing": {
        "keywords": [
            "bill", "billing", "invoice", "payment", "charged",
            "charge", "refund", "money", "subscription", "price",
            "overcharged", "transaction", "receipt", "tax"
        ]
    },
    "Technical Support": {
        "keywords": [
            "error", "bug", "crash", "broken", "not working",
            "failed", "failure", "slow", "loading", "technical",
            "glitch", "server", "application", "app", "website",
            "install", "installation", "update"
        ]
    },
    "Account Access": {
        "keywords": [
            "login", "log in", "sign in", "password", "account",
            "locked", "locked out", "authentication", "verification",
            "reset password", "access", "forgot password", "otp"
        ]
    },
    "Shipping": {
        "keywords": [
            "shipping", "delivery", "delayed", "parcel", "package",
            "tracking", "shipment", "courier", "arrived", "dispatch",
            "order status", "not delivered", "lost package"
        ]
    },
    "Product": {
        "keywords": [
            "product", "defective", "damaged", "quality", "replacement",
            "warranty", "missing part", "specification", "feature",
            "item", "malfunction", "return"
        ]
    },
}


def classify_ticket(title: str, description: str) -> dict:
    text = f"{title} {description}".lower()
    text = re.sub(r"\s+", " ", text).strip()

    scores = {}

    for category, data in CATEGORY_KEYWORDS.items():
        score = 0

        for keyword in data["keywords"]:
            if keyword in text:
                score += 2 if " " in keyword else 1

        scores[category] = score

    highest_score = max(scores.values())
    matches = [
        category
        for category, score in scores.items()
        if score == highest_score and score > 0
    ]

    if not matches:
        return {
            "category": "General Inquiry",
            "confidence": 0.0,
            "matched_keywords": [],
            "method": "keyword_baseline",
        }

    # Resolve ties consistently.
    category = matches[0]

    matched_keywords = [
        keyword
        for keyword in CATEGORY_KEYWORDS[category]["keywords"]
        if keyword in text
    ]

    # This is a heuristic confidence score, NOT a calibrated probability.
    total_score = sum(scores.values())
    confidence = highest_score / total_score if total_score else 0.0

    return {
        "category": category,
        "confidence": round(confidence, 2),
        "matched_keywords": matched_keywords,
        "method": "keyword_baseline",
    }