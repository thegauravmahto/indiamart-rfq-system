# IndiaMART AI-Powered RFQ System

Multi-agent AI system that converts vague buyer queries into structured RFQs and matches relevant suppliers from the IndiaMART catalog. Includes a **production-ready frontend demo** and a **Python backend prototype**, both powered by Google Gemini.

---

## The Problem

70%+ of buyer queries on IndiaMART are vague (e.g., "need packaging machine"). This leads to poor supplier matching, irrelevant RFQs, and low conversion rates.

## The Solution

An AI-powered pipeline that:

1. **Understands intent** -- even from Hindi/Hinglish queries
2. **Asks smart follow-ups** -- category-aware, prioritized questions
3. **Builds structured RFQs** -- complete with specs, budget, delivery details
4. **Matches suppliers** -- scored and ranked by relevance, trust, and location

---

## Live Demo (Frontend)

The interactive frontend is a single-page Next.js application showcasing the full RFQ pipeline.

### Features

- **Guided Demo** -- Step-through a pre-built buyer conversation showing intent classification, RFQ generation, and supplier matching
- **Live AI Demo** -- Bring your own Gemini API key and have a real-time conversation with the AI RFQ builder (key never leaves the browser)
- **Structured RFQ Output** -- Auto-generated RFQ cards with extracted fields (product, specs, quantity, budget, delivery)
- **Supplier Matching** -- Scored supplier recommendations with ratings, location, and match confidence
- **Architecture Visualization** -- Interactive diagram of the multi-agent pipeline
- **Impact Metrics** -- Animated counters showing processing time, accuracy, and conversion improvements
- **Fully Responsive** -- Mobile-first design with IndiaMART brand theming

### Frontend Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 14** | React framework with App Router |
| **TypeScript** | Type safety across all components |
| **Tailwind CSS 3** | Utility-first styling with custom IndiaMART color palette |
| **Framer Motion** | Scroll-reveal and section animations |
| **Lucide React** | Icon library |
| **@google/genai** | Client-side Gemini API for the Live Demo |

### Frontend Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main landing page (hero, guided demo, architecture, metrics)
│   │   ├── layout.tsx        # Root layout with Inter font + metadata
│   │   └── globals.css       # Tailwind base + custom animations
│   ├── components/
│   │   └── LiveDemo.tsx      # Live AI chat component (API key input, multi-turn chat, RFQ parsing)
│   ├── hooks/
│   │   └── useScrollReveal.ts # Intersection Observer hooks for scroll animations
│   └── lib/
│       ├── demoData.ts       # Static demo conversation, RFQ, suppliers, metrics
│       └── geminiRFQ.ts      # Gemini SDK wrapper (chat session, RFQ extraction, supplier parsing)
├── package.json
├── tailwind.config.ts        # Custom IndiaMART color tokens
├── tsconfig.json
└── next.config.js
```

### Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No API key needed for the Guided Demo. For the Live Demo, enter a [Gemini API key](https://aistudio.google.com/apikey) when prompted.

### Deploying to Vercel

1. Push to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Set **Root Directory** to `frontend`
4. Deploy -- Vercel auto-detects Next.js

Every push to `main` triggers an automatic redeployment.

---

## Backend Prototype

The Python backend implements the full multi-agent pipeline using Google ADK.

### Architecture

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

### Backend Tech Stack

- **Google ADK** (Agent Development Kit) -- Multi-agent orchestration
- **Gemini 2.0 Flash** -- LLM for all agents
- **Pydantic v2** -- Data validation and serialization
- **Python 3.11+** -- Runtime

### Backend Structure

```
indiamart_rfq_prototype/
├── config.py              # Configuration constants
├── models.py              # Pydantic data models (enums, schemas)
├── mock_data.py           # Mock supplier DB + category taxonomy + question templates
├── tools.py               # Function-calling tools for agents
├── agents.py              # All 3 agents + orchestrator (Google ADK)
├── main.py                # Interactive CLI demo
└── requirements.txt       # Python dependencies
```

### Running the Backend

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Set your Gemini API key
export GOOGLE_API_KEY="your_gemini_api_key_here"

# Run the interactive CLI
python main.py
```

**Example session:**

```
============================================================
  IndiaMART AI-Powered RFQ System
  Type your buying requirement (or 'quit' to exit)
============================================================

You: Need packaging machine for chips packets

AI: I can help you find the right packaging machine. Let me ask a few questions:
    1. What's your production volume (packets/hour)?
    2. What packet sizes do you need?
    3. Do you need nitrogen flushing?

[Intent: L1=Industrial Machinery, L2=Packaging, L3=Food Packaging Machines]
[Confidence: 0.94]
```

---

## Key Design Decisions

- **Client-side Gemini calls** -- The Live Demo runs Gemini directly in the browser via `@google/genai`. No backend needed, no API key stored server-side.
- **Guided + Live dual demo** -- The guided walkthrough works without any API key (static data), while the live demo proves real AI capability.
- **IndiaMART brand theming** -- Custom Tailwind color tokens (`im-blue`, `im-teal`, etc.) match the actual IndiaMART design language.
- **Multi-agent architecture** -- Each agent (classifier, builder, matcher) is independently testable and swappable.

---

## License

MIT

---

Built by [Gaurav Mahto](https://github.com/thegauravmahto)
