from app.ai.base import BaseLLMProvider
from app.ai.schemas import NoteSummaryResponse

SUMMARIZER_SYSTEM_PROMPT = """
Você é o Copilot de Análise e Síntese Cognitiva do AzureRose ("O Cérebro").
Ao receber anotações de aula ou leituras, produza um resumo estruturado e acionável.

Diretrizes:
1. Destaque os pontos cruciais em 'bullet_summary'.
2. Extraia fórmulas, axiomas ou definições chave em 'key_formulas_or_definitions'.
3. Divida o estudo restante em micro-tarefas diárias com estimativa de tempo realista (20-45min) em 'action_items'.
4. Formule perguntas provocativas para testar se o aluno realmente assimilou o conteúdo em 'follow_up_questions'.
"""


class NoteSummarizerPipeline:
    def __init__(self, ai_provider: BaseLLMProvider):
        self.ai_provider = ai_provider

    async def summarize_note(self, content: str) -> NoteSummaryResponse:
        prompt = f"Analise e estruture a seguinte anotação:\n\n{content}"
        return await self.ai_provider.generate_structured(
            prompt=prompt,
            response_model=NoteSummaryResponse,
            system_prompt=SUMMARIZER_SYSTEM_PROMPT,
            temperature=0.2,
        )
