"""Pydantic data models for IndiaMART AI-Powered RFQ System.

Defines all enums, schemas, and data models used across the multi-agent pipeline:
- Classification models (intent, category)
- RFQ specification models
- Supplier matching models
- Category question models
"""

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# =============================================================================
# ENUMS
# =============================================================================


class QueryLanguage(str, Enum):
    """Detected language of the buyer query."""
    ENGLISH = "en"
    HINDI = "hi"
    HINGLISH = "hi-en"  # Mixed Hindi-English (very common on IndiaMART)
    OTHER = "other"


class IntentType(str, Enum):
    """Primary intent behind the buyer query."""
    BUY_PRODUCT = "buy_product"        # Wants to purchase a physical product
    FIND_SUPPLIER = "find_supplier"    # Looking for a supplier/manufacturer
    GET_PRICE = "get_price"            # Price inquiry / quotation request
    BUY_SERVICE = "buy_service"        # Wants a service (installation, AMC, etc.)
    UNCLEAR = "unclear"                # Cannot determine intent confidently


class SpecSource(str, Enum):
    """How a specification value was obtained."""
    BUYER_PROVIDED = "buyer_provided"  # Explicitly stated by the buyer
    AI_INFERRED = "ai_inferred"        # Inferred by AI from context
    DEFAULT = "default"                # Category default / common value


class MatchQuality(str, Enum):
    """Overall quality of supplier matching results."""
    EXCELLENT = "excellent"   # 5+ strong matches with high relevance
    GOOD = "good"             # 3+ decent matches
    LIMITED = "limited"       # 1-2 matches or low confidence
    NONE = "none"             # No matching suppliers found


# =============================================================================
# CATEGORY CLASSIFICATION MODELS
# =============================================================================


class CategoryLevel(BaseModel):
    """A single level in the IndiaMART category hierarchy."""
    name: str = Field(..., description="Category name (e.g., 'Packaging Machinery')")
    category_id: str = Field(..., description="Unique category identifier")
    confidence: float = Field(
        ..., ge=0.0, le=1.0,
        description="Classification confidence score (0.0 to 1.0)"
    )


class ExtractedSpec(BaseModel):
    """A specification extracted from the buyer's raw query."""
    field_name: str = Field(..., description="Specification field name (e.g., 'material_type')")
    field_value: str = Field(..., description="Extracted value (e.g., 'stainless steel')")
    confidence: float = Field(
        ..., ge=0.0, le=1.0,
        description="Extraction confidence score"
    )


class CategoryClassification(BaseModel):
    """Complete classification result for a buyer query.

    Produced by the Intent Classifier Agent. Contains:
    - Language detection
    - Intent classification
    - 3-level category mapping (L1 > L2 > L3)
    - Any specs extractable from the raw query
    """
    original_query: str = Field(..., description="The raw buyer query")
    detected_language: QueryLanguage = Field(
        default=QueryLanguage.ENGLISH,
        description="Detected language of the query"
    )
    intent: IntentType = Field(
        default=IntentType.BUY_PRODUCT,
        description="Primary intent"
    )
    is_multi_intent: bool = Field(
        default=False,
        description="Whether query contains multiple intents"
    )

    # Category hierarchy
    category_l1: CategoryLevel = Field(..., description="Level 1 (top) category")
    category_l2: Optional[CategoryLevel] = Field(
        None, description="Level 2 (mid) category"
    )
    category_l3: Optional[CategoryLevel] = Field(
        None, description="Level 3 (leaf) category"
    )

    # Specs extracted directly from the query
    extracted_specs: list[ExtractedSpec] = Field(
        default_factory=list,
        description="Specifications found in the raw query"
    )

    # Confidence & clarification
    overall_confidence: float = Field(
        ..., ge=0.0, le=1.0,
        description="Overall classification confidence"
    )
    needs_clarification: bool = Field(
        default=False,
        description="Whether the query is too vague and needs clarification"
    )
    clarification_reason: Optional[str] = Field(
        None, description="Why clarification is needed"
    )

    # Product specificity
    is_specific_product: bool = Field(
        default=False,
        description="Whether the query mentions a specific product (vs. generic category)"
    )
    specific_product_name: Optional[str] = Field(
        None, description="Specific product name if identified"
    )


# =============================================================================
# RFQ SPECIFICATION MODELS
# =============================================================================


class RFQSpecification(BaseModel):
    """A single specification in the structured RFQ."""
    field_name: str = Field(..., description="Spec field name")
    field_value: str = Field(..., description="Spec value")
    source: SpecSource = Field(
        default=SpecSource.BUYER_PROVIDED,
        description="How this value was obtained"
    )
    confidence: float = Field(
        default=1.0, ge=0.0, le=1.0,
        description="Confidence in this spec value"
    )


class BudgetRange(BaseModel):
    """Budget range for the procurement."""
    min_value: float = Field(0.0, description="Minimum budget in currency units")
    max_value: float = Field(0.0, description="Maximum budget in currency units")
    currency: str = Field(default="INR", description="Currency code")


class DeliveryInfo(BaseModel):
    """Delivery location and timeline information."""
    city: str = Field(default="", description="Delivery city")
    state: str = Field(default="", description="Delivery state")
    pincode: str = Field(default="", description="Delivery pincode")
    timeline: str = Field(default="", description="Expected delivery timeline")


class StructuredRFQ(BaseModel):
    """The complete structured RFQ generated by the RFQ Builder Agent.

    This is the primary output -- a clean, structured procurement request
    ready to be sent to matched suppliers.
    """
    # Identification
    rfq_id: str = Field(
        default_factory=lambda: f"RFQ-{uuid.uuid4().hex[:8].upper()}",
        description="Unique RFQ identifier"
    )
    timestamp: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat(),
        description="RFQ creation timestamp (ISO 8601)"
    )

    # Core RFQ fields
    rfq_title: str = Field(..., description="Generated title for the RFQ")
    original_query: str = Field(..., description="The buyer's original query")

    # Category (flattened strings for simplicity)
    category_l1: str = Field(default="", description="L1 category name")
    category_l2: str = Field(default="", description="L2 category name")
    category_l3: str = Field(default="", description="L3 category name")

    # Product details
    product_description: str = Field(
        default="", description="AI-generated product description"
    )
    specifications: list[RFQSpecification] = Field(
        default_factory=list, description="List of product specifications"
    )

    # Quantity
    quantity: str = Field(default="", description="Required quantity")
    quantity_unit: str = Field(default="", description="Unit of quantity (pcs, kg, etc.)")

    # Budget & delivery
    budget: Optional[BudgetRange] = Field(None, description="Budget range")
    delivery: Optional[DeliveryInfo] = Field(None, description="Delivery info")

    # Additional requirements
    installation_required: bool = Field(
        default=False, description="Whether installation is needed"
    )
    preferred_supplier_type: str = Field(
        default="", description="Manufacturer / Dealer / Any"
    )
    certification_required: str = Field(
        default="", description="Required certifications (ISO, BIS, etc.)"
    )

    # Metadata
    conversation_turns: int = Field(
        default=0, description="Number of follow-up turns taken"
    )
    completeness_score: float = Field(
        default=0.0, ge=0.0, le=1.0,
        description="How complete the RFQ is (0.0 to 1.0)"
    )
    fields_auto_filled: list[str] = Field(
        default_factory=list,
        description="Fields that were auto-filled by AI (not buyer-provided)"
    )


# =============================================================================
# SUPPLIER MATCHING MODELS
# =============================================================================


class MatchedSupplier(BaseModel):
    """A supplier matched to an RFQ with scoring breakdown."""
    supplier_id: str = Field(..., description="Unique supplier ID")
    company_name: str = Field(..., description="Supplier company name")
    location: str = Field(..., description="Supplier city")
    trust_seal: bool = Field(default=False, description="Has IndiaMART TrustSEAL")
    member_since: int = Field(..., description="Year joined IndiaMART")
    response_rate: float = Field(
        ..., ge=0.0, le=1.0, description="Response rate (0-1)"
    )

    # Scoring
    overall_score: float = Field(
        ..., ge=0.0, le=100.0, description="Overall match score (0-100)"
    )
    semantic_relevance: float = Field(
        default=0.0, ge=0.0, le=1.0,
        description="Semantic similarity to query"
    )
    category_match: float = Field(
        default=0.0, ge=0.0, le=1.0,
        description="Category match score"
    )
    location_score: float = Field(
        default=0.0, ge=0.0, le=1.0,
        description="Location proximity score"
    )
    trust_score: float = Field(
        default=0.0, ge=0.0, le=1.0,
        description="Trust and reliability score"
    )

    # Details
    match_reasons: list[str] = Field(
        default_factory=list,
        description="Human-readable reasons for the match"
    )
    relevant_products: list[str] = Field(
        default_factory=list,
        description="Supplier products relevant to this RFQ"
    )
    price_range: str = Field(
        default="", description="Indicative price range"
    )


class SupplierMatchResult(BaseModel):
    """Complete supplier matching result for an RFQ."""
    rfq_id: str = Field(..., description="The RFQ this result is for")
    total_matches: int = Field(
        default=0, description="Total number of matched suppliers"
    )
    suppliers: list[MatchedSupplier] = Field(
        default_factory=list, description="Ranked list of matched suppliers"
    )
    match_quality: MatchQuality = Field(
        default=MatchQuality.NONE,
        description="Overall match quality assessment"
    )
    fallback_suggestion: str = Field(
        default="",
        description="Suggestion if no good matches found"
    )


# =============================================================================
# CATEGORY QUESTION MODELS
# =============================================================================


class CategoryQuestion(BaseModel):
    """A follow-up question template for a specific product category.

    Used by the RFQ Builder Agent to ask targeted questions
    based on the classified category.
    """
    field_name: str = Field(..., description="The spec field this question fills")
    question_en: str = Field(..., description="Question text in English")
    question_hi: str = Field(..., description="Question text in Hindi")
    options: list[str] = Field(
        default_factory=list,
        description="Multiple choice options (empty = free text)"
    )
    priority: str = Field(
        default="P1",
        description="Priority level: P0 (must-have), P1 (important), P2 (nice-to-have)"
    )
    priority_score: float = Field(
        default=0.5, ge=0.0, le=1.0,
        description="Numeric priority for sorting (higher = more important)"
    )
