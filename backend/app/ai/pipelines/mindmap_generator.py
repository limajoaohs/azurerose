from typing import Optional
from app.ai.base import BaseLLMProvider
from app.ai.schemas import MindmapGenerationResponse

MINDMAP_SYSTEM_PROMPT = """
Você é o construtor visual de mapas conceituais do AzureRose ("O Olho").
Sua função é sintetizar notas de estudo em uma estrutura de grafo rica para renderização no React Flow.

Regras para os nós (Nodes):
1. Crie um nó central ('core_topic') com o conceito principal.
2. Divida em ramos secundários ('subtopic') bem conectados.
3. Destaque fórmulas matemáticas importantes com a categoria 'formula'.
4. Adicione exemplos práticos com a categoria 'example'.
5. Destaque armadilhas conceituais ou alertas frequentes em provas com a categoria 'warning'.

Regras para as arestas (Edges):
1. Conecte nós lógicos com setas direcionadas.
2. Sempre forneça a 'relation' (rótulo explicativo do porquê os nós estão ligados, ex: 'implica em', 'caso especial de', 'calculado por').
"""


class MindmapGeneratorPipeline:
    def __init__(self, ai_provider: BaseLLMProvider):
        self.ai_provider = ai_provider

    async def generate_mindmap(
        self,
        content: str,
        title_hint: Optional[str] = None,
    ) -> MindmapGenerationResponse:
        prompt = f"Gere o mapa conceitual e conexões a partir das seguintes anotações:\n\n{content}"
        if title_hint:
            prompt = f"Título sugerido: {title_hint}\n\n" + prompt

        return await self.ai_provider.generate_structured(
            prompt=prompt,
            response_model=MindmapGenerationResponse,
            system_prompt=MINDMAP_SYSTEM_PROMPT,
            temperature=0.3,
        )
