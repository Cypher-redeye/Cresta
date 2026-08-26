# chatbot/memory.py
"""
Conversation memory using Django's cache framework.
Works transparently with LocMemCache (dev) and RedisCache (prod).
No dependency on langchain-community's RedisChatMessageHistory.
"""
import json
import logging
from django.core.cache import cache

logger = logging.getLogger(__name__)

# Max conversation turns to keep (each turn = 1 user + 1 assistant message)
MAX_TURNS = 10
CACHE_TTL = 86400  # 24 hours


def _cache_key(user_id: str) -> str:
    return f"chat:{user_id}"


def get_chat_history(user_id: str) -> list:
    """
    Retrieve conversation history for a user.
    Returns list of dicts: [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}, ...]
    """
    try:
        data = cache.get(_cache_key(user_id))
        if data:
            return json.loads(data)
    except Exception as e:
        logger.warning(f"Failed to read chat history for user {user_id}: {e}")
    return []


def save_chat_history(user_id: str, history: list):
    """
    Save conversation history for a user.
    Keeps only the last MAX_TURNS * 2 messages (user + assistant per turn).
    """
    try:
        # Trim to max turns
        trimmed = history[-(MAX_TURNS * 2):]
        cache.set(_cache_key(user_id), json.dumps(trimmed), timeout=CACHE_TTL)
    except Exception as e:
        logger.warning(f"Failed to save chat history for user {user_id}: {e}")


def add_messages(user_id: str, user_message: str, assistant_message: str):
    """
    Append a user/assistant message pair to the conversation history.
    """
    history = get_chat_history(user_id)
    history.append({"role": "user", "content": user_message})
    history.append({"role": "assistant", "content": assistant_message})
    save_chat_history(user_id, history)


def clear_chat_history(user_id: str):
    """Clear conversation history for a user."""
    try:
        cache.delete(_cache_key(user_id))
    except Exception as e:
        logger.warning(f"Failed to clear chat history for user {user_id}: {e}")


def history_to_langchain_messages(history: list):
    """
    Convert stored history to LangChain message format.
    Returns list of tuples: [("human", "..."), ("ai", "..."), ...]
    """
    messages = []
    for msg in history:
        if msg["role"] == "user":
            messages.append(("human", msg["content"]))
        elif msg["role"] == "assistant":
            messages.append(("ai", msg["content"]))
    return messages
