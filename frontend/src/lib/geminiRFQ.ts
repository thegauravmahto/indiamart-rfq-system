/**
 * geminiRFQ.ts
 * Core AI logic for the Live RFQ Demo.
 * Uses @google/genai (Google GenAI SDK) to power a multi-turn
 * conversational RFQ builder running entirely client-side.
 *
 * The user provides their own Gemini API key -- it never leaves the browser.
 */

import { GoogleGenAI, Chat, type GenerateContentResponse } from '@google/genai'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LiveChatMessage {
  id: string
  role: 'user' | 'ai' | 'system'
  text: string
  timestamp: number
}

export interface RFQField {
  label: string
  value: string
  source: 'extracted' | 'clarified' | 'inferred'
}

export interface SupplierRec {
  name: string
  location: string
  rating: number
  speciality: string
  matchScore: number
}

export interface LiveRFQResult {
  rfqFields: RFQField[]
  suppliers: SupplierRec[]
  completenessScore: number
}

// ---------------------------------------------------------------------------
// System Prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are IndiaMART's AI-powered RFQ (Request for Quotation) Assistant. Your job is to convert vague, incomplete buyer queries into structured, supplier-ready RFQs through a friendly multi-turn conversation.

## Your Personality
- Warm, professional, helpful -- like the best B2B sales assistant
- Comfortable with Hinglish (Hindi + English mix) -- many IndiaMART buyers use it
- Concise -- keep responses to 2-3 sentences max per turn
- Proactive -- suggest options when the buyer is unsure

## Your Workflow
1. **Greet & Classify**: When the buyer sends their first message, identify the product category and acknowledge it. If the query is vague, tell them what you understood and what you'll need.
2. **Smart Follow-ups**: Ask ONE question at a time (never overwhelm). Cover these dimensions in order of importance:
   - Product specifications (type, size, capacity, material)
   - Quantity / volume requirements
   - Budget range (in INR)
   - Delivery location (city, state)
   - Quality certifications needed (ISO, BIS, etc.)
   - Timeline / urgency
3. **Generate RFQ**: After gathering enough information (minimum: product specs + quantity + location OR after 4-5 exchanges), generate the structured RFQ.

## CRITICAL OUTPUT FORMAT
When you have enough information to generate the RFQ, you MUST output a special JSON block wrapped in ~~~rfq_json markers. This is how the frontend detects the RFQ is ready.

Your message should have a brief intro text, then the JSON block:

~~~rfq_json
{
  "rfqFields": [
    { "label": "Category", "value": "...", "source": "extracted" },
    { "label": "Product Type", "value": "...", "source": "clarified" },
    { "label": "Specifications", "value": "...", "source": "clarified" },
    { "label": "Quantity", "value": "...", "source": "clarified" },
    { "label": "Budget", "value": "...", "source": "clarified" },
    { "label": "Delivery Location", "value": "...", "source": "clarified" },
    { "label": "Certifications", "value": "...", "source": "clarified" },
    { "label": "Timeline", "value": "...", "source": "inferred" }
  ],
  "suppliers": [
    { "name": "[Realistic Indian company name]", "location": "[City, State]", "rating": 4.5, "speciality": "...", "matchScore": 95 },
    { "name": "[Another company]", "location": "[City, State]", "rating": 4.2, "speciality": "...", "matchScore": 88 },
    { "name": "[Third company]", "location": "[City, State]", "rating": 4.0, "speciality": "...", "matchScore": 82 }
  ],
  "completenessScore": 92
}
~~~rfq_json

Rules for the JSON:
- "source" must be one of: "extracted" (from initial query), "clarified" (from follow-up answers), "inferred" (your smart guess based on industry standards)
- Generate 3 realistic Indian supplier names relevant to the product category
- completenessScore: 0-100 based on how much info was gathered (90+ is great)
- Include 6-10 rfqFields covering all gathered dimensions
- Supplier matchScore should be 75-98 range, not all the same

## Rules
- NEVER generate the RFQ JSON in your first response -- always ask at least 2 follow-up questions first
- If the buyer says something off-topic, gently redirect to the RFQ
- If the buyer provides info in Hinglish, understand it and respond naturally
- Keep all prices in INR
- For Indian locations, include the state
- Be smart about inferring: if someone says "packaging machine for namkeen", infer FFS/VFFS machine type
`

// ---------------------------------------------------------------------------
// Gemini Client Wrapper
// ---------------------------------------------------------------------------

let cachedClient: GoogleGenAI | null = null
let cachedApiKey: string = ''

function getClient(apiKey: string): GoogleGenAI {
  if (cachedClient && cachedApiKey === apiKey) return cachedClient
  cachedClient = new GoogleGenAI({ apiKey })
  cachedApiKey = apiKey
  return cachedClient
}

/**
 * Validate an API key by making a tiny test call.
 * Returns true if key works, throws with a message if not.
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const ai = getClient(apiKey)
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: 'Reply with exactly: OK',
    })
    const text = response?.text ?? ''
    return text.length > 0
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('API_KEY_INVALID') || msg.includes('401')) {
      throw new Error('Invalid API key. Please check and try again.')
    }
    if (msg.includes('429') || msg.includes('RATE_LIMIT')) {
      throw new Error('Rate limit exceeded. Wait a moment and try again.')
    }
    throw new Error(`API error: ${msg}`)
  }
}

/**
 * Create a new Gemini chat session for an RFQ conversation.
 * Returns a Chat object that maintains conversation history.
 */
export function createRFQChat(apiKey: string): Chat {
  const ai = getClient(apiKey)
  const chat = ai.chats.create({
    model: 'gemini-2.0-flash',
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 2048,
    },
  })
  return chat
}

/**
 * Send a message in the chat and get the AI response.
 */
export async function sendMessage(
  chat: Chat,
  message: string
): Promise<string> {
  const response: GenerateContentResponse = await chat.sendMessage({
    message,
  })
  return response?.text ?? ''
}

// ---------------------------------------------------------------------------
// Response Parsing
// ---------------------------------------------------------------------------

/**
 * Check if the AI response contains a completed RFQ JSON block.
 * Returns the parsed result or null if no RFQ was generated yet.
 */
export function parseRFQFromResponse(response: string): LiveRFQResult | null {
  const rfqMatch = response.match(/~~~rfq_json\s*([\s\S]*?)\s*~~~rfq_json/)
  if (!rfqMatch) return null

  try {
    const parsed = JSON.parse(rfqMatch[1])
    // Validate structure
    if (
      !parsed.rfqFields ||
      !Array.isArray(parsed.rfqFields) ||
      !parsed.suppliers ||
      !Array.isArray(parsed.suppliers)
    ) {
      return null
    }
    return {
      rfqFields: parsed.rfqFields as RFQField[],
      suppliers: parsed.suppliers as SupplierRec[],
      completenessScore: parsed.completenessScore ?? 85,
    }
  } catch {
    return null
  }
}

/**
 * Extract the human-readable text from a response, stripping the JSON block.
 */
export function getDisplayText(response: string): string {
  return response
    .replace(/~~~rfq_json[\s\S]*?~~~rfq_json/, '')
    .trim()
}

/**
 * Generate a unique message ID.
 */
export function msgId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}
