'use client'

import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react'
import {
  Key,
  Eye,
  EyeOff,
  Send,
  RotateCcw,
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MessageSquare,
  Star,
  MapPin,
  Award,
  ChevronRight,
} from 'lucide-react'
import type { Chat } from '@google/genai'
import {
  validateApiKey,
  createRFQChat,
  sendMessage,
  parseRFQFromResponse,
  getDisplayText,
  msgId,
  type LiveChatMessage,
  type LiveRFQResult,
} from '@/lib/geminiRFQ'

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Typing indicator dots */
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-im-blue/40"
            style={{
              animation: 'bounce 1.4s infinite ease-in-out both',
              animationDelay: `${i * 0.16}s`,
            }}
          />
        ))}
      </div>
      <span className="ml-2 text-xs text-im-text-muted">AI is thinking...</span>
    </div>
  )
}

/** RFQ Result Card */
function RFQCard({ result }: { result: LiveRFQResult }) {
  return (
    <div className="mt-4 space-y-4">
      {/* Completeness badge */}
      <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2">
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        <span className="text-sm font-semibold text-green-800">
          RFQ Generated - {result.completenessScore}% Complete
        </span>
      </div>

      {/* RFQ Fields */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-im-text-heading">
          <Sparkles className="h-4 w-4 text-im-teal" />
          Structured RFQ
        </h4>
        <div className="space-y-2">
          {result.rfqFields.map((field, i) => (
            <div
              key={i}
              className="flex items-start justify-between gap-4 border-b border-gray-50 py-1.5 last:border-0"
            >
              <span className="text-xs font-medium text-im-text-muted">
                {field.label}
              </span>
              <div className="flex items-center gap-2 text-right">
                <span className="text-sm font-medium text-im-text-heading">
                  {field.value}
                </span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                    field.source === 'extracted'
                      ? 'bg-blue-50 text-blue-600'
                      : field.source === 'clarified'
                        ? 'bg-green-50 text-green-600'
                        : 'bg-amber-50 text-amber-600'
                  }`}
                >
                  {field.source}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Supplier Matches */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-im-text-heading">
          <Award className="h-4 w-4 text-im-teal" />
          Matched Suppliers
        </h4>
        <div className="space-y-3">
          {result.suppliers.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5 transition-colors hover:bg-gray-50"
            >
              <div className="flex-1">
                <p className="text-sm font-semibold text-im-text-heading">
                  {s.name}
                </p>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-im-text-muted">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {s.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {s.rating}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-im-text-muted">
                  {s.speciality}
                </p>
              </div>
              <div className="ml-3 text-right">
                <div
                  className={`text-lg font-bold ${
                    s.matchScore >= 90
                      ? 'text-green-600'
                      : s.matchScore >= 80
                        ? 'text-im-teal'
                        : 'text-amber-600'
                  }`}
                >
                  {s.matchScore}%
                </div>
                <div className="text-[10px] text-im-text-muted">match</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main LiveDemo Component
// ---------------------------------------------------------------------------

export default function LiveDemo() {
  // -- API key state --
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [keyStatus, setKeyStatus] = useState<
    'idle' | 'validating' | 'valid' | 'invalid'
  >('idle')
  const [keyError, setKeyError] = useState('')

  // -- Chat state --
  const [chatSession, setChatSession] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<LiveChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [rfqResult, setRfqResult] = useState<LiveRFQResult | null>(null)

  // -- Refs --
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Focus input after validation
  useEffect(() => {
    if (keyStatus === 'valid') {
      inputRef.current?.focus()
    }
  }, [keyStatus])

  // -- Validate API key --
  const handleValidateKey = useCallback(async () => {
    if (!apiKey.trim()) return
    setKeyStatus('validating')
    setKeyError('')
    try {
      await validateApiKey(apiKey.trim())
      setKeyStatus('valid')
      // Create the chat session
      const chat = createRFQChat(apiKey.trim())
      setChatSession(chat)
      // Add welcome message
      setMessages([
        {
          id: msgId(),
          role: 'system',
          text: 'AI RFQ Assistant connected. Type your product query to begin!',
          timestamp: Date.now(),
        },
      ])
    } catch (err: unknown) {
      setKeyStatus('invalid')
      setKeyError(
        err instanceof Error ? err.message : 'Failed to validate key'
      )
    }
  }, [apiKey])

  // -- Send a chat message --
  const handleSend = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault()
      if (!inputText.trim() || !chatSession || isLoading) return

      const userText = inputText.trim()
      setInputText('')

      // Add user message
      const userMsg: LiveChatMessage = {
        id: msgId(),
        role: 'user',
        text: userText,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, userMsg])
      setIsLoading(true)

      try {
        const response = await sendMessage(chatSession, userText)

        // Check for RFQ completion
        const rfq = parseRFQFromResponse(response)
        const displayText = getDisplayText(response)

        // Add AI response
        const aiMsg: LiveChatMessage = {
          id: msgId(),
          role: 'ai',
          text: displayText || 'I\'ve generated your structured RFQ below!',
          timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, aiMsg])

        if (rfq) {
          setRfqResult(rfq)
          // Add system message
          setMessages((prev) => [
            ...prev,
            {
              id: msgId(),
              role: 'system',
              text: `Structured RFQ generated with ${rfq.completenessScore}% completeness score`,
              timestamp: Date.now(),
            },
          ])
        }
      } catch (err: unknown) {
        const errMsg =
          err instanceof Error ? err.message : 'Something went wrong'
        setMessages((prev) => [
          ...prev,
          {
            id: msgId(),
            role: 'system',
            text: `Error: ${errMsg}`,
            timestamp: Date.now(),
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [inputText, chatSession, isLoading]
  )

  // -- Reset everything --
  const handleReset = useCallback(() => {
    setMessages([])
    setRfqResult(null)
    setInputText('')
    setIsLoading(false)
    if (apiKey.trim()) {
      const chat = createRFQChat(apiKey.trim())
      setChatSession(chat)
      setMessages([
        {
          id: msgId(),
          role: 'system',
          text: 'Conversation reset. Type a new product query to start fresh!',
          timestamp: Date.now(),
        },
      ])
    }
  }, [apiKey])

  // =========================================================================
  // RENDER: API Key Input Screen
  // =========================================================================
  if (keyStatus !== 'valid') {
    return (
      <div className="mx-auto max-w-lg">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
          {/* Header */}
          <div className="bg-gradient-to-r from-im-blue to-im-blue-light px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Try It Live with Gemini AI</h3>
                <p className="text-sm text-white/70">
                  Bring your own API key -- it stays in your browser
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="mb-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">
              <p className="font-medium">How to get a free Gemini API key:</p>
              <ol className="mt-1.5 list-inside list-decimal space-y-0.5 text-xs text-blue-700">
                <li>Visit Google AI Studio (link below)</li>
                <li>Sign in with your Google account</li>
                <li>Click &quot;Create API Key&quot; -- it&apos;s free!</li>
                <li>Paste the key below</li>
              </ol>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 underline decoration-blue-300 hover:text-blue-800"
              >
                Open Google AI Studio
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Key input */}
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value)
                  if (keyStatus === 'invalid') setKeyStatus('idle')
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleValidateKey()}
                placeholder="Paste your Gemini API key here..."
                className="w-full rounded-lg border border-gray-300 py-3 pl-4 pr-20 text-sm transition-colors focus:border-im-blue focus:outline-none focus:ring-2 focus:ring-im-blue/20"
              />
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="rounded p-1.5 text-gray-400 hover:text-gray-600"
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {keyStatus === 'invalid' && keyError && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                {keyError}
              </div>
            )}

            {/* Validate button */}
            <button
              onClick={handleValidateKey}
              disabled={!apiKey.trim() || keyStatus === 'validating'}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-im-teal-dark px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-im-teal disabled:cursor-not-allowed disabled:opacity-50"
            >
              {keyStatus === 'validating' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Connect & Start Demo
                </>
              )}
            </button>

            {/* Privacy note */}
            <p className="mt-3 text-center text-[11px] text-im-text-muted">
              Your API key is used only in your browser and is never sent to our
              servers.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // =========================================================================
  // RENDER: Chat Interface
  // =========================================================================
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      {/* LEFT: Chat Window */}
      <div className="lg:col-span-3">
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          {/* Chat header */}
          <div className="flex items-center justify-between bg-im-blue px-4 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">IndiaMART AI Assistant</p>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                  <span className="text-xs text-white/70">
                    Live - Gemini 2.0 Flash
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/20"
              title="Reset conversation"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>

          {/* Chat messages */}
          <div className="max-h-[500px] min-h-[350px] space-y-3 overflow-y-auto p-4">
            {messages.map((msg) => {
              if (msg.role === 'user') {
                return (
                  <div key={msg.id} className="ml-auto max-w-[80%]">
                    <div className="rounded-2xl rounded-br-sm bg-im-bg-highlight p-3 text-sm text-im-text-heading">
                      {msg.text}
                    </div>
                  </div>
                )
              }
              if (msg.role === 'system') {
                return (
                  <div
                    key={msg.id}
                    className="mx-auto max-w-[90%] text-center"
                  >
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-im-teal/10 px-3 py-1 text-xs font-medium text-im-teal">
                      <Sparkles className="h-3 w-3" />
                      {msg.text}
                    </span>
                  </div>
                )
              }
              // AI message
              return (
                <div key={msg.id} className="mr-auto max-w-[85%]">
                  <div className="rounded-2xl rounded-bl-sm bg-white p-3 text-sm text-im-text-heading shadow-sm ring-1 ring-gray-100">
                    {msg.text}
                  </div>
                </div>
              )
            })}

            {isLoading && <TypingIndicator />}
            <div ref={chatEndRef} />
          </div>

          {/* Input area */}
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 border-t border-gray-100 p-3"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                rfqResult
                  ? 'RFQ generated! Type to ask follow-ups or click Reset...'
                  : 'Type your product query... (e.g., mujhe packaging machine chahiye)'
              }
              disabled={isLoading}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm transition-colors focus:border-im-blue focus:outline-none focus:ring-2 focus:ring-im-blue/20 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-im-teal-dark text-white transition-colors hover:bg-im-teal disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT: RFQ Output / Tips */}
      <div className="lg:col-span-2">
        {rfqResult ? (
          <RFQCard result={rfqResult} />
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white/50 p-6">
            <h4 className="mb-3 text-sm font-bold text-im-text-heading">
              How it works
            </h4>
            <div className="space-y-3">
              {[
                {
                  step: '1',
                  text: 'Type any product query -- even vague or in Hinglish',
                },
                {
                  step: '2',
                  text: 'AI classifies intent and asks smart follow-up questions',
                },
                {
                  step: '3',
                  text: 'Answer a few questions about specs, budget, location',
                },
                {
                  step: '4',
                  text: 'Get a structured RFQ + matched suppliers instantly',
                },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-im-blue text-xs font-bold text-white">
                    {item.step}
                  </div>
                  <p className="text-sm text-im-text-muted">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-lg bg-amber-50 px-4 py-3">
              <p className="text-xs font-medium text-amber-800">
                Try these queries:
              </p>
              <div className="mt-1.5 space-y-1">
                {[
                  'mujhe packaging machine chahiye',
                  'need industrial water purifier for factory',
                  'solar panel lagwana hai office ke liye',
                  'bulk order for cotton t-shirts',
                ].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      setInputText(q)
                      inputRef.current?.focus()
                    }}
                    className="flex w-full items-center gap-1 rounded px-2 py-1 text-left text-xs text-amber-700 transition-colors hover:bg-amber-100"
                  >
                    <ChevronRight className="h-3 w-3 flex-shrink-0" />
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
