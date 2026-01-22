import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SettingsState {
  // Profile
  displayName: string
  email: string

  // Preferences
  autoSaveNotes: boolean
  markAttendedComplete: boolean
  showCompletionPercentages: boolean

  // Appearance
  theme: 'dark' | 'light' | 'auto'
  compactLayout: boolean
  showAnimations: boolean
  glassmorphicEffects: boolean

  // Notifications
  deadlineReminders: boolean

  classReminders: boolean
  dailySummary: boolean

  // Timer
  timerSoundEnabled: boolean
  timerVolume: number
  autoStartBreaks: boolean

  // Exam Settings
  examName: string
  examDate: string | null

  // Actions
  updateProfile: (name: string, email: string) => void
  updateExamDetails: (name: string, date: string | null) => void
  updatePreference: (key: keyof SettingsState, value: boolean) => void
  updateAppearance: (key: keyof SettingsState, value: boolean | string) => void
  updateNotifications: (key: keyof SettingsState, value: boolean) => void
  updateTimerSettings: (key: keyof SettingsState, value: boolean | number) => void
  setTheme: (theme: 'dark' | 'light' | 'auto') => void
  resetAllSettings: () => void
}

const defaultSettings = {
  // Profile
  displayName: 'Student',
  email: '',

  // Preferences
  autoSaveNotes: true,
  markAttendedComplete: false,
  showCompletionPercentages: true,

  // Appearance
  theme: 'dark' as const,
  compactLayout: false,
  showAnimations: true,
  glassmorphicEffects: true,

  // Notifications
  deadlineReminders: true,

  classReminders: true,
  dailySummary: false,

  // Exam Defaults
  examName: '',
  examDate: null,

  // Timer
  timerSoundEnabled: true,
  timerVolume: 50,
  autoStartBreaks: false
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      updateProfile: (name, email) => set({ displayName: name, email }),
      updateExamDetails: (name, date) => set({ examName: name, examDate: date }),

      updatePreference: (key, value) => set({ [key]: value }),

      updateAppearance: (key, value) => {
        set({ [key]: value })
        // Apply theme to document if theme is changed
        if (key === 'theme') {
          const theme = value as string
          if (theme === 'dark') {
            document.documentElement.classList.add('dark')
            document.documentElement.classList.remove('light')
          } else if (theme === 'light') {
            document.documentElement.classList.add('light')
            document.documentElement.classList.remove('dark')
          } else {
            // Auto: use system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            if (prefersDark) {
              document.documentElement.classList.add('dark')
              document.documentElement.classList.remove('light')
            } else {
              document.documentElement.classList.add('light')
              document.documentElement.classList.remove('dark')
            }
          }
        }
      },

      updateNotifications: (key, value) => set({ [key]: value }),

      updateTimerSettings: (key, value) => set({ [key]: value }),

      setTheme: (theme) => {
        set({ theme })
        // Apply theme immediately
        if (theme === 'dark') {
          document.documentElement.classList.add('dark')
          document.documentElement.classList.remove('light')
        } else if (theme === 'light') {
          document.documentElement.classList.add('light')
          document.documentElement.classList.remove('dark')
        } else {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          if (prefersDark) {
            document.documentElement.classList.add('dark')
            document.documentElement.classList.remove('light')
          } else {
            document.documentElement.classList.add('light')
            document.documentElement.classList.remove('dark')
          }
        }
      },

      resetAllSettings: () => set(defaultSettings)
    }),
    {
      name: 'apex-settings'
    }
  )
)
