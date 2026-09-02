from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime

from app.db.session import get_db
from app.db.models import Subject, Note, User
from app.core.deps import get_current_user

router = APIRouter()


class SubjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = "#3b82f6"
    icon: Optional[str] = "book"


class SubjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: Optional[str]
    color: str
    icon: str
    created_at: datetime


class NoteCreate(BaseModel):
    title: str
    content: str = ""
    subject_id: Optional[str] = None
    summary: Optional[str] = None


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    summary: Optional[str] = None
    is_favorite: Optional[bool] = None


class NoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    subject_id: Optional[str]
    title: str
    content: str
    summary: Optional[str]
    is_favorite: bool
    created_at: datetime
    updated_at: datetime


@router.get("/subjects", response_model=List[SubjectResponse])
async def list_subjects(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(
        select(Subject).where(Subject.user_id == current_user.id).order_by(Subject.created_at.desc())
    )
    return result.scalars().all()


@router.post("/subjects", response_model=SubjectResponse)
async def create_subject(
    payload: SubjectCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    subject = Subject(**payload.model_dump(), user_id=current_user.id)
    db.add(subject)
    await db.commit()
    await db.refresh(subject)
    return subject


@router.get("/notes", response_model=List[NoteResponse])
async def list_notes(
    subject_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Note).where(Note.user_id == current_user.id).order_by(Note.updated_at.desc())
    if subject_id:
        query = query.where(Note.subject_id == subject_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/notes", response_model=NoteResponse)
async def create_note(
    payload: NoteCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    note = Note(**payload.model_dump(), user_id=current_user.id)
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note


@router.get("/notes/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Note).where(Note.id == note_id, Note.user_id == current_user.id))
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Nota não encontrada.")
    return note


@router.put("/notes/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: str,
    payload: NoteUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Note).where(Note.id == note_id, Note.user_id == current_user.id))
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Nota não encontrada.")

    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(note, field, val)

    await db.commit()
    await db.refresh(note)
    return note


@router.delete("/notes/{note_id}")
async def delete_note(
    note_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Note).where(Note.id == note_id, Note.user_id == current_user.id))
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Nota não encontrada.")
    await db.delete(note)
    await db.commit()
    return {"status": "success", "message": "Nota excluída com sucesso."}
