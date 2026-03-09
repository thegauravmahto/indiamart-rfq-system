"""IndiaMART AI-Powered RFQ System -- Interactive CLI Demo.

Run: python main.py

Demonstrates the multi-agent pipeline:
1. Enter a vague buyer query (English, Hindi, or Hinglish)
2. AI classifies intent & category (Intent Classifier Agent)
3. AI asks smart follow-up questions (RFQ Builder Agent)
4. Structured RFQ is generated with completeness scoring
5. Matched suppliers are presented with ranking (Supplier Matcher Agent)

Prerequisites:
- pip install -r requirements.txt
- export GOOGLE_API_KEY=your_gemini_api_key
"""

import asyncio
import json
import os
import sys

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from agents import rfq_orchestrator
from config import APP_NAME, APP_DISPLAY_NAME, APP_VERSION


# =============================================================================
# SAMPLE QUERIES (shown to user as examples)
# =============================================================================

SAMPLE_QUERIES = [
    "Need packaging machine for chips packets",
    "mujhe cotton fabric chahiye 500 meter",
    "office chairs chahiye 50 pieces Noida delivery",
    "CNC lathe machine for steel parts, budget 20 lakh",
    "want custom printed t-shirts 1000 pieces with logo",
    "industrial adhesive for woodworking",
    "restaurant furniture -- chairs and tables for 20 tables",
    "PCB manufacturing for IoT product prototype",
]


# =============================================================================
# BANNER & UI
# =============================================================================

def print_banner():
    """Print the application banner."""
    print()
    print("=" * 64)
    print(f"  {APP_DISPLAY_NAME}")
    print(f"  Version: {APP_VERSION}")
    print("=" * 64)
    print()
    print("  Multi-Agent Pipeline:")
    print("  [1] Intent Classifier  -> Category mapping")
    print("  [2] RFQ Builder        -> Smart follow-ups + structured RFQ")
    print("  [3] Supplier Matcher   -> Ranked supplier recommendations")
    print()
    print("  Commands:")
    print("    Type your buying requirement to start")
    print("    'examples' - Show sample queries")
    print("    'state'    - Show current session state")
    print("    'quit'     - Exit the demo")
    print()
    print("-" * 64)


def print_examples():
    """Print sample queries."""
    print()
    print("  Sample Queries (copy-paste any of these):")
    print("  " + "-" * 50)
    for i, query in enumerate(SAMPLE_QUERIES, 1):
        print(f"  {i}. {query}")
    print()


# =============================================================================
# MAIN DEMO LOOP
# =============================================================================

async def run_demo():
    """Run the interactive RFQ demo."""

    # --- Check for API key ---
    if not os.environ.get("GOOGLE_API_KEY"):
        print()
        print("ERROR: GOOGLE_API_KEY environment variable not set.")
        print("Please set it with: export GOOGLE_API_KEY=your_key_here")
        print("Get a key from: https://aistudio.google.com/apikey")
        print()
        sys.exit(1)

    # --- Initialize ADK components ---
    session_service = InMemorySessionService()
    runner = Runner(
        agent=rfq_orchestrator,
        app_name=APP_NAME,
        session_service=session_service,
    )

    # Create a session for this demo
    session = await session_service.create_session(
        app_name=APP_NAME,
        user_id="demo_buyer",
    )

    print_banner()

    turn_count = 0

    while True:
        # --- Get user input ---
        try:
            user_input = input("\nYou: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n\nGoodbye!")
            break

        if not user_input:
            continue

        # --- Handle commands ---
        if user_input.lower() in ("quit", "exit", "q"):
            print("\nThank you for using IndiaMART AI RFQ System!")
            break

        if user_input.lower() == "examples":
            print_examples()
            continue

        if user_input.lower() == "state":
            await print_session_state(session_service, session.id)
            continue

        # --- Send to agent pipeline ---
        turn_count += 1
        print(f"\n{'.' * 40}")
        print(f"  Processing (turn {turn_count})...")
        print(f"{'.' * 40}")

        content = types.Content(
            role="user",
            parts=[types.Part.from_text(text=user_input)],
        )

        response_text = ""
        try:
            async for event in runner.run_async(
                user_id="demo_buyer",
                session_id=session.id,
                new_message=content,
            ):
                if event.is_final_response():
                    if event.content and event.content.parts:
                        for part in event.content.parts:
                            if part.text:
                                response_text += part.text
        except Exception as e:
            print(f"\n  Error: {e}")
            print("  Please try again with a different query.")
            continue

        if response_text:
            print(f"\nAssistant: {response_text}")
        else:
            print("\n  [No response received. Try rephrasing your query.]")

    # --- Print final session state ---
    await print_session_state(session_service, session.id)


async def print_session_state(session_service, session_id):
    """Print the current session state for debugging."""
    try:
        final_session = await session_service.get_session(
            app_name=APP_NAME,
            user_id="demo_buyer",
            session_id=session_id,
        )
    except Exception:
        print("\n  [Could not retrieve session state]")
        return

    if final_session and final_session.state:
        print()
        print("=" * 64)
        print("  SESSION STATE (Debug View)")
        print("=" * 64)
        for key, value in final_session.state.items():
            print(f"\n--- {key} ---")
            if isinstance(value, dict):
                print(json.dumps(value, indent=2, default=str)[:2000])
            elif isinstance(value, str) and len(value) > 500:
                print(value[:500] + "\n... [truncated]")
            else:
                print(value)
        print()
    else:
        print("\n  [Session state is empty -- no queries processed yet]")


# =============================================================================
# ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    print()
    print("Starting IndiaMART AI-Powered RFQ System...")
    asyncio.run(run_demo())
