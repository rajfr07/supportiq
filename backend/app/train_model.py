from pathlib import Path

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import cross_val_score


# Small demonstration dataset for SupportIQ.
# Each entry contains a support ticket and its category.
TRAINING_DATA = [
    # Billing
    ("Charged twice for my subscription", "Billing"),
    ("I need a refund for my payment", "Billing"),
    ("My invoice contains the wrong amount", "Billing"),
    ("Payment failed but money was deducted", "Billing"),
    ("Please explain this unexpected charge", "Billing"),
    ("I was overcharged for my order", "Billing"),
    ("My subscription renewal payment is incorrect", "Billing"),
    ("I need a receipt for my transaction", "Billing"),
    ("The customer was charged twice", "Billing"),
    ("I want to cancel a payment and get my money back", "Billing"),
    ("My credit card payment was processed incorrectly", "Billing"),
    ("There is an issue with my monthly bill", "Billing"),

    # Technical Support
    ("The application crashes when I open it", "Technical Support"),
    ("The website is loading very slowly", "Technical Support"),
    ("I receive an error when uploading a file", "Technical Support"),
    ("The app is not working after the update", "Technical Support"),
    ("The server is unavailable", "Technical Support"),
    ("I cannot install the application", "Technical Support"),
    ("The software freezes when I click submit", "Technical Support"),
    ("The page shows an unexpected technical error", "Technical Support"),
    ("The application stopped responding", "Technical Support"),
    ("I found a bug in the search feature", "Technical Support"),
    ("The website keeps showing a blank screen", "Technical Support"),
    ("My dashboard is broken and will not load", "Technical Support"),

    # Account Access
    ("I cannot log in to my account", "Account Access"),
    ("I forgot my password and need to reset it", "Account Access"),
    ("My account is locked", "Account Access"),
    ("The login page says invalid credentials", "Account Access"),
    ("I am not receiving my verification code", "Account Access"),
    ("I cannot sign in after changing my password", "Account Access"),
    ("My one time password is not working", "Account Access"),
    ("I need help recovering my account", "Account Access"),
    ("The authentication process keeps failing", "Account Access"),
    ("I cannot access my profile", "Account Access"),
    ("Password reset email never arrived", "Account Access"),
    ("I am locked out of my account", "Account Access"),

    # Shipping
    ("My package has not been delivered", "Shipping"),
    ("The shipment is delayed", "Shipping"),
    ("I need to track my order", "Shipping"),
    ("My parcel appears to be lost", "Shipping"),
    ("The courier has not arrived", "Shipping"),
    ("When will my order be dispatched", "Shipping"),
    ("The tracking information has not updated", "Shipping"),
    ("My delivery is late", "Shipping"),
    ("The package arrived at the wrong address", "Shipping"),
    ("I have not received my shipment", "Shipping"),
    ("Please provide an update on my delivery", "Shipping"),
    ("My order status says shipped but nothing arrived", "Shipping"),

    # Product
    ("The product arrived damaged", "Product"),
    ("I received a defective item", "Product"),
    ("The product quality is poor", "Product"),
    ("I want a replacement for my item", "Product"),
    ("The device stopped working after two days", "Product"),
    ("I need information about the product warranty", "Product"),
    ("The package is missing a product component", "Product"),
    ("The item does not match its specifications", "Product"),
    ("I want to return a faulty product", "Product"),
    ("The product has a manufacturing defect", "Product"),
    ("The device has a broken screen", "Product"),
    ("I have a question about product features", "Product"),
]


def main():
    texts = [text for text, _ in TRAINING_DATA]
    labels = [label for _, label in TRAINING_DATA]

    model = Pipeline([
        (
            "tfidf",
            TfidfVectorizer(
                lowercase=True,
                ngram_range=(1, 2),
                sublinear_tf=True,
            ),
        ),
        (
            "classifier",
            LogisticRegression(
                max_iter=1000,
                class_weight="balanced",
                random_state=42,
            ),
        ),
    ])

    # Cross-validation gives a preliminary evaluation on this small dataset.
    scores = cross_val_score(
        model,
        texts,
        labels,
        cv=3,
        scoring="accuracy",
    )

    print("Cross-validation accuracy:", round(scores.mean(), 3))
    print("Individual fold scores:", scores.round(3))

    # Train the final model using all demonstration examples.
    model.fit(texts, labels)

    model_path = Path(__file__).with_name("ticket_model.joblib")
    joblib.dump(model, model_path)

    print(f"\nModel saved to: {model_path}")
    print("Training examples:", len(TRAINING_DATA))
    print("Categories:", sorted(set(labels)))


if __name__ == "__main__":
    main()