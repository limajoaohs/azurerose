from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime

from app.db.session import get_db
from app.db.models import StudyTask, User
from app.core.deps import get_current_user

router = APIRouter()


class TaskCreate(BaseModel):
    title: str
    subject_id: Optional[str] = None
    due_date: Optional[datetime] = None
    estimated_minutes: int = 25
    priority: str = "medium"
    task_type: str = "study"


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    is_completed: Optional[bool] = None
    due_date: Optional[datetime] = None
    priority: Optional[str] = None


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    subject_id: Optional[str]
    title: str
    due_date: Optional[datetime]
    estimated_minutes: int
    is_completed: bool
    priority: str
    task_type: str
    created_at: datetime


@router.get("/tasks", response_model=List[TaskResponse])
async def list_tasks(
    subject_id: Optional[str] = None,
    completed: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(StudyTask)
        .where(StudyTask.user_id == current_user.id)
        .order_by(StudyTask.due_date.asc().nullslast(), StudyTask.created_at.desc())
    )
    if subject_id:
        query = query.where(StudyTask.subject_id == subject_id)
    if completed is not None:
        query = query.where(StudyTask.is_completed == completed)

    result = await db.execute(query)
    return result.scalars().all()


@router.post("/tasks", response_model=TaskResponse)
async def create_task(
    payload: TaskCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    task = StudyTask(**payload.model_dump(), user_id=current_user.id)
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
async def toggle_task_status(
    task_id: str,
    payload: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(StudyTask).where(StudyTask.id == task_id, StudyTask.user_id == current_user.id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada.")

    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, val)

    await db.commit()
    await db.refresh(task)
    return task
