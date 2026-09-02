from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime, timezone, timedelta

from app.db.session import get_db
from app.db.models import Flashcard, User
from app.core.deps import get_current_user

router = APIRouter()


class FlashcardCreate(BaseModel):
    subject_id: Optional[str] = None
    note_id: Optional[str] = None
    front: str
    back: str
    difficulty: str = "medium"
    tags: List[str] = []


class FlashcardReviewInput(BaseModel):
    rating: int


class FlashcardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    subject_id: Optional[str]
    note_id: Optional[str]
    front: str
    back: str
    difficulty: str
    tags: List[str]
    repetitions: int
    interval_days: int
    ease_factor: float
    next_review_at: datetime
    created_at: datetime


@router.get("/cards", response_model=List[FlashcardResponse])
async def list_flashcards(
    subject_id: Optional[str] = None,
    note_id: Optional[str] = None,
    due_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Flashcard).where(Flashcard.user_id == current_user.id).order_by(Flashcard.next_review_at.asc())
    if subject_id:
        query = query.where(Flashcard.subject_id == subject_id)
    if note_id:
        query = query.where(Flashcard.note_id == note_id)
    if due_only:
        query = query.where(Flashcard.next_review_at <= datetime.now(timezone.utc))

    result = await db.execute(query)
    return result.scalars().all()


@router.post("/cards", response_model=FlashcardResponse)
async def create_flashcard(
    payload: FlashcardCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    card = Flashcard(**payload.model_dump(), user_id=current_user.id)
    db.add(card)
    await db.commit()
    await db.refresh(card)
    return card


@router.post("/cards/{card_id}/review", response_model=FlashcardResponse)
async def review_flashcard(
    card_id: str,
    payload: FlashcardReviewInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Flashcard).where(Flashcard.id == card_id, Flashcard.user_id == current_user.id))
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard não encontrado.")

    q = max(1, min(5, payload.rating))
    if q >= 3:
        if card.repetitions == 0:
            card.interval_days = 1
        elif card.repetitions == 1:
            card.interval_days = 6
        else:
            card.interval_days = int(card.interval_days * card.ease_factor)
        card.repetitions += 1
    else:
        card.repetitions = 0
        card.interval_days = 1

    card.ease_factor = max(1.3, card.ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))
    card.next_review_at = datetime.now(timezone.utc) + timedelta(days=card.interval_days)

    await db.commit()
    await db.refresh(card)
    return card
