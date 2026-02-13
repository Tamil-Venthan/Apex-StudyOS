import React, { useEffect, useRef, useState } from 'react'
import { useAIStore, AISettings } from '@renderer/stores/useAIStore'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Send,
  Loader2,
  Settings,
  Trash2,
  X,
  Key,
  Zap,
  TrendingUp,
  Target,
  Copy,
  Check
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export default function AICoach(): React.ReactElement {
  const { messages, isLoading, error, sendMessage, clearMessages, settings, updateSettings } =
    useAIStore()
  const [input, setInput] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [provider, setProvider] = useState<AISettings['provider']>(settings.provider)
  const [apiKey, setApiKey] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [responseLength, setResponseLength] = useState<'short' | 'long'>(
    settings.responseLength || 'long'
  )
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize state from settings
  useEffect(() => {
    if (showSettings) {
      setProvider(settings.provider)
      if (settings.provider === 'gemini') {
        setApiKey(settings.gemini?.apiKey || '')
        setSelectedModel(settings.gemini?.model || 'gemini-2.5-flash-lite')
      } else if (settings.provider === 'openrouter') {
        setApiKey(settings.openrouter?.apiKey || '')
        setSelectedModel(
          settings.openrouter?.model || 'meta-llama/llama-3.3-70b-instruct:free'
        )
      }
    }
  }, [showSettings, settings.provider]) // Only run when settings modal opens

  const handleProviderChange = (newProvider: AISettings['provider']): void => {
    setProvider(newProvider)
    if (newProvider === 'gemini') {
      setApiKey(settings.gemini?.apiKey || '')
      setSelectedModel(settings.gemini?.model || 'gemini-2.5-flash-lite')
    } else if (newProvider === 'openrouter') {
      setApiKey(settings.openrouter?.apiKey || '')
      setSelectedModel(
        settings.openrouter?.model || 'meta-llama/llama-3.3-70b-instruct:free'
      )
    }
  }

  const quickActions = [
    { icon: TrendingUp, label: 'What should I study today?', query: 'What should I study today?' },
    {
      icon: Target,
      label: 'Analyze my progress',
      query: 'Analyze my overall study progress and performance'
    },
    {
      icon: Zap,
      label: "What's lagging?",
      query: 'Which subjects or topics need more focus? What am I falling behind on?'
    }
  ]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    // Initialize AI on mount
    const isConfigured =
      settings.enabled &&
      ((settings.provider === 'gemini' && settings.gemini?.apiKey) ||
        (settings.provider === 'openrouter' && settings.openrouter?.apiKey))

    if (isConfigured) {
      useAIStore.getState().initializeAI()
    }
  }, [settings.enabled, settings.provider, settings.gemini?.apiKey, settings.openrouter?.apiKey])

  const handleSend = async (): Promise<void> => {
    if (!input.trim() || isLoading) return

    const message = input.trim()
    setInput('')
    await sendMessage(message)
  }

  const handleQuickAction = async (query: string): Promise<void> => {
    if (isLoading) return
    await sendMessage(query)
  }

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSaveSettings = async (): Promise<void> => {
    const updates: Partial<AISettings> = {
      provider: provider,
      enabled: apiKey.length > 0,
      responseLength: responseLength
    }

    if (provider === 'gemini') {
      updates.gemini = { apiKey, model: selectedModel }
    } else if (provider === 'openrouter') {
      updates.openrouter = { apiKey, model: selectedModel }
    }

    await updateSettings(updates)
    setShowSettings(false)
  }

  const isConfigured =
    settings.enabled &&
    ((settings.provider === 'gemini' && settings.gemini?.apiKey) ||
      (settings.provider === 'openrouter' && settings.openrouter?.apiKey))

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">AI Study Coach</h1>
            <p className="text-muted-foreground">
              Your intelligent study companion powered by {settings.provider === 'openrouter' ? 'OpenRouter' : 'Gemini'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              title="Clear chat"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card p-6 rounded-xl max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">AI Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Provider</label>
                  <select
                    value={provider}
                    onChange={(e) => handleProviderChange(e.target.value as AISettings['provider'])}
                    className="w-full p-3 rounded-lg bg-[#1a1a2e] border border-white/10 focus:outline-none focus:border-primary text-white"
                  >
                    <option value="gemini" className="bg-[#1a1a2e]">
                      Google Gemini
                    </option>
                    <option value="openrouter" className="bg-[#1a1a2e]">
                      OpenRouter (Multiple Models)
                    </option>
                    <option disabled className="bg-[#1a1a2e]">
                      OpenAI (Coming Soon)
                    </option>
                    <option disabled className="bg-[#1a1a2e]">
                      Claude (Coming Soon)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Model</label>
                  {provider === 'gemini' ? (
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full p-3 rounded-lg bg-[#1a1a2e] border border-white/10 focus:outline-none focus:border-primary text-white"
                    >
                      <option value="gemini-2.5-flash-lite" className="bg-[#1a1a2e]">
                        Gemini 2.5 Flash Lite (Recommended)
                      </option>
                      <option value="gemini-2.5-flash" className="bg-[#1a1a2e]">
                        Gemini 2.5 Flash
                      </option>
                      <option value="gemini-3-flash" className="bg-[#1a1a2e]">
                        Gemini 3 Flash
                      </option>
                    </select>
                  ) : (
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full p-3 rounded-lg bg-[#1a1a2e] border border-white/10 focus:outline-none focus:border-primary text-white"
                    >
                      <option value="meta-llama/llama-3.3-70b-instruct:free" className="bg-[#1a1a2e]">Llama 3.3 70B Instruct (Free)</option>
                      <option value="google/gemini-2.0-flash-lite-preview-02-05:free" className="bg-[#1a1a2e]">Gemini 2.0 Flash Lite (Free)</option>
                      <option value="xiaomi/mimo-v2-flash:free" className="bg-[#1a1a2e]">Xiaomi MiMo V2 Flash (Free)</option>
                      <option value="mistralai/devstral-2512:free" className="bg-[#1a1a2e]">Mistral Devstral 2512 (Free)</option>
                      <option value="tngtech/deepseek-r1t2-chimera:free" className="bg-[#1a1a2e]">DeepSeek R1T2 Chimera (Free)</option>
                      <option value="tngtech/deepseek-r1t-chimera:free" className="bg-[#1a1a2e]">DeepSeek R1T Chimera (Free)</option>
                      <option value="z-ai/glm-4.5-air:free" className="bg-[#1a1a2e]">GLM 4.5 Air (Free)</option>
                      <option value="deepseek/deepseek-r1-0528:free" className="bg-[#1a1a2e]">DeepSeek R1 0528 (Free)</option>
                      <option value="tngtech/tng-r1t-chimera:free" className="bg-[#1a1a2e]">TNG R1T Chimera (Free)</option>
                      <option value="qwen/qwen3-coder:free" className="bg-[#1a1a2e]">Qwen 2.5 Coder 32B (Free)</option>
                      <option value="nvidia/nemotron-3-nano-30b-a3b:free" className="bg-[#1a1a2e]">Nvidia Nemotron 3 Nano (Free)</option>
                      <option value="google/gemma-3-27b-it:free" className="bg-[#1a1a2e]">Gemma 3 27B IT (Free)</option>
                      <option value="openai/gpt-oss-120b:free" className="bg-[#1a1a2e]">GPT OSS 120B (Free)</option>
                      <option value="google/gemma-3n-e2b-it:free" className="bg-[#1a1a2e]">Gemma 3N 2B IT (Free)</option>
                      <option value="google/gemma-3-4b-it:free" className="bg-[#1a1a2e]">Gemma 3 4B IT (Free)</option>
                      <option value="google/gemma-3n-e4b-it:free" className="bg-[#1a1a2e]">Gemma 3N 4B IT (Free)</option>
                    </select>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {provider === 'gemini' ? (
                      <>
                        {selectedModel === 'gemini-2.5-flash-lite' &&
                          '✓ Best for free tier - 10 RPM, 250K tokens/min'}
                        {selectedModel === 'gemini-2.5-flash' &&
                          '⚡ Balanced - 5 RPM, 250K tokens/min'}
                        {selectedModel === 'gemini-3-flash' && '🚀 Latest - 5 RPM, 250K tokens/min'}
                      </>
                    ) : (
                      '✓ Free models via OpenRouter (No credits required)'
                    )}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Response Length</label>
                  <select
                    value={responseLength}
                    onChange={(e) => setResponseLength(e.target.value as 'short' | 'long')}
                    className="w-full p-3 rounded-lg bg-[#1a1a2e] border border-white/10 focus:outline-none focus:border-primary text-white"
                  >
                    <option value="short" className="bg-[#1a1a2e]">
                      Short Answer
                    </option>
                    <option value="long" className="bg-[#1a1a2e]">
                      Long Answer (Recommended)
                    </option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-2">
                    {responseLength === 'short' && '⚡ Quick, concise responses'}
                    {responseLength === 'long' && '📚 Detailed, comprehensive explanations'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={`Enter your ${provider === 'gemini' ? 'Gemini' : 'OpenRouter'} API key`}
                    className="w-full p-3 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Get your API key from{' '}
                    <a
                      href={
                        provider === 'gemini'
                          ? 'https://aistudio.google.com/app/apikey'
                          : 'https://openrouter.ai/keys'
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {provider === 'gemini' ? 'Google AI Studio' : 'OpenRouter Dashboard'}
                    </a>
                  </p>
                </div>

                <button
                  onClick={handleSaveSettings}
                  disabled={!apiKey}
                  className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col glass-card rounded-2xl overflow-hidden shadow-2xl shadow-black/20">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-custom">
          {!isConfigured ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-6 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 mb-6 border border-white/10 shadow-[0_0_30px_rgba(168,85,247,0.2)]"
              >
                <Sparkles className="w-12 h-12 text-purple-400" />
              </motion.div>
              <h2 className="text-3xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">Welcome to AI Study Coach</h2>
              <p className="text-muted-foreground mb-8 max-w-md text-lg leading-relaxed">
                Your intelligent study companion. Get personalized recommendations and deep insights powered by advanced AI.
              </p>
              <button
                onClick={() => setShowSettings(true)}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white font-semibold hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all transform hover:scale-105 flex items-center gap-3 group"
              >
                <Key className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Configure to Start
              </button>

              <div className="mt-12 text-left max-w-lg w-full glass-card p-6 rounded-xl border-white/5">
                <p className="text-sm font-semibold mb-4 text-purple-300 uppercase tracking-wider"> Capabilities</p>
                <ul className="text-sm text-muted-foreground space-y-3">
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    Personalized study plans & scheduling
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                    Progress tracking & performance analysis
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Exam preparation strategies
                  </li>
                </ul>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                <Sparkles className="w-20 h-20 text-primary relative z-10 opacity-80" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">How can I help you today?</h3>
              <p className="text-muted-foreground mb-8">Select a quick action or start chatting</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl px-4">
                {quickActions.map((action, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleQuickAction(action.query)}
                    className="p-5 rounded-xl glass-card border-white/5 hover:border-primary/30 hover:bg-white/5 transition-all text-left group hover:shadow-lg hover:-translate-y-1"
                  >
                    <div className="p-2 rounded-lg bg-primary/10 w-fit mb-3 group-hover:bg-primary/20 transition-colors">
                      <action.icon className="w-5 h-5 text-primary" />
                    </div>
                    <p className="font-medium text-white/90">{action.label}</p>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <MessageBubble key={message.id} message={message} index={index} />
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-4"
                >
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/20">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 p-5 rounded-2xl bg-white/5 border border-white/5 w-fit">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0s' }} />
                      <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 py-3 bg-red-500/10 border-t border-red-500/20 text-red-400 text-sm flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full bg-red-500" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        {isConfigured && (
          <div className="p-6 pt-2 bg-gradient-to-t from-black/20 to-transparent">
            <div className="flex gap-3 items-end bg-white/5 p-2 rounded-2xl border border-white/10 focus-within:border-primary/50 focus-within:bg-white/10 transition-all shadow-lg backdrop-blur-md">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-transparent border-none focus:outline-none placeholder:text-white/30 text-white min-h-[50px]"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <div className="text-center mt-2">
              <p className="text-[10px] text-white/20">AI responses can be inaccurate. Verify important information.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Message Bubble Component
interface MessageBubbleProps {
  message: {
    role: 'user' | 'assistant'
    content: string
  }
  index: number
}

function MessageBubble({ message, index }: MessageBubbleProps): React.ReactElement {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-start gap-4 ${isUser ? 'flex-row-reverse' : ''} group`}
    >
      {!isUser && (
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/20 flex-shrink-0 mt-1">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      )}
      <div
        className={`flex-1 max-w-[85%] rounded-2xl relative group-hover:shadow-md transition-shadow ${isUser
          ? 'bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg shadow-primary/10 rounded-tr-sm'
          : 'bg-white/5 border border-white/5 shadow-sm rounded-tl-sm'
          }`}
      >
        <div className={`p-5 ${!isUser ? 'pb-2' : ''} text-[15px] leading-relaxed`}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none 
              prose-headings:font-bold prose-headings:text-purple-200
              prose-h1:text-2xl prose-h1:mb-6 prose-h1:mt-2
              prose-h2:text-xl prose-h2:mb-4 prose-h2:mt-10
              prose-h3:text-lg prose-h3:mb-3 prose-h3:mt-8
              prose-p:my-4 prose-p:leading-loose prose-p:text-white/90
              prose-ul:my-6 prose-ul:ml-5 prose-li:my-2 prose-li:marker:text-purple-400
              prose-ol:my-6 prose-ol:ml-5 prose-li:pl-2
              prose-strong:text-purple-300 prose-strong:font-bold
              prose-blockquote:border-l-4 prose-blockquote:border-purple-500/50 prose-blockquote:pl-6 prose-blockquote:py-1 prose-blockquote:my-6 prose-blockquote:italic prose-blockquote:text-white/70 prose-blockquote:bg-white/5 prose-blockquote:rounded-r-lg
              prose-code:text-pink-300 prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-code:font-mono
              prose-pre:bg-[#0f111a] prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-pre:p-4 prose-pre:my-6
              prose-hr:my-8 prose-hr:border-white/10
              prose-table:w-full prose-table:border-collapse prose-table:my-6 prose-table:rounded-lg prose-table:overflow-hidden prose-table:border prose-table:border-white/10
              prose-thead:bg-white/10 prose-thead:text-white
              prose-th:p-4 prose-th:text-left prose-th:font-semibold prose-th:border-b prose-th:border-white/10
              prose-td:p-4 prose-td:border-b prose-td:border-white/5 prose-td:text-white/80
              prose-tr:hover:bg-white/5 prose-tr:transition-colors">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
        {!isUser && (
          <div className="px-4 pb-3 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white"
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
