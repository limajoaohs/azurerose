import re
import logging
from typing import Type, TypeVar, Optional
from pydantic import BaseModel

from app.ai.base import BaseLLMProvider
from app.ai.schemas import (
    FlashcardGenerationResponse,
    FlashcardItem,
    MindmapGenerationResponse,
    MindmapNode,
    MindmapEdge,
    SyllabusParseResponse,
    StudyWeek,
    ExamMilestone,
    NoteSummaryResponse,
    ActionableTask,
)

logger = logging.getLogger(__name__)
T = TypeVar("T", bound=BaseModel)


def _extract_content(prompt: str) -> str:
    matches = list(re.finditer(r":\n\n", prompt))
    if matches:
        return prompt[matches[-1].end():]
    return prompt


def _extract_headings(text: str):
    headings = []
    for line in text.splitlines():
        m = re.match(r"^(#{1,3})\s+(.+)", line.strip())
        if m:
            headings.append((len(m.group(1)), m.group(2).strip()))
    return headings


def _extract_math(text: str):
    return [e.strip() for e in re.findall(r"\$\$(.+?)\$\$", text, re.DOTALL) if e.strip()]


def _extract_checklist(text: str):
    items = []
    for line in text.splitlines():
        m = re.match(r"^- \[( |x)\]\s+(.+)", line.strip())
        if m:
            items.append(m.group(2).strip())
    return items


def _plain_lines(text: str):
    lines = []
    for line in text.splitlines():
        s = line.strip()
        if not s or s.startswith("#") or s.startswith("- [") or s.startswith("$$"):
            continue
        s = re.sub(r"^[-*]\s+", "", s)
        if s:
            lines.append(s)
    return lines


def _build_mindmap(prompt: str) -> MindmapGenerationResponse:
    content = _extract_content(prompt)
    headings = _extract_headings(content)
    math_exprs = _extract_math(content)

    hint_match = re.search(r"Título sugerido:\s*(.+)", prompt)
    hint_title = hint_match.group(1).strip() if hint_match else None

    h1 = next((h for lvl, h in headings if lvl == 1), None)
    lines = _plain_lines(content)
    central_topic = hint_title or h1 or (lines[0][:60] if lines else "Conteúdo da Nota")

    nodes = [MindmapNode(id="node-1", label=central_topic[:60], description="Tópico central da anotação", category="core_topic")]
    edges = []
    counter = 2

    subtopics = [h for lvl, h in headings if lvl >= 2][:5]
    if not subtopics:
        subtopics = lines[:4]

    last_id = "node-1"
    for sub in subtopics:
        node_id = f"node-{counter}"
        nodes.append(MindmapNode(id=node_id, label=sub[:60], description="Subtópico identificado na anotação", category="subtopic", parent_id="node-1"))
        edges.append(MindmapEdge(id=f"e1-{counter}", source="node-1", target=node_id, relation="aborda"))
        last_id = node_id
        counter += 1

    for expr in math_exprs[:3]:
        node_id = f"node-{counter}"
        nodes.append(MindmapNode(id=node_id, label=expr[:40], description="Fórmula extraída da anotação", category="formula", parent_id=last_id))
        edges.append(MindmapEdge(id=f"e-{last_id}-{counter}", source=last_id, target=node_id, relation="expressa por"))
        counter += 1

    if len(nodes) == 1:
        nodes.append(MindmapNode(id="node-2", label="Adicione mais conteúdo à nota", description="Escreva tópicos e subtítulos para a IA gerar conexões", category="example", parent_id="node-1"))
        edges.append(MindmapEdge(id="e1-2", source="node-1", target="node-2", relation="dica"))

    return MindmapGenerationResponse(title=central_topic[:80], central_topic=central_topic[:60], nodes=nodes, edges=edges)


def _build_flashcards(prompt: str, quantity: int) -> FlashcardGenerationResponse:
    content = _extract_content(prompt)
    headings = _extract_headings(content)
    math_exprs = _extract_math(content)
    checklist = _extract_checklist(content)

    subject_match = re.search(r"Disciplina.*?:\s*(.+)", prompt)
    subject = subject_match.group(1).strip() if subject_match else None

    cards = []
    for lvl, h in headings:
        if lvl >= 2 and len(cards) < quantity:
            cards.append(FlashcardItem(
                front=f'O que você lembra sobre "{h}"?',
                back=f"Revise o trecho da sua anotação sobre {h}.",
                tags=[h[:24]],
                difficulty="medium",
            ))

    for expr in math_exprs:
        if len(cards) < quantity:
            cards.append(FlashcardItem(
                front=f"Reproduza de memória: {expr[:60]}",
                back=expr,
                tags=["fórmula"],
                difficulty="hard",
            ))

    for item in checklist:
        if len(cards) < quantity:
            cards.append(FlashcardItem(
                front=f"Você já consegue: {item}?",
                back="Revise a anotação e marque como concluído quando dominar.",
                tags=["tarefa"],
                difficulty="easy",
            ))

    if not cards:
        for line in _plain_lines(content)[:quantity]:
            cards.append(FlashcardItem(
                front=f'Explique com suas palavras: "{line[:80]}"',
                back=line,
                tags=["revisão"],
                difficulty="medium",
            ))

    if not cards:
        cards.append(FlashcardItem(
            front="Adicione mais conteúdo à nota",
            back="A IA (mock) precisa de texto na anotação para gerar flashcards relevantes.",
            tags=["dica"],
            difficulty="easy",
        ))

    return FlashcardGenerationResponse(subject=subject, flashcards=cards[:max(quantity, 1)])


def _build_summary(prompt: str) -> NoteSummaryResponse:
    content = _extract_content(prompt)
    headings = _extract_headings(content)
    math_exprs = _extract_math(content)
    checklist = _extract_checklist(content)
    lines = _plain_lines(content)

    title = headings[0][1] if headings else (lines[0][:60] if lines else "Resumo da Anotação")

    bullet_summary = [h for _, h in headings[:5]] or lines[:5] or ["A nota ainda não tem conteúdo suficiente para resumir."]

    action_items = [
        ActionableTask(title=item, estimated_minutes=25, priority="medium") for item in checklist[:5]
    ] or [ActionableTask(title="Revisar o conteúdo desta nota", estimated_minutes=20, priority="medium")]

    follow_ups = [f'Como "{h}" se conecta com os outros tópicos desta nota?' for _, h in headings[1:4]]
    if not follow_ups:
        follow_ups = ["Quais pontos desta nota você explicaria de cabeça, sem consultar?"]

    return NoteSummaryResponse(
        title=title[:80],
        bullet_summary=bullet_summary,
        key_formulas_or_definitions=math_exprs[:5],
        action_items=action_items,
        follow_up_questions=follow_ups,
    )


def _build_syllabus(prompt: str) -> SyllabusParseResponse:
    hint_match = re.search(r"Disciplina informada pelo aluno:\s*(.+)", prompt)
    course_name = hint_match.group(1).strip() if hint_match else "Física Clássica e Mecânica Newtoniana"

    return SyllabusParseResponse(
        course_name=course_name,
        professor="Prof. Dr. Alexandre Silva",
        semester_weeks=16,
        key_objectives=[
            "Compreender as Leis de Newton e dinâmica de partículas",
            "Dominar conservação de energia e momento linear",
            "Analisar movimento harmônico simples e rotação de corpos rígidos",
        ],
        weekly_schedule=[
            StudyWeek(week_number=1, theme="Vetores e Cinemática 1D", topics=["Sistemas de coordenadas", "Deslocamento", "Velocidade média e instantânea", "MRUV"], recommended_study_hours=4),
            StudyWeek(week_number=2, theme="Cinemática 2D e 3D", topics=["Lançamento de projéteis", "Movimento circular uniforme", "Aceleração centrípeta"], recommended_study_hours=5),
            StudyWeek(week_number=3, theme="Dinâmica e Leis de Newton", topics=["Primeira, Segunda e Terceira Leis", "Forças de atrito", "Diagramas de corpo livre"], deliverables_or_exams="Lista de Exercícios 1", recommended_study_hours=6),
            StudyWeek(week_number=4, theme="Trabalho e Energia Cinética", topics=["Definição de trabalho", "Teorema do Trabalho e Energia", "Forças conservativas"], recommended_study_hours=5),
            StudyWeek(week_number=5, theme="Conservação de Energia", topics=["Energia Potencial Gravitacional e Elástica", "Gráficos de potencial"], recommended_study_hours=6),
            StudyWeek(week_number=6, theme="Primeira Avaliação (P1)", topics=["Revisão geral de Cinemática e Energia"], deliverables_or_exams="PROVA P1 (Peso 30%)", recommended_study_hours=8),
            StudyWeek(week_number=7, theme="Momento Linear e Colisões", topics=["Impulso", "Conservação do Momento", "Colisões Elásticas e Inelásticas"], recommended_study_hours=5),
            StudyWeek(week_number=8, theme="Centro de Massa e Sistemas", topics=["Cálculo do CM para sistemas discretos e contínuos", "Movimento do CM"], recommended_study_hours=4),
        ],
        exams_and_deadlines=[
            ExamMilestone(title="Prova 1 (P1)", estimated_week=6, weight="30%", topics_covered=["Cinemática", "Leis de Newton", "Energia"]),
            ExamMilestone(title="Prova 2 (P2)", estimated_week=12, weight="35%", topics_covered=["Momento Linear", "Rotações", "Momento de Inércia"]),
            ExamMilestone(title="Exame Final / Projeto", estimated_week=16, weight="35%", topics_covered=["Todo o conteúdo do semestre"]),
        ],
        suggested_reading=["Halliday, Resnick & Walker - Fundamentos de Física Vol. 1", "Tipler & Mosca - Física para Cientistas e Engenheiros Vol. 1"],
    )


class MockLLMProvider(BaseLLMProvider):
    async def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> str:
        logger.info("MockLLMProvider: generating mock text response")
        return f"[AzureRose Mock AI]: Resposta simulada para sua solicitação.\n\nCom base no seu conteúdo: '{prompt[:100]}...'\n\nRecomendamos focar nos conceitos fundamentais e criar conexões no Canvas."

    async def generate_structured(
        self,
        prompt: str,
        response_model: Type[T],
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
    ) -> T:
        logger.info(f"MockLLMProvider: generating mock structured response for {response_model.__name__}")

        if response_model == FlashcardGenerationResponse:
            quantity_match = re.search(r"exatamente (\d+) flashcards", prompt)
            quantity = int(quantity_match.group(1)) if quantity_match else 4
            return _build_flashcards(prompt, quantity)

        elif response_model == MindmapGenerationResponse:
            return _build_mindmap(prompt)

        elif response_model == SyllabusParseResponse:
            return _build_syllabus(prompt)

        elif response_model == NoteSummaryResponse:
            return _build_summary(prompt)

        try:
            return response_model()
        except Exception:
            raise ValueError(f"Não há mock definido para o modelo {response_model.__name__}")
