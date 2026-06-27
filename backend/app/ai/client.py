"""LLM client abstraction.

``LLMClient`` is a Protocol — the rest of the app depends on this interface,
not on any concrete provider SDK.  ``GeminiClient`` is the production
implementation; swap it in ``dependencies.py`` for tests or a different
provider without touching any business logic.
"""
from typing import Protocol, runtime_checkable


@runtime_checkable
class LLMClient(Protocol):
    def generate(self, prompt: str) -> str: ...
    def analyze_image(self, image_bytes: bytes, mime_type: str, prompt: str) -> str: ...


class GeminiClient:
    """Google Gemini 2.5 Flash via the google-genai SDK.

    google-genai is imported lazily inside each method so a missing package
    only breaks the AI endpoint, not the entire app startup.
    """

    MODEL = "gemini-2.5-flash"

    def __init__(self, api_key: str) -> None:
        from google import genai  # lazy — only when AI is actually used
        self._client = genai.Client(api_key=api_key)

    def generate(self, prompt: str) -> str:
        from google.genai import types
        response = self._client.models.generate_content(
            model=self.MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        return response.text

    def analyze_image(self, image_bytes: bytes, mime_type: str, prompt: str) -> str:
        from google.genai import types
        response = self._client.models.generate_content(
            model=self.MODEL,
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                prompt,
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        return response.text
