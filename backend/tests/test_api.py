import pytest

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.main import app, get_db
from app import models


# Create a separate in-memory database for testing.
TEST_DATABASE_URL = "sqlite://"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    bind=test_engine,
    autoflush=False,
    autocommit=False,
)


@pytest.fixture
def client():
    # Create fresh tables for each test.
    Base.metadata.create_all(bind=test_engine)

    def override_get_db():
        db = TestingSessionLocal()

        try:
            yield db
        finally:
            db.close()

    # Make API endpoints use the test database.
    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)


def create_sample_ticket(client):
    response = client.post(
        "/tickets",
        json={
            "title": "Unable to log in",
            "description": "I cannot access my account.",
            "priority": "high",
            "category": "Account Access",
        },
    )

    assert response.status_code == 201

    return response.json()


def test_health_check(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_create_ticket(client):
    response = client.post(
        "/tickets",
        json={
            "title": "Unable to log in",
            "description": "I cannot access my account.",
            "priority": "high",
            "category": "Account Access",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["title"] == "Unable to log in"
    assert data["priority"] == "high"
    assert data["category"] == "Account Access"
    assert data["status"] == "open"
    assert data["id"] is not None


def test_list_tickets(client):
    create_sample_ticket(client)

    response = client.get("/tickets")

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["title"] == "Unable to log in"


def test_get_ticket_by_id(client):
    ticket = create_sample_ticket(client)

    response = client.get(f"/tickets/{ticket['id']}")

    assert response.status_code == 200
    assert response.json()["id"] == ticket["id"]


def test_search_tickets(client):
    create_sample_ticket(client)

    response = client.get(
        "/tickets",
        params={"search": "log in"},
    )

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_filter_tickets_by_priority(client):
    create_sample_ticket(client)

    response = client.get(
        "/tickets",
        params={"priority": "high"},
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["priority"] == "high"


def test_close_ticket(client):
    ticket = create_sample_ticket(client)

    response = client.patch(
        f"/tickets/{ticket['id']}/close"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "closed"
    assert data["closed_at"] is not None


def test_update_ticket(client):
    ticket = create_sample_ticket(client)

    response = client.patch(
        f"/tickets/{ticket['id']}",
        params={
            "title": "Login issue resolved",
            "priority": "medium",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["title"] == "Login issue resolved"
    assert data["priority"] == "medium"


def test_dashboard_stats(client):
    ticket = create_sample_ticket(client)

    client.patch(f"/tickets/{ticket['id']}/close")

    response = client.get("/dashboard/stats")

    assert response.status_code == 200

    data = response.json()

    assert data["total_tickets"] == 1
    assert data["open_tickets"] == 0
    assert data["closed_tickets"] == 1
    assert data["tickets_by_priority"]["high"] == 1
    assert data["tickets_by_category"]["Account Access"] == 1


def test_nonexistent_ticket_returns_404(client):
    response = client.get("/tickets/99999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Ticket not found"


def test_invalid_ticket_returns_422(client):
    response = client.post(
        "/tickets",
        json={
            "title": "",
            "description": "",
            "priority": "urgent",
        },
    )

    assert response.status_code == 422