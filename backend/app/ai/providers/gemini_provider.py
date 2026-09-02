import json
import logging
from typing import Type, TypeVar, Optional
import httpx
from pydantic import BaseModel

from app.ai.base import BaseLLMProvider

logger = logging.getLogger(__name__)
T = TypeVar("T", bound=BaseModel)


class GeminiLLMProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model: str = "gemini-2.0-flash"):
        self.api_key = api_key
        self.model = model
        self.base_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"

    async def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> str:
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY não configurada no .env")

        contents = [{"parts": [{"text": prompt}]}]
        body: dict = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
            }
        }
        if max_tokens:
            body["generationConfig"]["maxOutputTokens"] = max_tokens
            
        if system_prompt:
            body["systemInstruction"] = {
                "parts": [{"text": system_prompt}]
            }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.base_url}?key={self.api_key}",
                json=body,
                headers={"Content-Type": "application/json"},
            )
            response.raise_for_status()
            data = response.json()
            try:
                return data["candidates"][0]["content"]["parts"][0]["text"]
            except (KeyError, IndexError) as e:
                logger.error(f"Erro ao extrair resposta do Gemini: {data}")
                raise RuntimeError(f"Resposta inválida do Gemini: {e}")

    async def generate_structured(
        self,
        prompt: str,
        response_model: Type[T],
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
    ) -> T:
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY não configurada no .env")

        schema = response_model.model_json_schema()
        
        sys_instruction = system_prompt or "Você é o núcleo inteligente AzureRose. Responda estritamente no esquema JSON solicitado."
        formatted_prompt = f"{prompt}\n\nRetorne ESTRITAMENTE um objeto JSON válido correspondente ao seguinte esquema:\n{json.dumps(schema, ensure_ascii=False)}"

        contents = [{"parts": [{"text": formatted_prompt}]}]
        body = {
            "contents": contents,
            "systemInstruction": {"parts": [{"text": sys_instruction}]},
            "generationConfig": {
                "temperature": temperature,
                "responseMimeType": "application/json",
            }
        }

        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(
                f"{self.base_url}?key={self.api_key}",
                json=body,
                headers={"Content-Type": "application/json"},
            )
            response.raise_for_status()
            data = response.json()
            raw_json_text = data["candidates"][0]["content"]["parts"][0]["text"]
            
            cleaned_text = raw_json_text.strip()
            if cleaned_text.startswith("```"):
                lines = cleaned_text.splitlines()
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                cleaned_text = "\n".join(lines).strip()

            parsed_dict = json.loads(cleaned_text)
            return response_model.model_validate(parsed_dict)
