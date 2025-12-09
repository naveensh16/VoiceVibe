# voicevibe/llm.py
import os
import logging

logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

def run_llm(prompt: str) -> str:
    """Call your LLM. If GROQ_API_KEY present, call Groq; otherwise return fallback."""
    prompt = (prompt or "").strip()
    if not prompt:
        return "Please ask something."

    logger.info(f"[LLM] API Key present: {bool(GROQ_API_KEY)}, Key length: {len(GROQ_API_KEY) if GROQ_API_KEY else 0}")
    
    if GROQ_API_KEY:
        try:
            from groq import Groq
            logger.info(f"[LLM] Creating Groq client...")
            client = Groq(api_key=GROQ_API_KEY)
            
            logger.info(f"[LLM] Calling model: llama-3.3-70b-versatile with prompt: {prompt[:50]}...")
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=1,
                max_completion_tokens=1024,
                top_p=1,
                stream=False,
                stop=None
            )
            logger.info(f"[LLM] Got response successfully")
            return completion.choices[0].message.content
        except ImportError as e:
            logger.error(f"[LLM] Import error: {e}")
            return "Groq SDK not installed; using fallback"
        except Exception as e:
            logger.error(f"[LLM] Exception type: {type(e).__name__}")
            logger.error(f"[LLM] Exception message: {str(e)}")
            logger.exception("[LLM] Full traceback:")
            return f"I'm sorry — LLM call failed: {type(e).__name__}: {str(e)[:200]}"
    
    # Fallback (no API key or error) — friendly local response
    logger.warning("[LLM] No API key configured, using fallback")
    return f"You said: {prompt}. (Server running in fallback mode; no LLM configured.)"
