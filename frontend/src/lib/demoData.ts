// Pre-scripted conversation flow for the interactive demo
// This simulates the complete AI-powered RFQ journey

export interface ChatMessage {
  id: number
  role: 'buyer' | 'ai' | 'system'
  text: string
  delay: number // ms before showing this message
  tag?: string // visual label like "Intent Classification" or "RFQ Generated"
}

export interface SupplierMatch {
  name: string
  location: string
  rating: number
  relevanceScore: number
  specialization: string
  responseTime: string
  verified: boolean
}

export interface RFQField {
  label: string
  value: string
  source: 'extracted' | 'clarified' | 'inferred'
}

export const DEMO_CONVERSATION: ChatMessage[] = [
  {
    id: 1,
    role: 'buyer',
    text: 'need packaging machine for my snacks business',
    delay: 0,
  },
  {
    id: 2,
    role: 'system',
    text: 'Intent classified: Packaging Machinery > Food Packaging > Snack Packaging Machines',
    delay: 800,
    tag: 'Agent 1: Intent Classifier',
  },
  {
    id: 3,
    role: 'ai',
    text: 'I can help you find the right packaging machine! To match you with the best suppliers, I have a few quick questions:',
    delay: 600,
    tag: 'Agent 2: RFQ Builder',
  },
  {
    id: 4,
    role: 'ai',
    text: 'What type of snacks will this machine package? (e.g., chips, namkeen, cookies, dry fruits)',
    delay: 400,
  },
  {
    id: 5,
    role: 'buyer',
    text: 'mainly namkeen and chips, different sizes 50g to 500g',
    delay: 0,
  },
  {
    id: 6,
    role: 'ai',
    text: 'What production speed do you need? And do you prefer a semi-automatic or fully automatic machine?',
    delay: 600,
  },
  {
    id: 7,
    role: 'buyer',
    text: 'fully automatic, around 40-60 packs per minute. budget around 8-12 lakh',
    delay: 0,
  },
  {
    id: 8,
    role: 'ai',
    text: 'Last question -- where should the machine be delivered? And any certification preferences (ISO, CE)?',
    delay: 600,
  },
  {
    id: 9,
    role: 'buyer',
    text: 'delivery to Noida, UP. ISO certified hona chahiye',
    delay: 0,
  },
  {
    id: 10,
    role: 'system',
    text: 'Structured RFQ generated with 95% completeness score',
    delay: 800,
    tag: 'RFQ Complete',
  },
]

export const GENERATED_RFQ: RFQField[] = [
  { label: 'Category', value: 'Packaging Machinery > FFS Machines > Vertical FFS', source: 'extracted' },
  { label: 'Product Type', value: 'Namkeen & Chips (multi-product)', source: 'clarified' },
  { label: 'Pack Sizes', value: '50g, 100g, 200g, 500g pouches', source: 'clarified' },
  { label: 'Machine Type', value: 'Fully Automatic Vertical FFS', source: 'clarified' },
  { label: 'Speed', value: '40-60 packs/minute', source: 'clarified' },
  { label: 'Packaging Material', value: 'BOPP / Metalized Polyester (nitrogen flush)', source: 'inferred' },
  { label: 'Budget', value: 'INR 8,00,000 - 12,00,000', source: 'clarified' },
  { label: 'Delivery Location', value: 'Noida, Uttar Pradesh', source: 'clarified' },
  { label: 'Certifications', value: 'ISO 9001:2015 required', source: 'clarified' },
  { label: 'Power Supply', value: '440V, 3-phase (industrial standard)', source: 'inferred' },
  { label: 'Estimated Delivery', value: '30-45 days', source: 'inferred' },
]

export const MATCHED_SUPPLIERS: SupplierMatch[] = [
  {
    name: 'Maharaja Packaging Systems',
    location: 'Greater Noida, UP',
    rating: 4.8,
    relevanceScore: 96,
    specialization: 'Vertical FFS for snack foods, 15+ years',
    responseTime: '< 2 hours',
    verified: true,
  },
  {
    name: 'Shree Ambica Engineering',
    location: 'Ahmedabad, Gujarat',
    rating: 4.6,
    relevanceScore: 91,
    specialization: 'Multi-head weigher + FFS combos',
    responseTime: '< 4 hours',
    verified: true,
  },
  {
    name: 'Nichrome India Ltd',
    location: 'Pune, Maharashtra',
    rating: 4.9,
    relevanceScore: 88,
    specialization: 'Enterprise-grade packaging lines',
    responseTime: '< 6 hours',
    verified: true,
  },
]

export const IMPACT_METRICS = [
  {
    before: '48 hrs',
    after: '< 4 hrs',
    label: 'Time to First Quote',
    description: 'AI eliminates back-and-forth by capturing all specs upfront',
    icon: 'clock',
  },
  {
    before: '30-40%',
    after: '85-95%',
    label: 'RFQ Completeness',
    description: 'Smart follow-ups extract all supplier-critical specifications',
    icon: 'fileCheck',
  },
  {
    before: '3-5 rounds',
    after: '1 round',
    label: 'Buyer-Supplier Messages',
    description: 'Structured RFQs mean suppliers can quote immediately',
    icon: 'messageSquare',
  },
  {
    before: 'Manual',
    after: '95% accurate',
    label: 'Category Classification',
    description: 'Gemini maps vague queries to IndiaMART\'s 97K taxonomy',
    icon: 'brain',
  },
]

export const ARCHITECTURE_AGENTS = [
  {
    name: 'Intent Classifier',
    model: 'Gemini 2.0 Flash',
    purpose: 'Maps vague buyer query to IndiaMART\'s 97K-category taxonomy',
    metric: '95% accuracy',
    icon: 'search',
    color: 'im-blue',
  },
  {
    name: 'RFQ Builder',
    model: 'Gemini 2.0 Flash',
    purpose: 'Asks smart, category-specific follow-up questions (max 4)',
    metric: '85% completeness',
    icon: 'fileText',
    color: 'im-teal',
  },
  {
    name: 'Supplier Matcher',
    model: 'Flash + Embeddings',
    purpose: 'Semantic search + LLM re-ranking of supplier catalog',
    metric: 'Top-3 relevance: 91%',
    icon: 'users',
    color: 'im-indigo',
  },
]
