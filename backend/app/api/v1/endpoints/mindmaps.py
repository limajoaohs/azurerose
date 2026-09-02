from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime

from app.db.session import get_db
from app.db.models import Mindmap, User
from app.core.deps import get_current_user

router = APIRouter()


class MindmapCreate(BaseModel):
    note_id: Optional[str] = None
    title: str
    central_topic: str
    nodes: List[Any]
    edges: List[Any]


class MindmapResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    note_id: Optional[str]
    title: str
    central_topic: str
    nodes: List[Any]
    edges: List[Any]
    created_at: datetime
    updated_at: datetime


@router.get("/maps", response_model=List[MindmapResponse])
async def list_mindmaps(
    note_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Mindmap).where(Mindmap.user_id == current_user.id).order_by(Mindmap.updated_at.desc())
    if note_id:
        query = query.where(Mindmap.note_id == note_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/maps", response_model=MindmapResponse)
async def save_mindmap(
    payload: MindmapCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    mindmap = Mindmap(**payload.model_dump(), user_id=current_user.id)
    db.add(mindmap)
    await db.commit()
    await db.refresh(mindmap)
    return mindmap


@router.get("/maps/{map_id}", response_model=MindmapResponse)
async def get_mindmap(
    map_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Mindmap).where(Mindmap.id == map_id, Mindmap.user_id == current_user.id))
    mindmap = result.scalar_one_or_none()
    if not mindmap:
        raise HTTPException(status_code=404, detail="Mapa mental não encontrado.")
    return mindmap
