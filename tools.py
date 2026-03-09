"""Function-calling tools for IndiaMART AI-Powered RFQ System.

These tools are registered with Google ADK agents and called via Gemini's
function-calling capability. Each tool encapsulates a specific capability:

- classify_category: Maps buyer queries to the IndiaMART category taxonomy
- get_category_questions: Returns prioritized follow-up questions for a category
- search_suppliers: Searches and ranks suppliers from the mock database
- generate_rfq_json: Builds the final structured RFQ document

In production, these would call real services (Elasticsearch, ML models, etc.).
For the prototype, they use keyword matching and in-memory mock data.
"""

import json
import uuid
from datetime import datetime

from mock_data import (
    CATEGORY_TAXONOMY,
    CATEGORY_QUESTIONS,
    KEYWORD_MAP,
    MOCK_SUPPLIERS,
    CITY_STATE_MAP,
)
from config import MAX_SUPPLIER_RESULTS


# =============================================================================
# TOOL 1: CLASSIFY CATEGORY
# =============================================================================

def classify_category(query: str) -> dict:
    """Classify a buyer query into IndiaMART's category taxonomy.

    Uses keyword matching against the taxonomy to find the best L1 > L2 > L3
    category match. Returns top 3 matches ranked by confidence.

    In production, this would use:
    - text-embedding-004 for semantic similarity
    - A fine-tuned classifier for high-confidence L3 mapping
    - Fuzzy matching for Hindi/Hinglish queries

    Args:
        query: The buyer's raw search query (can be English, Hindi, or Hinglish)

    Returns:
        dict with:
        - matches: list of {l1, l2, l3, confidence} dicts (top 3)
        - detected_keywords: keywords found in the query
        - raw_query: the original query for reference
    """
    query_lower = query.lower().strip()
    matches = []
    detected_keywords = []

    # --- Phase 1: Direct keyword matching ---
    for keyword, (l1, l2) in KEYWORD_MAP.items():
        if keyword in query_lower:
            detected_keywords.append(keyword)
            # Calculate confidence based on keyword length relative to query
            # Longer keyword matches = higher confidence
            keyword_coverage = len(keyword) / max(len(query_lower), 1)
            base_confidence = min(0.6 + keyword_coverage * 0.8, 0.95)

            # Find best L3 match within this L2
            l3_match = ""
            l3_confidence = 0.0
            if l1 in CATEGORY_TAXONOMY and l2 in CATEGORY_TAXONOMY[l1]:
                for l3 in CATEGORY_TAXONOMY[l1][l2]:
                    l3_lower = l3.lower()
                    if l3_lower in query_lower or any(
                        word in query_lower for word in l3_lower.split()
                        if len(word) > 3
                    ):
                        l3_match = l3
                        l3_confidence = base_confidence * 0.95
                        break

            match_entry = {
                "l1": l1,
                "l2": l2,
                "l3": l3_match if l3_match else CATEGORY_TAXONOMY.get(l1, {}).get(l2, [""])[0],
                "confidence": round(base_confidence, 3),
                "l3_confidence": round(l3_confidence, 3) if l3_match else 0.0,
                "matched_keyword": keyword,
            }

            # Avoid duplicate L2 matches -- keep highest confidence
            existing = next((m for m in matches if m["l2"] == l2), None)
            if existing:
                if match_entry["confidence"] > existing["confidence"]:
                    matches.remove(existing)
                    matches.append(match_entry)
            else:
                matches.append(match_entry)

    # --- Phase 2: Fallback -- check L2 category names directly ---
    if not matches:
        for l1, l2_dict in CATEGORY_TAXONOMY.items():
            for l2, l3_list in l2_dict.items():
                l2_words = l2.lower().split()
                for word in l2_words:
                    if len(word) > 3 and word in query_lower:
                        matches.append({
                            "l1": l1,
                            "l2": l2,
                            "l3": l3_list[0] if l3_list else "",
                            "confidence": 0.45,
                            "l3_confidence": 0.0,
                            "matched_keyword": word,
                        })
                        break

    # Sort by confidence descending, take top 3
    matches.sort(key=lambda x: x["confidence"], reverse=True)
    top_matches = matches[:3]

    # If no matches at all, return a low-confidence generic result
    if not top_matches:
        top_matches = [{
            "l1": "Unknown",
            "l2": "Unknown",
            "l3": "Unknown",
            "confidence": 0.1,
            "l3_confidence": 0.0,
            "matched_keyword": "",
        }]

    return {
        "matches": top_matches,
        "detected_keywords": list(set(detected_keywords)),
        "raw_query": query,
        "total_matches_found": len(matches),
    }


# =============================================================================
# TOOL 2: GET CATEGORY QUESTIONS
# =============================================================================

def get_category_questions(
    category_l2: str,
    already_known_fields: list[str] | None = None,
) -> dict:
    """Get prioritized follow-up questions for a product category.

    Returns questions that the RFQ Builder should ask the buyer to
    complete the structured RFQ. Filters out fields already known
    from the initial query or previous conversation turns.

    Args:
        category_l2: The Level 2 category name (e.g., "Packaging Machinery")
        already_known_fields: List of field names already answered (to skip)

    Returns:
        dict with:
        - questions: list of question dicts sorted by priority
        - category: the category these questions are for
        - max_questions: recommended max questions to ask (4)
        - total_available: total questions before filtering
    """
    if already_known_fields is None:
        already_known_fields = []

    # Normalize field names for comparison
    known_set = {f.lower().strip() for f in already_known_fields}

    # Look up questions for this category
    questions = CATEGORY_QUESTIONS.get(category_l2, [])

    if not questions:
        # Try fuzzy match on category name
        for cat_name, cat_questions in CATEGORY_QUESTIONS.items():
            if cat_name.lower() in category_l2.lower() or category_l2.lower() in cat_name.lower():
                questions = cat_questions
                break

    total_available = len(questions)

    # Filter out already known fields
    filtered = [
        q for q in questions
        if q["field_name"].lower().strip() not in known_set
    ]

    # Sort by priority score (highest first)
    filtered.sort(key=lambda q: q["priority_score"], reverse=True)

    # Recommend max 4 questions
    recommended = filtered[:4]

    return {
        "questions": recommended,
        "category": category_l2,
        "max_questions": 4,
        "total_available": total_available,
        "filtered_count": len(filtered),
        "already_known": list(already_known_fields) if already_known_fields else [],
    }


# =============================================================================
# TOOL 3: SEARCH SUPPLIERS
# =============================================================================

def search_suppliers(
    category_l2: str,
    location: str = "",
    budget_max: float = 0,
) -> dict:
    """Search and rank suppliers from the mock database.

    Filters suppliers by category match, then scores them using:
    - Category match (35%): Does the supplier serve this category?
    - Trust score (20%): TrustSEAL status + member tenure
    - Response rate (10%): Historical response rate
    - Location (10%): Same city > same state > other
    - Semantic relevance (25%): Product-level keyword match

    Args:
        category_l2: The L2 category to search (e.g., "Packaging Machinery")
        location: Buyer's city for location-based scoring (optional)
        budget_max: Maximum budget for filtering (optional, 0 = no filter)

    Returns:
        dict with:
        - suppliers: ranked list of matched suppliers with scoring
        - total_matches: number of suppliers found
        - match_quality: "excellent" / "good" / "limited" / "none"
        - search_params: the search parameters used
    """
    category_lower = category_l2.lower().strip()
    location_lower = location.lower().strip()

    # Determine buyer's state for location scoring
    buyer_state = CITY_STATE_MAP.get(location_lower, "")

    matched_suppliers = []

    for supplier in MOCK_SUPPLIERS:
        # --- Category Match ---
        cat_match = 0.0
        supplier_cats = [c.lower() for c in supplier["categories"]]
        if category_lower in supplier_cats:
            cat_match = 1.0
        elif any(category_lower in c or c in category_lower for c in supplier_cats):
            cat_match = 0.7
        else:
            continue  # Skip suppliers that don't match the category at all

        # --- Location Score ---
        loc_score = 0.3  # Default for different state
        supplier_city = supplier["location"].lower()
        supplier_state = supplier.get("state", "").lower()

        if location_lower and supplier_city == location_lower:
            loc_score = 1.0  # Same city
        elif buyer_state and supplier_state.lower() == buyer_state.lower():
            loc_score = 0.7  # Same state
        elif location_lower:
            loc_score = 0.3  # Different state

        # --- Trust Score ---
        trust_score = 0.0
        if supplier["trust_seal"]:
            trust_score += 0.6
        # Tenure bonus: longer membership = higher trust
        years_member = 2026 - supplier["member_since"]
        trust_score += min(years_member * 0.04, 0.4)  # Max 0.4 from tenure
        trust_score = min(trust_score, 1.0)

        # --- Response Rate ---
        resp_rate = supplier["response_rate"]

        # --- Semantic Relevance (simple keyword matching on products) ---
        semantic = 0.5  # Base relevance since category matches
        products_text = " ".join(supplier["products"]).lower()
        if category_lower in products_text:
            semantic = 0.8

        # --- Overall Score (weighted) ---
        overall = (
            cat_match * 0.35
            + semantic * 0.25
            + trust_score * 0.20
            + loc_score * 0.10
            + resp_rate * 0.10
        ) * 100  # Scale to 0-100

        # Build match reasons
        reasons = []
        if cat_match == 1.0:
            reasons.append(f"Exact category match: {category_l2}")
        if supplier["trust_seal"]:
            reasons.append("IndiaMART TrustSEAL verified")
        if years_member >= 10:
            reasons.append(f"Established seller ({years_member}+ years on IndiaMART)")
        elif years_member >= 5:
            reasons.append(f"Active seller ({years_member} years on IndiaMART)")
        if resp_rate >= 0.9:
            reasons.append(f"Excellent response rate ({int(resp_rate*100)}%)")
        elif resp_rate >= 0.8:
            reasons.append(f"Good response rate ({int(resp_rate*100)}%)")
        if loc_score == 1.0:
            reasons.append(f"Located in {supplier['location']} (same city)")
        elif loc_score == 0.7:
            reasons.append(f"Located in {supplier['location']} (same state)")

        matched_suppliers.append({
            "supplier_id": supplier["supplier_id"],
            "company_name": supplier["company_name"],
            "location": supplier["location"],
            "trust_seal": supplier["trust_seal"],
            "member_since": supplier["member_since"],
            "response_rate": supplier["response_rate"],
            "overall_score": round(overall, 1),
            "category_match": round(cat_match, 2),
            "semantic_relevance": round(semantic, 2),
            "location_score": round(loc_score, 2),
            "trust_score": round(trust_score, 2),
            "match_reasons": reasons,
            "relevant_products": [
                p for p in supplier["products"]
                if any(
                    word in p.lower()
                    for word in category_lower.split()
                    if len(word) > 3
                )
            ] or supplier["products"][:3],
            "price_range": supplier["price_range"],
        })

    # Sort by overall score descending
    matched_suppliers.sort(key=lambda s: s["overall_score"], reverse=True)

    # Limit results
    top_suppliers = matched_suppliers[:MAX_SUPPLIER_RESULTS]

    # Determine match quality
    total = len(matched_suppliers)
    if total >= 5 and matched_suppliers[0]["overall_score"] >= 75:
        quality = "excellent"
    elif total >= 3 and matched_suppliers[0]["overall_score"] >= 60:
        quality = "good"
    elif total >= 1:
        quality = "limited"
    else:
        quality = "none"

    # Fallback suggestion
    fallback = ""
    if quality == "none":
        fallback = (
            f"No suppliers found for '{category_l2}'. "
            "Try broadening the category or searching on IndiaMART.com directly."
        )
    elif quality == "limited":
        fallback = (
            f"Limited suppliers found for '{category_l2}'. "
            "Consider contacting all matched suppliers for competitive quotes."
        )

    return {
        "suppliers": top_suppliers,
        "total_matches": total,
        "match_quality": quality,
        "search_params": {
            "category_l2": category_l2,
            "location": location if location else "Any",
            "budget_max": budget_max if budget_max > 0 else "No limit",
        },
        "fallback_suggestion": fallback,
    }


# =============================================================================
# TOOL 4: GENERATE RFQ JSON
# =============================================================================

def generate_rfq_json(
    original_query: str,
    category_l1: str,
    category_l2: str,
    category_l3: str,
    rfq_title: str,
    product_description: str,
    specifications: list[dict],
    quantity: str = "",
    quantity_unit: str = "",
    budget_min: float = 0,
    budget_max: float = 0,
    delivery_city: str = "",
    delivery_state: str = "",
    installation_required: bool = False,
    preferred_supplier_type: str = "",
    certification_required: str = "",
    conversation_turns: int = 0,
) -> dict:
    """Generate a complete structured RFQ JSON document.

    Takes all gathered information (from classification + follow-up conversation)
    and produces a clean, structured RFQ ready to send to matched suppliers.

    Calculates a completeness score based on how many priority fields
    are filled for this category.

    Args:
        original_query: The buyer's original search query
        category_l1: Level 1 category name
        category_l2: Level 2 category name
        category_l3: Level 3 category name
        rfq_title: Generated RFQ title
        product_description: AI-generated product description
        specifications: List of {field_name, field_value, source} dicts
        quantity: Required quantity (string, may include unit)
        quantity_unit: Unit of quantity (pcs, kg, meters, etc.)
        budget_min: Minimum budget (0 if not specified)
        budget_max: Maximum budget (0 if not specified)
        delivery_city: Delivery city
        delivery_state: Delivery state
        installation_required: Whether installation service is needed
        preferred_supplier_type: Manufacturer / Dealer / Any
        certification_required: Required certifications
        conversation_turns: Number of follow-up turns taken

    Returns:
        dict: The complete structured RFQ document
    """
    rfq_id = f"RFQ-{uuid.uuid4().hex[:8].upper()}"
    timestamp = datetime.utcnow().isoformat()

    # --- Build specifications list ---
    spec_list = []
    fields_auto_filled = []
    for spec in specifications:
        source = spec.get("source", "buyer_provided")
        spec_list.append({
            "field_name": spec.get("field_name", ""),
            "field_value": spec.get("field_value", ""),
            "source": source,
            "confidence": spec.get("confidence", 1.0 if source == "buyer_provided" else 0.7),
        })
        if source in ("ai_inferred", "default"):
            fields_auto_filled.append(spec.get("field_name", ""))

    # --- Build budget ---
    budget = None
    if budget_min > 0 or budget_max > 0:
        budget = {
            "min_value": budget_min,
            "max_value": budget_max,
            "currency": "INR",
        }

    # --- Build delivery info ---
    delivery = None
    if delivery_city or delivery_state:
        delivery = {
            "city": delivery_city,
            "state": delivery_state,
            "pincode": "",
            "timeline": "",
        }

    # --- Calculate completeness score ---
    # Based on P0 fields for this category
    category_questions = CATEGORY_QUESTIONS.get(category_l2, [])
    p0_fields = [q["field_name"] for q in category_questions if q["priority"] == "P0"]
    p1_fields = [q["field_name"] for q in category_questions if q["priority"] == "P1"]

    filled_spec_names = {s.get("field_name", "").lower() for s in specifications}

    # P0 completeness (70% weight)
    p0_filled = sum(1 for f in p0_fields if f.lower() in filled_spec_names)
    p0_ratio = p0_filled / max(len(p0_fields), 1)

    # P1 completeness (20% weight)
    p1_filled = sum(1 for f in p1_fields if f.lower() in filled_spec_names)
    p1_ratio = p1_filled / max(len(p1_fields), 1)

    # Basic fields completeness (10% weight) -- title, quantity, budget
    basic_filled = sum([
        1 if rfq_title else 0,
        1 if quantity else 0,
        1 if (budget_min > 0 or budget_max > 0) else 0,
    ])
    basic_ratio = basic_filled / 3

    completeness_score = round(
        p0_ratio * 0.70 + p1_ratio * 0.20 + basic_ratio * 0.10,
        2,
    )

    # --- Assemble the RFQ document ---
    rfq = {
        "rfq_id": rfq_id,
        "timestamp": timestamp,
        "rfq_title": rfq_title,
        "original_query": original_query,
        "category_l1": category_l1,
        "category_l2": category_l2,
        "category_l3": category_l3,
        "product_description": product_description,
        "specifications": spec_list,
        "quantity": quantity,
        "quantity_unit": quantity_unit,
        "budget": budget,
        "delivery": delivery,
        "installation_required": installation_required,
        "preferred_supplier_type": preferred_supplier_type,
        "certification_required": certification_required,
        "conversation_turns": conversation_turns,
        "completeness_score": completeness_score,
        "fields_auto_filled": fields_auto_filled,
        "completeness_breakdown": {
            "p0_fields_total": len(p0_fields),
            "p0_fields_filled": p0_filled,
            "p1_fields_total": len(p1_fields),
            "p1_fields_filled": p1_filled,
            "basic_fields_filled": basic_filled,
        },
    }

    return rfq
