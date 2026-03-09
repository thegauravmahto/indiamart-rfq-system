"""Configuration constants for IndiaMART AI-Powered RFQ System."""

# --- LLM Configuration ---
GEMINI_MODEL = "gemini-2.0-flash"
EMBEDDING_MODEL = "text-embedding-004"

# --- Conversation Limits ---
MAX_CONVERSATION_TURNS = 5
MAX_FOLLOW_UP_QUESTIONS = 4  # Max questions the RFQ builder will ask per session

# --- Supplier Matching ---
MAX_SUPPLIER_RESULTS = 7
SUPPLIER_SCORE_WEIGHTS = {
    "category_match": 0.35,
    "semantic_relevance": 0.25,
    "trust_score": 0.20,
    "location_score": 0.10,
    "response_rate": 0.10,
}

# --- Classification ---
CLASSIFICATION_CONFIDENCE_THRESHOLD = 0.7

# --- App Identity ---
APP_NAME = "indiamart_rfq_system"
APP_DISPLAY_NAME = "IndiaMART AI-Powered RFQ System"
APP_VERSION = "0.1.0-prototype"
