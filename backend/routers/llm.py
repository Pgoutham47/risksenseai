"""LLM streaming proxy routes."""
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
import httpx

from config import settings

router = APIRouter(prefix="/api/claude", tags=["llm"])

# Module-level mutable key; can be overridden at runtime via the set key endpoint.
_llm_api_key: str = settings.OPENAI_API_KEY


@router.post("/key")
async def set_llm_key(request: Request):
    global _llm_api_key
    body = await request.json()
    _llm_api_key = body.get("key", "")
    return {"status": "ok", "key_set": bool(_llm_api_key)}


@router.get("/key")
def get_llm_key_status():
    return {"key_set": bool(_llm_api_key)}


@router.post("/stream")
async def llm_stream(request: Request):
    global _llm_api_key
    if not _llm_api_key:
        raise HTTPException(status_code=400, detail="No API key configured")
    body = await request.json()

    messages = []
    system_text = body.get("system", "")
    if system_text:
        messages.append({"role": "system", "content": system_text})
    for msg in body.get("messages", []):
        messages.append(msg)

    async def generate():
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {_llm_api_key}",
                },
                json={
                    "model": body.get("model", "gpt-4o"),
                    "max_tokens": body.get("max_tokens", 4096),
                    "stream": True,
                    "messages": messages,
                },
            ) as resp:
                async for line in resp.aiter_lines():
                    if line.strip():
                        yield line + "\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
