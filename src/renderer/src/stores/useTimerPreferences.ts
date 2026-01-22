import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface TimerPreferences {
  // Duration settings (in seconds)
  focusDuration: number
  shortBreakDuration: number
  longBreakDuration: number

  // Sound settings
  soundEnabled: boolean
  soundVolume: number // 0-100
  soundType: 'bell' | 'chime' | 'digital' | 'bowl'

  // Behavior settings
  autoStartBreaks: boolean
  autoStartPomodoros: boolean
  notificationsEnabled: boolean
  glowEffectEnabled: boolean
  celebrationEnabled: boolean

  // Sessions before long break
  longBreakInterval: number
}

interface TimerPreferencesStore {
  preferences: TimerPreferences
  updatePreferences: (preferences: Partial<TimerPreferences>) => void
  resetToDefaults: () => void
}

const DEFAULT_PREFERENCES: TimerPreferences = {
  focusDuration: 25 * 60, // 25 minutes
  shortBreakDuration: 5 * 60, // 5 minutes
  longBreakDuration: 15 * 60, // 15 minutes
  soundEnabled: true,
  soundVolume: 70,
  soundType: 'bell',
  autoStartBreaks: false,
  autoStartPomodoros: false,
  notificationsEnabled: true,
  glowEffectEnabled: true,
  celebrationEnabled: true,
  longBreakInterval: 4
}

export const useTimerPreferences = create<TimerPreferencesStore>()(
  persist(
    (set) => ({
      preferences: DEFAULT_PREFERENCES,

      updatePreferences: (newPreferences) =>
        set((state) => ({
          preferences: { ...state.preferences, ...newPreferences }
        })),

      resetToDefaults: () => set({ preferences: DEFAULT_PREFERENCES })
    }),
    {
      name: 'timer-preferences'
    }
  )
)
