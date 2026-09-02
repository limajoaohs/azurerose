from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from typing import Optional

from app.ai.factory import get_ai_provider
from app.ai.pipelines.syllabus_parser import SyllabusParserPipeline
from app.ai.pipelines.mindmap_generator import MindmapGeneratorPipeline
from app.ai.pipelines.flashcard_generator import FlashcardGeneratorPipeline
from app.ai.pipelines.note_summarizer import NoteSummarizerPipeline
from app.ai.schemas import (
    SyllabusParseResponse,
    MindmapGenerationRequest,
    MindmapGenerationResponse,
    FlashcardGenerationRequest,
    FlashcardGenerationResponse,
    NoteSummaryResponse,
)
from app.core.config import settings

router = APIRouter()


@router.get("/config")
async def get_ai_status():
    return {
        "active_provider": settings.AI_PROVIDER,
        "environment": settings.ENVIRONMENT,
        "gemini_model": settings.GEMINI_MODEL if settings.AI_PROVIDER == "gemini" else None,
        "local_llm_model": settings.LOCAL_LLM_MODEL if settings.AI_PROVIDER in ("local_vllm", "ollama") else None,
        "is_mock": settings.AI_PROVIDER == "mock",
    }


@router.post("/syllabus/parse-text", response_model=SyllabusParseResponse)
async def parse_syllabus_text(
    content: str = Form(...),
    course_hint: Optional[str] = Form(None),
):
    provider = get_ai_provider()
    pipeline = SyllabusParserPipeline(provider)
    try:
        return await pipeline.parse_syllabus(raw_text=content, course_hint=course_hint)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar ementa: {str(e)}")


@router.post("/syllabus/upload-pdf", response_model=SyllabusParseResponse)
async def parse_syllabus_pdf(
    file: UploadFile = File(...),
    course_hint: Optional[str] = Form(None),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="O arquivo enviado precisa ser um PDF.")

    pdf_bytes = await file.read()
    if len(pdf_bytes) == 0:
        raise HTTPException(status_code=400, detail="Arquivo PDF vazio.")

    provider = get_ai_provider()
    pipeline = SyllabusParserPipeline(provider)
    try:
        return await pipeline.parse_syllabus(pdf_bytes=pdf_bytes, course_hint=course_hint)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao analisar PDF da ementa: {str(e)}")


@router.post("/mindmap/generate", response_model=MindmapGenerationResponse)
async def generate_mindmap(request: MindmapGenerationRequest):
    provider = get_ai_provider()
    pipeline = MindmapGeneratorPipeline(provider)
    try:
        return await pipeline.generate_mindmap(content=request.content, title_hint=request.title)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar mapa mental: {str(e)}")


@router.post("/flashcards/generate", response_model=FlashcardGenerationResponse)
async def generate_flashcards(request: FlashcardGenerationRequest):
    provider = get_ai_provider()
    pipeline = FlashcardGeneratorPipeline(provider)
    try:
        return await pipeline.generate_flashcards(
            content=request.content,
            subject=request.subject,
            quantity=request.quantity,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar flashcards: {str(e)}")


@router.post("/notes/summarize", response_model=NoteSummaryResponse)
async def summarize_note(content: str = Form(...)):
    provider = get_ai_provider()
    pipeline = NoteSummarizerPipeline(provider)
    try:
        return await pipeline.summarize_note(content=content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao resumir nota: {str(e)}")
