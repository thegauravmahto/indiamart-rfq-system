# IndiaMART AI-Powered RFQ System - Prototype

## Overview

Multi-agent AI system that converts vague buyer queries into structured RFQs
and matches relevant suppliers from the IndiaMART catalog. Built with Google ADK
(Agent Development Kit) and Gemini 2.0 Flash.

### The Problem
70%+ of buyer queries on IndiaMART are vague (e.g., "need packaging machine").
This leads to poor supplier matching, irrelevant RFQs, and low conversion rates.

### The Solution
An AI-powered pipeline that:
1. **Understands intent** -- even from Hindi/Hinglish queries
2. **Asks smart follow-ups** -- category-aware, prioritized questions
3. **Builds structured RFQs** -- complete with specs, budget, delivery details
4. **Matches suppliers** -- scored and ranked by relevance, trust, and location

## Architecture

```
Buyer Query --> [Intent Classifier] --> [RFQ Builder] --> [Supplier Matcher]
                       |                      |                    |
                  Classifies L1/L2/L3    Asks follow-ups     Searches & ranks
                  category + intent      Builds struct RFQ   supplier matches
```

### Agent Pipeline

| Agent | Role | Tools | Output |
|-------|------|-------|--------|
| **Intent Classifier** | Maps query to IndiaMART L1/L2/L3 taxonomy | `classify_category` | Category + confidence |
| **RFQ Builder** | Conversational follow-ups to build structured RFQ | `get_category_questions`, `generate_rfq_json` | Structured RFQ JSON |
| **Supplier Matcher** | Semantic matching against supplier catalog | `search_suppliers` | Ranked supplier list |
| **Orchestrator** | Google ADK SequentialAgent coordinating the pipeline | -- | End-to-end flow |

## Tech Stack

- **Google ADK** (Agent Development Kit) -- Multi-agent orchestration
- **Gemini 2.0 Flash** -- LLM for all agents
- **Pydantic v2** -- Data validation and serialization
- **Python 3.11+** -- Runtime

## Project Structure

```
indiamart_rfq_prototype/
|-- README.md              # This file
|-- requirements.txt       # Python dependencies
|-- config.py              # Configuration constants
|-- models.py              # Pydantic data models (enums, schemas)
|-- mock_data.py           # Mock supplier DB + category taxonomy + question templates
|-- tools.py               # Function-calling tools for agents
|-- agents.py              # All 3 agents + orchestrator (Google ADK)
|-- main.py                # Interactive CLI demo
```

## Setup

### Prerequisites
- Python 3.11 or higher
- A Google AI API key (Gemini access)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/thegauravmahto/indiamart-rfq-system.git
cd indiamart-rfq-system

# 2. Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # Linux/Mac

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set your Gemini API key
export GOOGLE_API_KEY="your_gemini_api_key_here"

# 5. Run the demo
python main.py
```

## Usage

### Interactive CLI Demo

```bash
python main.py
```

**Example session:**

```
============================================================
  IndiaMART AI-Powered RFQ System
  Type your buying requirement (or 'quit' to exit)
============================================================

You: Need packaging machine for chips packets

Assistant: I can see you are looking for a Packaging Machine under
Industrial Machinery. Let me ask a few questions to find the best match:

1. What type of packaging machine do you need?
   - Form Fill Seal (FFS)
   - Flow Wrap
   - Shrink Wrap
   - Vacuum Packaging

2. What is your required throughput (packs/min)?
3. Do you need Fully Automatic or Semi-Automatic?
4. What is your approximate budget range?

You: FFS machine, fully automatic, 40-60 packs per min, budget around 15 lakh

Assistant: Here is your structured RFQ and matched suppliers:

--- RFQ Summary ---
Title: Fully Automatic FFS Packaging Machine
Category: Industrial Machinery > Packaging Machinery > Form Fill Seal (FFS)
Specs: Throughput 40-60 packs/min, Fully Automatic
Budget: 10-15 Lakh INR
Completeness: 92%

--- Top Supplier Matches ---
1. PackTech Solutions (Noida) - Score: 94/100 - TrustSEAL
2. AutoPack Industries (Pune) - Score: 88/100 - TrustSEAL
3. ...
```

## Design Decisions

### Why Google ADK?
- Native SequentialAgent for multi-step pipelines
- Built-in session state management (agents share context)
- Function-calling tools with automatic schema generation
- Production-ready with Google Cloud integration path

### Why Gemini 2.0 Flash?
- Low latency for conversational interactions
- Strong multilingual support (Hindi, Hinglish)
- Cost-effective for high-volume B2B queries
- Native function calling support

### Mock Data vs Production
This prototype uses:
- **Keyword matching** for category classification (production: embeddings + vector search)
- **In-memory mock DB** for suppliers (production: ElasticSearch / AlloyDB)
- **Rule-based scoring** for supplier ranking (production: ML ranking model)

## Extending the Prototype

1. **Add real embeddings**: Replace keyword matching with `text-embedding-004`
2. **Connect to IndiaMART APIs**: Swap mock data for real supplier/category APIs
3. **Add conversation memory**: Use ADK session state for multi-turn context
4. **Deploy as API**: Wrap in FastAPI for integration with IndiaMART frontend
5. **Add evaluation**: Build test suite with real buyer queries + expected outputs
