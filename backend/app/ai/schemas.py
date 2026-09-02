from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class FlashcardItem(BaseModel):
    front: str = Field(..., description="Pergunta, conceito chave ou problema a resolver")
    back: str = Field(..., description="Resposta detalhada, fórmula, explicação ou demonstração")
    tags: List[str] = Field(default_factory=list, description="Tópicos relacionados")
    difficulty: Literal["easy", "medium", "hard"] = "medium"


class FlashcardGenerationRequest(BaseModel):
    content: str = Field(..., description="Conteúdo da anotação ou texto para extração de flashcards")
    subject: Optional[str] = Field(None, description="Nome da disciplina (ex: Cálculo I, Bioquímica)")
    quantity: int = Field(default=5, ge=1, le=30, description="Quantidade de flashcards a gerar")


class FlashcardGenerationResponse(BaseModel):
    subject: Optional[str] = None
    flashcards: List[FlashcardItem]


class MindmapNode(BaseModel):
    id: str = Field(..., description="Identificador único do nó (ex: 'node-1')")
    label: str = Field(..., description="Título ou conceito principal do nó")
    description: Optional[str] = Field(None, description="Resumo explicativo do conceito")
    category: Literal["core_topic", "subtopic", "formula", "example", "warning"] = "subtopic"
    parent_id: Optional[str] = Field(None, description="ID do nó pai, se aplicável")


class MindmapEdge(BaseModel):
    id: str = Field(..., description="Identificador único da aresta (ex: 'e1-2')")
    source: str = Field(..., description="ID do nó de origem")
    target: str = Field(..., description="ID do nó de destino")
    relation: Optional[str] = Field(None, description="Relação/conector (ex: 'depende de', 'aplica-se em', 'exemplo')")


class MindmapGenerationRequest(BaseModel):
    content: str = Field(..., description="Conteúdo das anotações ou matéria")
    title: Optional[str] = Field(None, description="Título principal do mapa")


class MindmapGenerationResponse(BaseModel):
    title: str
    central_topic: str
    nodes: List[MindmapNode]
    edges: List[MindmapEdge]


class StudyWeek(BaseModel):
    week_number: int = Field(..., description="Número da semana (1, 2, 3...)")
    theme: str = Field(..., description="Tema ou módulo da semana")
    topics: List[str] = Field(..., description="Tópicos detalhados a serem estudados")
    deliverables_or_exams: Optional[str] = Field(None, description="Provas, entregas ou listas dessa semana")
    recommended_study_hours: int = Field(default=4, description="Estimativa de horas de estudo dedicadas")


class ExamMilestone(BaseModel):
    title: str = Field(..., description="Ex: 'Prova 1 (P1)', 'Entrega de Trabalho Final'")
    estimated_week: Optional[int] = Field(None, description="Semana prevista para a avaliação")
    weight: Optional[str] = Field(None, description="Peso ou porcentagem da nota final")
    topics_covered: List[str] = Field(default_factory=list, description="Conteúdos cobrados")


class SyllabusParseResponse(BaseModel):
    course_name: str = Field(..., description="Nome da disciplina identificada na ementa")
    professor: Optional[str] = Field(None, description="Nome do docente/professor")
    semester_weeks: int = Field(default=16, description="Total de semanas estimadas")
    key_objectives: List[str] = Field(default_factory=list, description="Objetivos centrais de aprendizagem")
    weekly_schedule: List[StudyWeek] = Field(..., description="Cronograma semanal estruturado")
    exams_and_deadlines: List[ExamMilestone] = Field(default_factory=list, description="Datas de provas e entregas")
    suggested_reading: List[str] = Field(default_factory=list, description="Bibliografia ou referências")


class ActionableTask(BaseModel):
    title: str
    estimated_minutes: int = 25
    priority: Literal["low", "medium", "high"] = "medium"


class NoteSummaryResponse(BaseModel):
    title: str
    bullet_summary: List[str]
    key_formulas_or_definitions: List[str] = Field(default_factory=list)
    action_items: List[ActionableTask] = Field(default_factory=list)
    follow_up_questions: List[str] = Field(default_factory=list)
