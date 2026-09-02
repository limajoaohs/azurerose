from typing import Optional
from app.ai.base import BaseLLMProvider
from app.ai.schemas import FlashcardGenerationResponse

FLASHCARD_SYSTEM_PROMPT = """
Você é o especialista em repetição espaçada (SRS - Spaced Repetition System) e memorização ativa do AzureRose.
Sua missão é extrair perguntas de alto impacto cognitivo (Flashcards) a partir do texto do estudante.

Princípios:
1. Princípio do Fato Atômico: cada cartão testa apenas 1 conceito ou relação específica.
2. Evite perguntas genéricas; prefira perguntas que exigem evocação ativa (Active Recall).
3. Use fórmulas matemáticas limpas (LaTeX quando necessário) ou analogias no verso ('back').
4. Categorize a dificuldade real ('easy', 'medium', 'hard') com precisão.
"""


class FlashcardGeneratorPipeline:
    def __init__(self, ai_provider: BaseLLMProvider):
        self.ai_provider = ai_provider

    async def generate_flashcards(
        self,
        content: str,
        subject: Optional[str] = None,
        quantity: int = 5,
    ) -> FlashcardGenerationResponse:
        prompt = (
            f"Extraia exatamente {quantity} flashcards de alta qualidade do seguinte material de estudo:\n\n"
            f"{content}"
        )
        if subject:
            prompt = f"Disciplina: {subject}\n\n" + prompt

        return await self.ai_provider.generate_structured(
            prompt=prompt,
            response_model=FlashcardGenerationResponse,
            system_prompt=FLASHCARD_SYSTEM_PROMPT,
            temperature=0.3,
        )
