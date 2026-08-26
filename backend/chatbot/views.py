# chatbot/views.py
"""
SSE streaming chat endpoint for CRESTA's AI co-pilot.
Uses LangChain + Gemini 2.5 Flash with manual tool-calling loop.
No dependency on langgraph.
"""
import json
import logging
import os
import time

from django.http import StreamingHttpResponse, JsonResponse
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import UserRateThrottle

from .prompts import get_system_prompt
from .tools import CRESTA_TOOLS
from .memory import (
    get_chat_history,
    add_messages,
    clear_chat_history,
    history_to_langchain_messages,
)

logger = logging.getLogger(__name__)

GEMINI_MODEL = "gemini-2.5-flash"
MAX_TOOL_ROUNDS = 5  # Max tool-calling rounds before forcing a text response


class ChatRateThrottle(UserRateThrottle):
    """20 requests per hour per user for chat endpoint."""
    scope = 'chat'


def _build_llm(prefer_groq=True):
    """Build an LLM with tools bound. Defaults to Groq (ultra fast, high quota) as requested, with Gemini available."""
    gemini_key = os.environ.get('GEMINI_API_KEY', '').strip()
    groq_key = os.environ.get('GROQ_API_KEY', '').strip()

    if groq_key and prefer_groq:
        from langchain_groq import ChatGroq
        llm = ChatGroq(
            model=os.environ.get("GROQ_MODEL", "qwen/qwen3.8-27b"),
            api_key=groq_key,
            streaming=True,
            temperature=0.3,
        )
        return llm.bind_tools(CRESTA_TOOLS)

    if gemini_key:
        from langchain_google_genai import ChatGoogleGenerativeAI
        llm = ChatGoogleGenerativeAI(
            model=os.environ.get("GEMINI_MODEL", "gemini-2.5-flash"),
            api_key=gemini_key,
            streaming=True,
            temperature=0.3,
            max_retries=1,
        )
        return llm.bind_tools(CRESTA_TOOLS)

    if groq_key:
        from langchain_groq import ChatGroq
        llm = ChatGroq(
            model=os.environ.get("GROQ_MODEL", "qwen/qwen3.8-27b"),
            api_key=groq_key,
            streaming=True,
            temperature=0.3,
        )
        return llm.bind_tools(CRESTA_TOOLS)

    raise ValueError("Neither GROQ_API_KEY nor GEMINI_API_KEY is configured in .env")


def _execute_tool(tool_call: dict) -> str:
    """Execute a tool call and return the result as a string."""
    tool_name = tool_call["name"]
    tool_args = tool_call.get("args", {})

    # Find and execute the matching tool
    tool_map = {t.name: t for t in CRESTA_TOOLS}
    tool_fn = tool_map.get(tool_name)

    if not tool_fn:
        return json.dumps({"error": f"Unknown tool: {tool_name}"})

    try:
        result = tool_fn.invoke(tool_args)
        if isinstance(result, dict):
            return json.dumps(result, default=str)
        return str(result)
    except Exception as e:
        logger.error(f"Tool {tool_name} failed: {e}")
        return json.dumps({"error": f"Tool {tool_name} failed: {str(e)}"})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([ChatRateThrottle])
def chat_stream(request):
    """
    Streaming chat endpoint with manual tool-calling loop.

    POST /api/chat/
    Body: {"message": "What stocks do I hold?", "lang": "en"}

    Response: SSE stream
        data: {"token": "Based on..."}
        data: {"token": " your holdings..."}
        data: [DONE]
    """
    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    message = body.get("message", "").strip()
    lang = body.get("lang", "en")
    user_id = str(request.user.id)

    if not message:
        return JsonResponse({"error": "Message cannot be empty"}, status=400)

    if len(message) > 2000:
        return JsonResponse({"error": "Message too long (max 2000 characters)"}, status=400)

    # Validate API key early
    gemini_key = os.environ.get('GEMINI_API_KEY', '').strip()
    groq_key = os.environ.get('GROQ_API_KEY', '').strip()
    if not gemini_key and not groq_key:
        return JsonResponse(
            {"error": "Neither GEMINI_API_KEY nor GROQ_API_KEY is configured. Please set one in .env"},
            status=500,
        )

    # Get conversation history
    history = get_chat_history(user_id)
    chat_history = history_to_langchain_messages(history)

    # Build messages list
    from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage

    system_prompt = get_system_prompt(lang)
    system_prompt += f"\n\nCURRENT USER ID: {user_id}\n"
    system_prompt += "When calling tools that require user_id, always use this ID.\n"

    messages = [SystemMessage(content=system_prompt)]

    # Add chat history
    for role, content in chat_history:
        if role == "human":
            messages.append(HumanMessage(content=content))
        elif role == "ai":
            messages.append(AIMessage(content=content))

    # Add current message
    messages.append(HumanMessage(content=message))

    def event_stream():
        full_response = ""

        try:
            llm = _build_llm()
        except Exception as e:
            import traceback
            logger.error(f"Failed to build LLM: {traceback.format_exc()}")
            error_msg = f"AI service error: {str(e)}"
            yield f'data: {json.dumps({"token": error_msg})}\n\n'
            yield "data: [DONE]\n\n"
            return

        try:
            current_messages = list(messages)

            for round_num in range(MAX_TOOL_ROUNDS):
                logger.info(f"Chat round {round_num + 1} for user {user_id}")

                # Call the LLM (non-streaming for tool rounds, streaming for final) with automatic failover
                try:
                    response = llm.invoke(current_messages)
                except Exception as invoke_err:
                    err_str = str(invoke_err)
                    if ("429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "Quota" in err_str or "RemoteProtocolError" in err_str) and os.environ.get("GROQ_API_KEY"):
                        logger.warning(f"Primary LLM exhausted ({err_str[:60]}). Automatically failing over to Groq.")
                        llm = _build_llm(prefer_groq=True)
                        response = llm.invoke(current_messages)
                    else:
                        raise invoke_err

                # Check if the LLM wants to call tools
                if response.tool_calls:
                    logger.info(
                        f"Tool calls requested: "
                        f"{[tc['name'] for tc in response.tool_calls]}"
                    )

                    # Map tool names to clean human-readable labels
                    TOOL_LABELS = {
                        "get_portfolio": "Fetching your portfolio",
                        "get_forecast": "Running forecast model",
                        "get_risk_profile": "Analysing risk profile",
                        "get_market_data": "Fetching market data",
                        "create_alert": "Setting up alert",
                        "run_backtest": "Running backtest",
                        "get_news_sentiment": "Analysing market sentiment",
                    }
                    labels = [
                        TOOL_LABELS.get(tc["name"], tc["name"])
                        for tc in response.tool_calls
                    ]
                    # Don't send the indicator as part of the visible response
                    # It will be replaced by the final answer

                    # Add the AI message with tool calls to conversation
                    current_messages.append(response)

                    # Execute each tool and add results
                    for tc in response.tool_calls:
                        tool_result = _execute_tool(tc)
                        current_messages.append(
                            ToolMessage(
                                content=tool_result,
                                tool_call_id=tc["id"],
                            )
                        )

                    # Continue the loop — LLM will process tool results
                    continue

                else:
                    # No tool calls — this is the final text response
                    # Stream it token by token
                    text = ""
                    if isinstance(response.content, str):
                        text = response.content
                    elif isinstance(response.content, list):
                        text = "".join(
                            c.get("text", "")
                            for c in response.content
                            if isinstance(c, dict)
                        )

                    if text:
                        full_response += text
                        yield f'data: {json.dumps({"token": text})}\n\n'

                    break  # Done — exit the tool loop

        except Exception as e:
            import traceback
            err_trace = traceback.format_exc()
            logger.error(f"Chat stream error for user {user_id}: {err_trace}")

            error_msg = (
                "I'm having trouble processing your request right now. "
                "Please try again in a moment."
            )
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                error_msg = (
                    "The AI service is temporarily rate-limited. "
                    "Please wait a minute and try again."
                )

            full_response = error_msg
            yield f'data: {json.dumps({"token": error_msg})}\n\n'

        # Save conversation to memory
        if full_response:
            add_messages(user_id, message, full_response)

        yield "data: [DONE]\n\n"

    response = StreamingHttpResponse(
        event_stream(),
        content_type="text/event-stream"
    )
    response["Cache-Control"] = "no-cache"
    response["X-Accel-Buffering"] = "no"
    return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat_clear(request):
    """Clear conversation history for the current user."""
    user_id = str(request.user.id)
    clear_chat_history(user_id)
    return JsonResponse({"status": "cleared"})
