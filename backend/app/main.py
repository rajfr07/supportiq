from pydantic import BaseModel, Field

from app.classifier import classify_ticket
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app import models
from app.database import Base, SessionLocal, engine
from app.schemas import TicketCreate, TicketOut


Base.metadata.create_all(bind=engine)

class ClassificationRequest(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=1)

app = FastAPI(title="SupportIQ API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok"}
from pydantic import BaseModel, Field
from app.classifier import classify_ticket


class ClassificationRequest(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=1)


@app.post("/ai/classify")
def predict_ticket_category(request: ClassificationRequest):
    return classify_ticket(
        request.title,
        request.description,
    )

@app.post("/ai/classify")
def predict_ticket_category(request: ClassificationRequest):
    return classify_ticket(
        request.title,
        request.description,
    )

@app.post("/tickets", response_model=TicketOut, status_code=201)
def create_ticket(
    ticket: TicketCreate,
    db: Session = Depends(get_db)
):
    ticket_data = ticket.model_dump()

    if not ticket_data.get("category"):
        prediction = classify_ticket(
            ticket_data["title"],
            ticket_data["description"],
        )

        ticket_data["category"] = prediction["category"]

    new_ticket = models.Ticket(**ticket_data)

    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)

    return new_ticket


@app.get("/tickets", response_model=list[TicketOut])
def list_tickets(
    search: str | None = None,
    status: Literal["open", "closed"] | None = None,
    priority: Literal["low", "medium", "high"] | None = None,
    category: str | None = None,
    db: Session = Depends(get_db)
):
    query = select(models.Ticket)

    if search:
        search_pattern = f"%{search}%"

        query = query.where(
            or_(
                models.Ticket.title.ilike(search_pattern),
                models.Ticket.description.ilike(search_pattern)
            )
        )

    if status:
        query = query.where(models.Ticket.status == status)

    if priority:
        query = query.where(models.Ticket.priority == priority)

    if category:
        query = query.where(
            models.Ticket.category.ilike(category)
        )

    query = query.order_by(models.Ticket.id.desc())

    return db.scalars(query).all()


@app.get("/tickets/{ticket_id}", response_model=TicketOut)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db)
):
    ticket = db.get(models.Ticket, ticket_id)

    if ticket is None:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    return ticket


@app.patch("/tickets/{ticket_id}", response_model=TicketOut)
def update_ticket(
    ticket_id: int,
    title: str | None = None,
    description: str | None = None,
    priority: Literal["low", "medium", "high"] | None = None,
    category: str | None = None,
    db: Session = Depends(get_db)
):
    ticket = db.get(models.Ticket, ticket_id)

    if ticket is None:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    if title is not None:
        if len(title.strip()) < 3 or len(title) > 200:
            raise HTTPException(
                status_code=422,
                detail="Title must contain 3 to 200 characters"
            )

        ticket.title = title

    if description is not None:
        if not description.strip():
            raise HTTPException(
                status_code=422,
                detail="Description cannot be empty"
            )

        ticket.description = description

    if priority is not None:
        ticket.priority = priority

    if category is not None:
        ticket.category = category

    db.commit()
    db.refresh(ticket)

    return ticket


@app.patch("/tickets/{ticket_id}/close", response_model=TicketOut)
def close_ticket(
    ticket_id: int,
    db: Session = Depends(get_db)
):
    ticket = db.get(models.Ticket, ticket_id)

    if ticket is None:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    if ticket.status == "closed":
        return ticket

    ticket.status = "closed"
    ticket.closed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(ticket)

    return ticket


@app.get("/dashboard/stats")
def dashboard_stats(db: Session = Depends(get_db)):
    total = db.scalar(
        select(func.count()).select_from(models.Ticket)
    )

    open_count = db.scalar(
        select(func.count())
        .select_from(models.Ticket)
        .where(models.Ticket.status == "open")
    )

    closed_count = db.scalar(
        select(func.count())
        .select_from(models.Ticket)
        .where(models.Ticket.status == "closed")
    )

    priority_counts = db.execute(
        select(
            models.Ticket.priority,
            func.count()
        ).group_by(models.Ticket.priority)
    ).all()

    category_counts = db.execute(
        select(
            models.Ticket.category,
            func.count()
        ).group_by(models.Ticket.category)
    ).all()

    return {
        "total_tickets": total,
        "open_tickets": open_count,
        "closed_tickets": closed_count,
        "tickets_by_priority": {
            priority: count
            for priority, count in priority_counts
        },
        "tickets_by_category": {
            category or "uncategorized": count
            for category, count in category_counts
        }
    }