import io
import logging
from typing import Optional
from pypdf import PdfReader

from app.ai.base import BaseLLMProvider
from app.ai.schemas import SyllabusParseResponse

logger = logging.getLogger(__name__)

SYLLABUS_SYSTEM_PROMPT = """
Você é o analisador de ementas acadêmicas do AzureRose ("O Cérebro").
Sua missão é transformar ementas universitárias ou programas de matérias densas em um cronograma semanal de estudos realista, estruturado e acionável.

Instruções:
1. Identifique o nome da disciplina, professor e objetivos principais.
2. Distribua o conteúdo ao longo das semanas típicas de um semestre letivo (normalmente 14 a 18 semanas).
3. Identifique as datas ou semanas prováveis de avaliações (Provas P1, P2, P3, Trabalhos, Seminários) e seus respectivos pesos.
4. Para cada semana, defina um tema claro, subtópicos específicos e estime uma carga horária de estudo semanal recomendada.
5. Retorne as informações estritamente formatadas de acordo com o esquema solicitado.
"""


class SyllabusParserPipeline:
    def __init__(self, ai_provider: BaseLLMProvider):
        self.ai_provider = ai_provider

    def extract_text_from_pdf_bytes(self, pdf_bytes: bytes) -> str:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        extracted_pages = []
        for index, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                extracted_pages.append(f"--- Página {index + 1} ---\n{text}")
        return "\n\n".join(extracted_pages)

    async def parse_syllabus(
        self,
        raw_text: Optional[str] = None,
        pdf_bytes: Optional[bytes] = None,
        course_hint: Optional[str] = None,
    ) -> SyllabusParseResponse:
        content = ""
        if pdf_bytes:
            content = self.extract_text_from_pdf_bytes(pdf_bytes)
        elif raw_text:
            content = raw_text.strip()

        if not content:
            raise ValueError("Nenhum conteúdo fornecido (nem texto, nem PDF).")

        prompt = f"Analise a seguinte ementa de disciplina e gere o plano semestral de estudos completo:\n\n{content}"
        if course_hint:
            prompt = f"Disciplina informada pelo aluno: {course_hint}\n\n" + prompt

        result = await self.ai_provider.generate_structured(
            prompt=prompt,
            response_model=SyllabusParseResponse,
            system_prompt=SYLLABUS_SYSTEM_PROMPT,
            temperature=0.2,
        )
        return result
