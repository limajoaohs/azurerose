import logging
from app.core.config import settings
from app.ai.base import BaseLLMProvider
from app.ai.providers.mock_provider import MockLLMProvider
from app.ai.providers.gemini_provider import GeminiLLMProvider
from app.ai.providers.openai_compatible_provider import OpenAICompatibleProvider

logger = logging.getLogger(__name__)


def get_ai_provider() -> BaseLLMProvider:
    provider_name = settings.AI_PROVIDER.lower()

    if provider_name == "gemini":
        if not settings.GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY não encontrada, caindo para MockLLMProvider.")
            return MockLLMProvider()
        return GeminiLLMProvider(
            api_key=settings.GEMINI_API_KEY,
            model=settings.GEMINI_MODEL,
        )

    elif provider_name in ("openai", "openai_compatible"):
        return OpenAICompatibleProvider(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL,
            model=settings.OPENAI_MODEL,
        )

    elif provider_name in ("local_vllm", "ollama", "custom_model"):
        return OpenAICompatibleProvider(
            api_key="local-token",
            base_url=settings.LOCAL_LLM_URL,
            model=settings.LOCAL_LLM_MODEL,
        )

    return MockLLMProvider()
