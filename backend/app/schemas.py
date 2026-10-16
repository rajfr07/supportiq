from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class TicketCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=1)
    priority: Literal["low", "medium", "high"] = "medium"
    category: str | None = Field(default=None, max_length=50)


class TicketOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    category: str | None
    priority: str
    status: str
    created_at: datetime
    closed_at: datetime | None