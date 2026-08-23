"""Test the new manual tool-calling approach (no langgraph)."""
import os
from dotenv import load_dotenv
load_dotenv()

api_key = os.environ.get("GEMINI_API_KEY", "")

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, ToolMessage
import json

@tool
def get_greeting(name: str) -> str:
    """Get a personalized greeting for the user."""
    return f"User's name is {name}. They have 3 stocks: RELIANCE.NS, TCS.NS, INFY.NS."

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    api_key=api_key,
    temperature=0.3,
)

llm_with_tools = llm.bind_tools([get_greeting])

messages = [HumanMessage(content="Hello, my name is Om. What do I have?")]

print("=== Round 1: Send message ===")
response = llm_with_tools.invoke(messages)

if response.tool_calls:
    print(f"  Tool calls: {[tc['name'] for tc in response.tool_calls]}")
    messages.append(response)

    for tc in response.tool_calls:
        result = get_greeting.invoke(tc["args"])
        messages.append(ToolMessage(content=str(result), tool_call_id=tc["id"]))
        print(f"  Tool result: {result}")

    print("\n=== Round 2: Process tool results ===")
    response2 = llm_with_tools.invoke(messages)
    print(f"  Final response: {response2.content[:200]}")
else:
    print(f"  Direct response: {response.content[:200]}")

print("\nDone! Chatbot should work now.")
