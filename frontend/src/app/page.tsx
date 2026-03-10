'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Menu,
  X,
  Sparkles,
  Shield,
  Clock,
  CheckCircle,
  ArrowRight,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  FileText,
  MapPin,
  Star,
  Users,
  AlertTriangle,
  XCircle,
  ChevronDown,
  TrendingUp,
  Zap,
  Search,
  Brain,
  MessageSquare,
  FileCheck,
  Target,
  Github,
  Mail,
} from 'lucide-react'
import {
  DEMO_CONVERSATION,
  GENERATED_RFQ,
  MATCHED_SUPPLIERS,
  IMPACT_METRICS,
  ARCHITECTURE_AGENTS,
  type ChatMessage,
} from '@/lib/demoData'
import { useScrollReveal, useCounter } from '@/hooks/useScrollReveal'
import LiveDemo from '@/components/LiveDemo'

// ---------------------------------------------------------------------------
// Icon mapper helpers
// ---------------------------------------------------------------------------
const agentIconMap: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  search: Search,
  fileText: FileText,
  users: Users,
}

const metricIconMap: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  clock: Clock,
  fileCheck: FileCheck,
  messageSquare: MessageSquare,
  brain: Brain,
}

// ---------------------------------------------------------------------------
// Smooth scroll helper
// ---------------------------------------------------------------------------
function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

// =========================================================================
// PAGE COMPONENT
// =========================================================================
export default function HomePage() {
  // ---- Mobile menu state ----
  const [mobileOpen, setMobileOpen] = useState(false)

  // ---- Demo tab state ----
  const [demoTab, setDemoTab] = useState<'guided' | 'live'>('guided')

  // ---- Demo state ----
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showRFQ, setShowRFQ] = useState(false)
  const [showSuppliers, setShowSuppliers] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ---- Scroll reveal hooks ----
  const comparisonReveal = useScrollReveal(0.15)
  const architectureReveal = useScrollReveal(0.1)
  const metricsReveal = useScrollReveal(0.1)

  // ---- Typing animation state for hero ----
  const [typedText, setTypedText] = useState('')
  const fullQuery = 'need packaging machine for my business'

  useEffect(() => {
    let idx = 0
    const timer = setInterval(() => {
      idx += 1
      setTypedText(fullQuery.slice(0, idx))
      if (idx >= fullQuery.length) clearInterval(timer)
    }, 55)
    return () => clearInterval(timer)
  }, [])

  // ---- Auto-scroll chat (container-scoped, not page-level) ----
  useEffect(() => {
    const container = chatContainerRef.current
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
    }
  }, [currentStep])

  // ---- RFQ / Suppliers reveal logic ----
  useEffect(() => {
    if (currentStep >= DEMO_CONVERSATION.length - 1) {
      const t1 = setTimeout(() => setShowRFQ(true), 500)
      return () => clearTimeout(t1)
    } else {
      setShowRFQ(false)
      setShowSuppliers(false)
    }
  }, [currentStep])

  useEffect(() => {
    if (showRFQ) {
      const t2 = setTimeout(() => setShowSuppliers(true), 1000)
      return () => clearTimeout(t2)
    }
    setShowSuppliers(false)
  }, [showRFQ])

  // ---- Auto-play ----
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= DEMO_CONVERSATION.length - 1) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, 2000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPlaying])

  const goNext = useCallback(() => {
    setCurrentStep((p) => Math.min(p + 1, DEMO_CONVERSATION.length - 1))
  }, [])

  const goPrev = useCallback(() => {
    setCurrentStep((p) => {
      const next = Math.max(p - 1, 0)
      if (next < DEMO_CONVERSATION.length - 1) {
        setShowRFQ(false)
        setShowSuppliers(false)
      }
      return next
    })
  }, [])

  // Source badge color helper
  const sourceBadge = (source: 'extracted' | 'clarified' | 'inferred') => {
    const map = {
      extracted: 'bg-blue-50 text-blue-700',
      clarified: 'bg-green-50 text-green-700',
      inferred: 'bg-amber-50 text-amber-700',
    }
    return map[source]
  }

  // Nav links data
  const navLinks = [
    { label: 'Demo', target: 'demo' },
    { label: 'Architecture', target: 'architecture' },
    { label: 'Metrics', target: 'metrics' },
  ]

  // =======================================================================
  // RENDER
  // =======================================================================
  return (
    <div className="min-h-screen bg-im-bg font-roboto">
      {/* ================================================================
          SECTION 1 : HEADER
          ================================================================ */}
      <header className="sticky top-0 z-50 bg-im-blue shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold tracking-tight text-white">
              IndiaMART
            </span>
            <span className="rounded-full bg-im-teal px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
              AI Lab
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((l) => (
              <button
                key={l.target}
                onClick={() => scrollTo(l.target)}
                className="text-sm font-medium text-white/80 transition-colors hover:text-white"
              >
                {l.label}
              </button>
            ))}
            <a
              href="https://github.com/thegauravmahto/indiamart-rfq-system"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-medium text-white/80 transition-colors hover:text-white"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </nav>

          {/* Mobile Hamburger */}
          <button
            className="text-white md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`overflow-hidden transition-all duration-300 md:hidden ${
            mobileOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <nav className="flex flex-col gap-3 px-6 pb-4">
            {navLinks.map((l) => (
              <button
                key={l.target}
                onClick={() => {
                  scrollTo(l.target)
                  setMobileOpen(false)
                }}
                className="text-left text-sm font-medium text-white/80 transition-colors hover:text-white"
              >
                {l.label}
              </button>
            ))}
            <a
              href="https://github.com/thegauravmahto/indiamart-rfq-system"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-medium text-white/80 transition-colors hover:text-white"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </nav>
        </div>
      </header>


      {/* ================================================================
          SECTION 2 : HERO
          ================================================================ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-im-blue via-im-blue-light to-im-blue-dark py-20 text-white md:py-28">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-white/5" />

        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur">
            <Sparkles className="h-4 w-4 text-im-yellow" />
            Powered by Google ADK + Gemini 2.0
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
            Intelligent RFQ System
          </h1>

          {/* Subheading */}
          <p className="mx-auto mt-4 max-w-2xl text-xl font-light opacity-90 md:text-2xl">
            Converting vague buyer queries into structured, supplier-ready RFQs
          </p>

          {/* Trust pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 md:gap-6">
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm backdrop-blur">
              <Shield className="h-4 w-4" />
              AI-Powered
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm backdrop-blur">
              <Clock className="h-4 w-4" />
              4hr vs 48hr
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm backdrop-blur">
              <CheckCircle className="h-4 w-4" />
              95% Accurate
            </div>
          </div>

          {/* Animated demo preview */}
          <div className="mx-auto mt-12 max-w-3xl rounded-xl bg-white/5 p-6 backdrop-blur">
            <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
              {/* Buyer types */}
              <div className="flex-1 text-left">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-white/60">
                  Buyer types:
                </p>
                <div className="rounded-lg bg-white/10 px-4 py-3 font-medium">
                  <span>{typedText}</span>
                  <span className="typing-cursor" />
                </div>
              </div>

              <ArrowRight className="hidden h-6 w-6 flex-shrink-0 text-im-teal-light md:block" />

              {/* AI generates */}
              <div className="flex-1 text-left">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-white/60">
                  AI generates:
                </p>
                <div className="space-y-1 rounded-lg bg-white/10 px-4 py-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/60">Category</span>
                    <span className="font-medium">Packaging Machines</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Type</span>
                    <span className="font-medium">Vertical FFS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Suppliers</span>
                    <span className="font-medium text-im-teal-light">3 matched</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => scrollTo('demo')}
            className="mt-10 inline-flex items-center gap-2 rounded-lg bg-im-teal-dark px-8 py-3 text-lg font-medium text-white transition-colors hover:bg-im-teal"
          >
            See Live Demo
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* ================================================================
          SECTION 3 : INTERACTIVE DEMO
          ================================================================ */}
      <section id="demo" className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          {/* Section heading */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-im-text-heading md:text-4xl">
              See It In Action
            </h2>
            <p className="mt-3 text-im-text-muted">
              Watch the AI transform a vague query into a complete RFQ
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="mx-auto mb-10 flex max-w-md items-center rounded-xl bg-gray-100 p-1">
            <button
              onClick={() => setDemoTab('guided')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                demoTab === 'guided'
                  ? 'bg-white text-im-blue shadow-sm'
                  : 'text-im-text-muted hover:text-im-text-heading'
              }`}
            >
              <Play className="h-4 w-4" />
              Guided Demo
            </button>
            <button
              onClick={() => setDemoTab('live')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                demoTab === 'live'
                  ? 'bg-white text-im-teal-dark shadow-sm'
                  : 'text-im-text-muted hover:text-im-text-heading'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Try It Live
            </button>
          </div>

          {/* Tab Content */}
          {demoTab === 'live' ? (
            <LiveDemo />
          ) : (

          /* Two-column layout (Guided Demo) */
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            {/* LEFT -- Chat Window (col-span-3) */}
            <div className="lg:col-span-3">
              <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
                {/* Chat top bar */}
                <div className="flex items-center gap-3 bg-im-blue px-4 py-4 text-white">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">IndiaMART AI Assistant</p>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-green-400" />
                      <span className="text-xs text-white/70">Online</span>
                    </div>
                  </div>
                </div>

                {/* Chat messages */}
                <div ref={chatContainerRef} className="max-h-[500px] space-y-3 overflow-y-auto p-4">
                  {DEMO_CONVERSATION.slice(0, currentStep + 1).map((msg: ChatMessage, idx: number) => {
                    const isLatest = idx === currentStep
                    const animStyle = isLatest ? { animation: 'fadeInUp 0.4s ease-out' } : undefined
                    // Use composite key so React remounts only the newest bubble (re-triggers animation)
                    const key = isLatest ? `${msg.id}-step${currentStep}` : msg.id

                    if (msg.role === 'buyer') {
                      return (
                        <div key={key} className="chat-bubble ml-auto max-w-[80%]" style={animStyle}>
                          <div className="rounded-2xl rounded-br-sm bg-im-bg-highlight p-3 text-sm text-im-text-heading">
                            {msg.text}
                          </div>
                        </div>
                      )
                    }
                    if (msg.role === 'ai') {
                      return (
                        <div key={key} className="chat-bubble mr-auto max-w-[85%]" style={animStyle}>
                          {msg.tag && (
                            <span className="mb-1 inline-block rounded bg-im-bg-highlight px-2 py-0.5 text-[10px] font-semibold text-im-blue">
                              {msg.tag}
                            </span>
                          )}
                          <div className="rounded-2xl rounded-bl-sm border border-gray-100 bg-white p-3 text-sm text-im-text-heading shadow-sm">
                            {msg.text}
                          </div>
                        </div>
                      )
                    }
                    // system
                    return (
                      <div key={key} className="chat-bubble mx-auto max-w-[90%]" style={animStyle}>
                        {msg.tag && (
                          <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-wider text-im-blue">
                            {msg.tag}
                          </p>
                        )}
                        <div className="rounded-lg border border-im-border-highlight bg-im-bg-highlight p-2 text-center text-xs font-medium text-im-blue">
                          {msg.text}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Controls bar */}
                <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                  <span className="text-xs font-medium text-im-text-muted">
                    Step {currentStep + 1} of {DEMO_CONVERSATION.length}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={goPrev}
                      disabled={currentStep === 0}
                      className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-im-text-muted transition-colors hover:border-im-blue hover:text-im-blue disabled:opacity-40"
                    >
                      <SkipBack className="h-3 w-3" />
                      Previous
                    </button>

                    <button
                      onClick={() => setIsPlaying((p) => !p)}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-im-indigo text-white transition-colors hover:bg-im-indigo-light"
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </button>

                    <button
                      onClick={goNext}
                      disabled={currentStep >= DEMO_CONVERSATION.length - 1}
                      className="flex items-center gap-1 rounded-lg bg-im-teal-dark px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-im-teal disabled:opacity-40"
                    >
                      Next
                      <SkipForward className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>


            {/* RIGHT -- Output Panel (col-span-2) */}
            <div className="lg:col-span-2">
              {!showRFQ ? (
                /* Placeholder */
                <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white p-8 text-center">
                  <FileText className="mb-4 h-12 w-12 text-gray-300" />
                  <p className="text-sm text-im-text-muted">
                    Complete the conversation to see the AI-generated RFQ
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* RFQ Card */}
                  <div className="animate-fade-in-up rounded-2xl bg-white p-5 shadow-lg">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <h3 className="text-base font-semibold text-im-text-heading">
                          Generated RFQ
                        </h3>
                      </div>
                      <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                        95% Complete
                      </span>
                    </div>

                    <div className="space-y-0">
                      {GENERATED_RFQ.map((field, i) => (
                        <div
                          key={i}
                          className="flex items-start justify-between border-b border-gray-50 py-2 last:border-0"
                        >
                          <div className="flex-1 pr-3">
                            <p className="text-[10px] uppercase tracking-wide text-im-text-muted">
                              {field.label}
                            </p>
                            <p className="text-sm font-medium text-im-text-heading">
                              {field.value}
                            </p>
                          </div>
                          <span
                            className={`mt-1 flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${sourceBadge(
                              field.source
                            )}`}
                          >
                            {field.source}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Supplier Matches */}
                  {showSuppliers && (
                    <div className="animate-fade-in-up">
                      <div className="mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4 text-im-blue" />
                        <h3 className="text-sm font-semibold text-im-text-heading">
                          Top Supplier Matches
                        </h3>
                      </div>

                      <div className="space-y-3">
                        {MATCHED_SUPPLIERS.map((supplier, i) => (
                          <div
                            key={i}
                            className="im-card rounded-xl border border-gray-100 bg-white p-4"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-im-text-heading">
                                  {supplier.name}
                                </span>
                                {supplier.verified && (
                                  <CheckCircle className="h-3.5 w-3.5 text-blue-500" />
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                <span className="text-xs font-medium text-im-text-heading">
                                  {supplier.rating}
                                </span>
                              </div>
                            </div>

                            <div className="mt-1 flex items-center gap-1 text-xs text-im-text-muted">
                              <MapPin className="h-3 w-3" />
                              {supplier.location}
                            </div>

                            {/* Relevance bar */}
                            <div className="mt-2">
                              <div className="mb-1 flex items-center justify-between text-[10px]">
                                <span className="text-im-text-muted">Relevance</span>
                                <span className="font-semibold text-im-teal-dark">
                                  {supplier.relevanceScore}%
                                </span>
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                                <div
                                  className="progress-fill h-full rounded-full bg-im-teal"
                                  style={{ width: `${supplier.relevanceScore}%` }}
                                />
                              </div>
                            </div>

                            <div className="mt-2 flex items-center justify-between text-xs text-im-text-muted">
                              <span>{supplier.specialization}</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {supplier.responseTime}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      </section>

      {/* ================================================================
          SECTION 4 : BEFORE / AFTER
          ================================================================ */}
      <section
        id="comparison"
        ref={comparisonReveal.ref}
        className={`bg-white py-16 transition-all duration-800 md:py-24 ${
          comparisonReveal.isVisible
            ? 'translate-y-0 opacity-100'
            : 'translate-y-8 opacity-0'
        }`}
      >
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-im-text-heading md:text-4xl">
              The Transformation
            </h2>
            <p className="mt-3 text-im-text-muted">
              From vague queries to supplier-ready RFQs
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* BEFORE */}
            <div className="rounded-2xl border-2 border-red-100 bg-white p-8">
              <div className="mb-6 flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <h3 className="text-xl font-semibold text-im-text-heading">
                  Current Process
                </h3>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm italic text-im-text-muted">
                  &quot;need packaging machine&quot;
                </p>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  '60-70% of enquiries too vague to quote',
                  '3-5 rounds of back-and-forth',
                  '48-72 hour time to first quote',
                  'Low buyer satisfaction & supplier response',
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                    <span className="text-sm text-im-text-heading">{text}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-lg bg-red-50 p-4">
                <p className="text-sm font-medium text-red-700">
                  Result: Buyer gives up or gets irrelevant quotes
                </p>
              </div>
            </div>

            {/* AFTER */}
            <div className="rounded-2xl border-2 border-green-100 bg-white p-8">
              <div className="mb-6 flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-green-500" />
                <h3 className="text-xl font-semibold text-im-text-heading">
                  AI-Powered Process
                </h3>
              </div>

              {/* Mini structured card */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Category', value: 'Packaging Machines' },
                  { label: 'Machine Type', value: 'Vertical FFS' },
                  { label: 'Budget', value: 'INR 8-12 Lakh' },
                  { label: 'Location', value: 'Noida, UP' },
                ].map((item, i) => (
                  <div key={i} className="rounded-lg bg-green-50 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-green-600">
                      {item.label}
                    </p>
                    <p className="text-sm font-medium text-im-text-heading">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3">
                {[
                  '95% RFQ completeness in one conversation',
                  '1 round -- AI captures all specs',
                  '< 4 hour time to first quote',
                  '3 matched, verified suppliers instantly',
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                    <span className="text-sm text-im-text-heading">{text}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-lg bg-green-50 p-4">
                <p className="text-sm font-medium text-green-700">
                  Result: Supplier quotes in hours, not days
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ================================================================
          SECTION 5 : ARCHITECTURE
          ================================================================ */}
      <section
        id="architecture"
        ref={architectureReveal.ref}
        className={`py-16 transition-all duration-800 md:py-24 ${
          architectureReveal.isVisible
            ? 'translate-y-0 opacity-100'
            : 'translate-y-8 opacity-0'
        }`}
      >
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold text-im-text-heading md:text-4xl">
              How It Works
            </h2>
            <p className="mt-3 text-im-text-muted">
              Three specialized AI agents orchestrated by Google ADK
            </p>
          </div>

          {/* Pipeline visual */}
          <div className="flex flex-col items-center">
            {/* Input */}
            <div className="mx-auto flex w-64 items-center justify-center gap-2 rounded-xl border border-im-border-highlight bg-im-bg-highlight p-4">
              <Search className="h-4 w-4 text-im-blue" />
              <span className="text-sm font-medium text-im-blue">Buyer Query</span>
            </div>

            {/* Arrow down */}
            <div className="my-3 animate-pulse-soft text-im-blue">
              <ChevronDown className="h-6 w-6" />
            </div>

            {/* Orchestrator bar */}
            <div className="mx-auto w-full max-w-3xl rounded-xl bg-im-blue p-4 text-center text-white">
              <div className="flex items-center justify-center gap-2">
                <Zap className="h-5 w-5 text-im-yellow" />
                <span className="font-medium">Orchestrator (Google ADK)</span>
              </div>
              <p className="mt-1 text-sm opacity-75">
                Manages flow, state &amp; handoffs
              </p>
            </div>

            {/* Three arrows down */}
            <div className="flex w-full max-w-3xl justify-around py-3">
              <ChevronDown className="h-6 w-6 animate-pulse-soft text-im-blue" />
              <ChevronDown className="h-6 w-6 animate-pulse-soft text-im-teal-dark" />
              <ChevronDown className="h-6 w-6 animate-pulse-soft text-im-indigo" />
            </div>

            {/* Agent cards */}
            <div className="grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
              {ARCHITECTURE_AGENTS.map((agent, i) => {
                const Icon = agentIconMap[agent.icon] || Search
                const colorMap: Record<string, string> = {
                  'im-blue': 'bg-blue-100 text-im-blue',
                  'im-teal': 'bg-teal-100 text-im-teal-dark',
                  'im-indigo': 'bg-indigo-100 text-im-indigo',
                }
                const iconBg = colorMap[agent.color] || 'bg-gray-100 text-gray-600'

                return (
                  <div
                    key={agent.name}
                    className={`im-card rounded-2xl bg-white p-6 shadow-md transition-all duration-700 ${
                      architectureReveal.isVisible
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-6 opacity-0'
                    }`}
                    style={{
                      transitionDelay: `${i * 200}ms`,
                    }}
                  >
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-full ${iconBg}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-im-text-heading">
                      {agent.name}
                    </h3>
                    <span className="mt-1 inline-block rounded-full bg-im-bg-highlight px-2 py-1 text-xs font-medium text-im-blue">
                      {agent.model}
                    </span>
                    <p className="mt-3 text-sm text-im-text-muted">{agent.purpose}</p>
                    <div className="mt-2 flex items-center gap-1 text-sm font-semibold text-im-teal-dark">
                      <TrendingUp className="h-4 w-4" />
                      {agent.metric}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Arrow down from center */}
            <div className="my-3 animate-pulse-soft text-im-teal-dark">
              <ChevronDown className="h-6 w-6" />
            </div>

            {/* Output */}
            <div className="mx-auto w-80 rounded-xl bg-im-teal-dark p-4 text-center text-white">
              <span className="font-medium">
                Structured RFQ + Matched Suppliers
              </span>
            </div>
          </div>
        </div>
      </section>


      {/* ================================================================
          SECTION 6 : METRICS
          ================================================================ */}
      <section
        id="metrics"
        ref={metricsReveal.ref}
        className={`bg-white py-16 transition-all duration-800 md:py-24 ${
          metricsReveal.isVisible
            ? 'translate-y-0 opacity-100'
            : 'translate-y-8 opacity-0'
        }`}
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-im-text-heading md:text-4xl">
              Impact &amp; Results
            </h2>
            <p className="mt-3 text-im-text-muted">
              Projected improvements based on prototype testing
            </p>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {IMPACT_METRICS.map((metric, i) => {
              const Icon = metricIconMap[metric.icon] || Clock
              return (
                <div
                  key={i}
                  className="im-card rounded-2xl bg-white p-6 shadow-sm"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-im-bg-highlight">
                    <Icon className="h-5 w-5 text-im-blue" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-im-text-heading">
                    {metric.label}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-lg font-medium text-red-400 line-through">
                      {metric.before}
                    </span>
                    <ArrowRight className="h-4 w-4 text-im-teal-dark" />
                    <span className="text-xl font-bold text-im-teal-dark">
                      {metric.after}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-im-text-muted">
                    {metric.description}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Why Now? */}
          <div className="mt-12 rounded-2xl border border-im-border-highlight bg-im-bg-highlight p-8">
            <h3 className="mb-6 text-center text-xl font-bold text-im-text-heading">
              Why This Matters for IndiaMART in 2026
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="text-center">
                <Zap className="mx-auto h-8 w-8 text-im-blue" />
                <p className="mt-2 text-sm font-medium text-im-text-heading">
                  Voice AI Commitment
                </p>
                <p className="mt-1 text-xs text-im-text-muted">
                  CEO Dinesh Agarwal&apos;s 2026 voice-AI push will 10x vague queries
                </p>
              </div>
              <div className="text-center">
                <Target className="mx-auto h-8 w-8 text-im-blue" />
                <p className="mt-2 text-sm font-medium text-im-text-heading">
                  Competitive Pressure
                </p>
                <p className="mt-1 text-xs text-im-text-muted">
                  Udaan, Amazon Business investing in AI procurement
                </p>
              </div>
              <div className="text-center">
                <TrendingUp className="mx-auto h-8 w-8 text-im-blue" />
                <p className="mt-2 text-sm font-medium text-im-text-heading">
                  Revenue Impact
                </p>
                <p className="mt-1 text-xs text-im-text-muted">
                  Better RFQs = higher contact rates = higher ARPU from paying
                  suppliers
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          SECTION 7 : FOOTER
          ================================================================ */}
      <footer className="border-t border-gray-200 bg-im-bg-footer">
        <div className="mx-auto max-w-6xl px-6 py-12">
          {/* Top row */}
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h3 className="text-lg font-bold text-im-text-heading">
                IndiaMART AI Lab
              </h3>
              <p className="mt-1 text-sm text-im-text-muted">
                Built by Gaurav Mahto
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <a
                href="https://github.com/thegauravmahto/indiamart-rfq-system"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-im-text-muted transition-colors hover:text-im-blue"
              >
                <Github className="h-4 w-4" />
                Source Code
              </a>
              <button
                onClick={() => scrollTo('architecture')}
                className="flex items-center gap-2 text-sm text-im-text-muted transition-colors hover:text-im-blue"
              >
                <FileText className="h-4 w-4" />
                Documentation
              </button>
              <a
                href="mailto:gauravdhir180@gmail.com"
                className="flex items-center gap-2 text-sm text-im-text-muted transition-colors hover:text-im-blue"
              >
                <Mail className="h-4 w-4" />
                Contact
              </a>
            </div>
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-gray-200" />

          {/* Bottom row */}
          <div className="flex flex-col items-start justify-between gap-3 text-xs text-im-text-muted md:flex-row md:items-center">
            <p>
              Product Manager Assignment &mdash; Conversational AI | IndiaMART
              InterMESH Ltd
            </p>
            <p>Built with Next.js, Tailwind CSS, Google ADK + Gemini 2.0 Flash</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
