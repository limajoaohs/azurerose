from fastapi import APIRouter
from app.api.v1.endpoints import ai, notes, calendar, flashcards, mindmaps, auth

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(ai.router, prefix="/ai", tags=["AzureRose AI Core"])
api_router.include_router(notes.router, prefix="/workspace", tags=["Workspace & Notes"])
api_router.include_router(calendar.router, prefix="/calendar", tags=["Calendar & Study Schedule"])
api_router.include_router(flashcards.router, prefix="/flashcards", tags=["Spaced Repetition (SRS)"])
api_router.include_router(mindmaps.router, prefix="/mindmaps", tags=["Mindmaps (React Flow)"])
