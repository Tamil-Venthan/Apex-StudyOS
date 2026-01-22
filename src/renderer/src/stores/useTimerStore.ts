import { create } from 'zustand'
import { useEffect, useRef } from 'react'

interface StudySession {
  id: string
  userId: string
  subjectId?: string
  startTime: Date
  endTime?: Date
  duration?: number
  focusScore?: number
  sessionType: string
  createdAt: Date
}

interface TimerStore {
  isRunning: boolean
  timeLeft: number // seconds
  mode: 'focus' | 'shortBreak' | 'longBreak'
  totalWorkTime: number
  sessions: StudySession[]
  currentSession: StudySession | null
  currentSessionDuration: number
  loading: boolean
  lastTick: number | null

  // Timer actions
  startTimer: (subjectId?: string) => void
  pauseTimer: () => void
  resetTimer: (duration: number) => void
  tick: () => void
  switchMode: (mode: 'focus' | 'shortBreak' | 'longBreak', duration: number) => void

  // Session actions
  startSession: (subjectId?: string) => Promise<void>
  endSession: (focusScore?: number) => Promise<void>
  fetchTodaySessions: () => Promise<void>
  fetchWeeklySessions: () => Promise<void>
}

const TEMP_USER_ID = 'user-1'

export const useTimerStore = create<TimerStore>((set, get) => ({
  isRunning: false,
  timeLeft: 25 * 60,
  mode: 'focus',
  totalWorkTime: 0,
  sessions: [],
  currentSession: null,
  currentSessionDuration: 0,
  loading: false,
  lastTick: null,

  startTimer: (subjectId?: string) => {
    const state = get()
    if (!state.currentSession && state.mode === 'focus') {
      state.startSession(subjectId)
    }
    set({ isRunning: true, lastTick: Date.now() })
  },

  pauseTimer: () => set({ isRunning: false, lastTick: null }),

  resetTimer: (duration: number) => {
    set({ timeLeft: duration, isRunning: false, lastTick: null })
  },

  tick: () => {
    const state = get()
    if (state.isRunning && state.timeLeft > 0) {
      const now = Date.now()
      const lastTick = state.lastTick || now
      const delta = Math.floor((now - lastTick) / 1000)

      if (delta >= 1) {
        const newTimeLeft = Math.max(state.timeLeft - delta, 0)
        const consumed = state.timeLeft - newTimeLeft

        // Update timeLeft, lastTick, and accumulators
        const updates: Partial<TimerStore> = {
          timeLeft: newTimeLeft,
          lastTick: now
        }

        if (state.mode === 'focus') {
          updates.totalWorkTime = state.totalWorkTime + consumed
          updates.currentSessionDuration = state.currentSessionDuration + consumed
        }

        set(updates)

        // Auto-switch when timer reaches 0
        if (newTimeLeft === 0) {
          state.pauseTimer()
          // Play sound notification here if needed
        }
      } else if (!state.lastTick) {
        // Initialize lastTick if it wasn't set (fail-safe)
        set({ lastTick: now })
      }
    }
  },

  switchMode: (mode, duration) => {
    set({ mode, timeLeft: duration, isRunning: false, lastTick: null })
  },

  startSession: async (subjectId?: string) => {
    try {
      const state = get() // Get latest state
      const result = await window.electron.ipcRenderer.invoke('sessions:create', {
        userId: TEMP_USER_ID,
        subjectId,
        sessionType: state.mode, // Use current mode (focus, shortBreak, longBreak)
        startTime: new Date().toISOString()
      })

      if (result.success) {
        set({ currentSession: result.data, currentSessionDuration: 0 })
      }
    } catch (error) {
      console.error('Failed to start session:', error)
    }
  },

  endSession: async (focusScore?: number) => {
    const state = get()
    if (!state.currentSession) return

    try {
      const endTime = new Date()
      const duration = state.currentSessionDuration

      const result = await window.electron.ipcRenderer.invoke(
        'sessions:update',
        state.currentSession.id,
        {
          endTime: endTime.toISOString(),
          duration,
          focusScore
        }
      )

      if (result.success) {
        set({
          currentSession: null,
          currentSessionDuration: 0,
          sessions: [result.data, ...state.sessions]
        })
      }
    } catch (error) {
      console.error('Failed to end session:', error)
    }
  },

  fetchTodaySessions: async () => {
    set({ loading: true })
    try {
      const result = await window.electron.ipcRenderer.invoke('sessions:getToday', TEMP_USER_ID)
      if (result.success) {
        // s.duration is already in seconds, so just sum them directly
        const totalSeconds = result.data.reduce(
          (acc: number, s: StudySession) => acc + (s.duration || 0),
          0
        )
        set({ sessions: result.data, totalWorkTime: totalSeconds, loading: false })
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
      set({ loading: false })
    }
  },

  fetchWeeklySessions: async () => {
    set({ loading: true })
    try {
      const result = await window.electron.ipcRenderer.invoke('sessions:getWeek', TEMP_USER_ID)
      if (result.success) {
        set({ sessions: result.data, loading: false })
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
      set({ loading: false })
    }
  }
}))

// Auto-tick effect - call this in a component
export function useTimerTick(): void {
  const tickRef = useRef<(() => void) | null>(null)

  // Always get the latest tick function
  tickRef.current = useTimerStore.getState().tick

  useEffect(() => {
    const interval = setInterval(() => {
      // Use the ref to always call the current tick function
      // but avoid recreating the interval
      tickRef.current?.()
    }, 1000)
    return () => clearInterval(interval)
  }, []) // Empty dependency array - interval only created once
}
