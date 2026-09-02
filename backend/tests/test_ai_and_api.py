import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.db.session import init_db
from app.ai.factory import get_ai_provider
from app.ai.pipelines.syllabus_parser import SyllabusParserPipeline
from app.ai.pipelines.mindmap_generator import MindmapGeneratorPipeline
from app.ai.pipelines.flashcard_generator import FlashcardGeneratorPipeline
from app.ai.pipelines.note_summarizer import NoteSummarizerPipeline
from app.ai.schemas import (
    SyllabusParseResponse,
    MindmapGenerationResponse,
    FlashcardGenerationResponse,
    NoteSummaryResponse,
)


@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    await init_db()
    yield


@pytest.mark.asyncio
async def test_ai_factory_and_mock_provider():
    provider = get_ai_provider()

    syllabus_pipeline = SyllabusParserPipeline(provider)
    syllabus_res = await syllabus_pipeline.parse_syllabus(raw_text="Ementa: Física I, 4 créditos...")
    assert isinstance(syllabus_res, SyllabusParseResponse)
    assert len(syllabus_res.weekly_schedule) > 0

    mindmap_pipeline = MindmapGeneratorPipeline(provider)
    mindmap_res = await mindmap_pipeline.generate_mindmap("Derivadas e Integrais")
    assert isinstance(mindmap_res, MindmapGenerationResponse)
    assert len(mindmap_res.nodes) > 0
    assert len(mindmap_res.edges) > 0

    flashcard_pipeline = FlashcardGeneratorPipeline(provider)
    flashcard_res = await flashcard_pipeline.generate_flashcards("Conteúdo de Bioquímica...")
    assert isinstance(flashcard_res, FlashcardGenerationResponse)
    assert len(flashcard_res.flashcards) > 0

    summary_pipeline = NoteSummarizerPipeline(provider)
    summary_res = await summary_pipeline.summarize_note("Aula sobre Mecânica Clássica...")
    assert isinstance(summary_res, NoteSummaryResponse)
    assert len(summary_res.bullet_summary) > 0


@pytest.mark.asyncio
async def test_api_endpoints():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        root_res = await client.get("/")
        assert root_res.status_code == 200
        assert root_res.json()["app"] == "AzureRose API"

        health_res = await client.get("/health")
        assert health_res.status_code == 200

        config_res = await client.get("/api/v1/ai/config")
        assert config_res.status_code == 200
        assert config_res.json()["is_mock"] is True

        mindmap_res = await client.post(
            "/api/v1/ai/mindmap/generate",
            json={"content": "Limites e Derivadas", "title": "Cálculo I"}
        )
        assert mindmap_res.status_code == 200
        data = mindmap_res.json()
        assert "nodes" in data and len(data["nodes"]) > 0

        flash_res = await client.post(
            "/api/v1/ai/flashcards/generate",
            json={"content": "Regras de Derivação", "quantity": 4}
        )
        assert flash_res.status_code == 200
        assert len(flash_res.json()["flashcards"]) > 0

        register_res = await client.post(
            "/api/v1/auth/register",
            json={"email": "aluna@azurerose.example.com", "password": "senha-forte-123"},
        )
        assert register_res.status_code == 200
        token = register_res.json()["access_token"]
        auth_headers = {"Authorization": f"Bearer {token}"}

        me_res = await client.get("/api/v1/auth/me", headers=auth_headers)
        assert me_res.status_code == 200
        assert me_res.json()["email"] == "aluna@azurerose.example.com"

        unauth_res = await client.get("/api/v1/workspace/notes")
        assert unauth_res.status_code == 401

        create_note = await client.post(
            "/api/v1/workspace/notes",
            json={"title": "Primeira Aula de Física", "content": "# Cinemática Vetorial"},
            headers=auth_headers,
        )
        assert create_note.status_code == 200
        note_id = create_note.json()["id"]

        list_notes = await client.get("/api/v1/workspace/notes", headers=auth_headers)
        assert list_notes.status_code == 200
        assert any(n["id"] == note_id for n in list_notes.json())

        create_task = await client.post(
            "/api/v1/calendar/tasks",
            json={"title": "Fazer Lista 1 de Exercícios", "priority": "high", "estimated_minutes": 45},
            headers=auth_headers,
        )
        assert create_task.status_code == 200
        task_id = create_task.json()["id"]

        list_tasks = await client.get("/api/v1/calendar/tasks", headers=auth_headers)
        assert list_tasks.status_code == 200
        assert any(t["id"] == task_id for t in list_tasks.json())
