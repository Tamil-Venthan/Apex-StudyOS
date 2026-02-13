import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useSettingsStore } from './useSettingsStore'

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface AISettings {
  provider: 'gemini' | 'openai' | 'claude' | 'local' | 'openrouter'
  gemini?: {
    apiKey: string
    model?: string
  }
  openai?: {
    apiKey: string
    model?: string
  }
  claude?: {
    apiKey: string
    model?: string
  }
  openrouter?: {
    apiKey: string
    model?: string
  }
  enabled: boolean
  responseLength: 'short' | 'long'
}

interface AIStore {
  messages: AIMessage[]
  settings: AISettings
  isLoading: boolean
  error: string | null

  // Actions
  sendMessage: (message: string) => Promise<void>
  clearMessages: () => void
  updateSettings: (settings: Partial<AISettings>) => Promise<void>
  initializeAI: () => Promise<void>
}

export const useAIStore = create<AIStore>()(
  persist(
    (set, get) => ({
      messages: [],
      settings: {
        provider: 'gemini',
        enabled: false,
        responseLength: 'long',
        openrouter: {
          apiKey: '',
          model: 'meta-llama/llama-3.3-70b-instruct:free'
        }
      },
      isLoading: false,
      error: null,

      sendMessage: async (message: string) => {
        const userMessage: AIMessage = {
          id: `user-${Date.now()}`,
          role: 'user',
          content: message,
          timestamp: new Date()
        }

        set({ messages: [...get().messages, userMessage], isLoading: true, error: null })

        try {
          const settingsStore = useSettingsStore.getState()
          const aiSettings = get().settings

          const response = await window.electron.ipcRenderer.invoke(
            'ai:send-message',
            'user-1',
            message,
            settingsStore.displayName,
            settingsStore.examName,
            settingsStore.examDate || undefined,
            aiSettings.responseLength
          )

          if (response.success && response.message) {
            const aiMessage: AIMessage = {
              id: `ai-${Date.now()}`,
              role: 'assistant',
              content: response.message,
              timestamp: new Date()
            }
            set({ messages: [...get().messages, aiMessage], isLoading: false })
          } else {
            set({ error: response.error || 'Failed to get AI response', isLoading: false })
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to send message',
            isLoading: false
          })
        }
      },

      clearMessages: () => {
        set({ messages: [], error: null })
      },

      updateSettings: async (newSettings: Partial<AISettings>) => {
        const updated = { ...get().settings, ...newSettings }
        set({ settings: updated })

        // Initialize AI with new settings
        if (updated.enabled) {
          try {
            await window.electron.ipcRenderer.invoke('ai:initialize', updated)
          } catch (error) {
            console.error('Failed to initialize AI:', error)
          }
        }
      },

      initializeAI: async () => {
        const settings = get().settings
        if (settings.enabled) {
          try {
            await window.electron.ipcRenderer.invoke('ai:initialize', settings)
          } catch (error) {
            console.error('Failed to initialize AI:', error)
          }
        }
      }
    }),
    {
      name: 'ai-storage',
      partialize: (state) => ({
        messages: state.messages.slice(-50), // Keep last 50 messages
        settings: state.settings
      })
    }
  )
)
