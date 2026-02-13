import { create } from 'zustand'

export interface StudySession {
  id: string
  userId: string
  subjectId: string | null
  duration: number
  type: string
  completedAt: Date
  subject?: {
    id: string
    name: string
    color: string
  }
}

interface SessionStats {
  totalFocusMinutes: number
  totalSessions: number
  sessionsToday: number
  sessionsThisWeek: number
}

interface WeeklyData {
  day: string
  hours: number
  date: Date
}

interface SubjectData {
  name: string
  color: string
  minutes: number
  percentage: number
}

interface AnalyticsStore {
  stats: SessionStats | null
  sessions: StudySession[]
  loading: boolean
  error: string | null

  // Actions
  fetchStats: (userId: string) => Promise<void>
  fetchSessions: (userId: string, days?: number) => Promise<void>
  calculateStreak: () => number
  getWeeklyData: () => WeeklyData[]
  getSubjectBreakdown: () => SubjectData[]
}

export const useAnalyticsStore = create<AnalyticsStore>((set, get) => ({
  stats: null,
  sessions: [],
  loading: false,
  error: null,

  fetchStats: async (userId: string) => {
    set({ loading: true, error: null })
    try {
      const result = await window.electron.ipcRenderer.invoke('timer:getSessionStats', userId)
      if (result.success) {
        set({ stats: result.data, loading: false })
      } else {
        set({ error: result.error, loading: false })
      }
    } catch {
      set({ error: 'Failed to fetch stats', loading: false })
    }
  },

  fetchSessions: async (userId: string, days: number = 30) => {
    set({ loading: true, error: null })
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const result = await window.electron.ipcRenderer.invoke('timer:getSessions', {
        userId,
        startDate: startDate.toISOString(),
        type: 'focus' // Only fetch focus sessions for analytics
      })

      if (result.success) {
        // Convert date strings to Date objects - map endTime from DB to completedAt for frontend
        const sessions = result.data.map(
          (
            session: StudySession & {
              endTime?: string
              subjectName?: string
              subjectColor?: string
            }
          ) => ({
            ...session,
            completedAt: new Date(session.endTime || session.completedAt),
            subject: session.subjectName
              ? {
                  id: session.subjectId || '',
                  name: session.subjectName,
                  color: session.subjectColor || '#3B82F6'
                }
              : undefined
          })
        )
        set({ sessions, loading: false })
      } else {
        set({ error: result.error, loading: false })
      }
    } catch {
      set({ error: 'Failed to fetch sessions', loading: false })
    }
  },

  calculateStreak: () => {
    const { sessions } = get()
    if (sessions.length === 0) return 0

    // Sort sessions by date (most recent first)
    const sortedSessions = [...sessions].sort(
      (a, b) => b.completedAt.getTime() - a.completedAt.getTime()
    )

    // Get unique dates (ignore time)
    const uniqueDates = new Set(
      sortedSessions.map((s) => s.completedAt.toISOString().split('T')[0])
    )

    const dateArray = Array.from(uniqueDates).sort().reverse()
    const today = new Date().toISOString().split('T')[0]

    // Check if there's a session today or yesterday
    if (dateArray[0] !== today && dateArray[0] !== getPreviousDate(today)) {
      return 0 // Streak broken
    }

    let streak = 0
    let currentDate = dateArray[0]

    for (let i = 0; i < dateArray.length; i++) {
      if (dateArray[i] === currentDate) {
        streak++
        currentDate = getPreviousDate(currentDate)
      } else {
        break
      }
    }

    return streak
  },

  getWeeklyData: () => {
    const { sessions } = get()
    const weekData: WeeklyData[] = []

    // Generate last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
      // Use local date string for comparison to avoid timezone issues
      const localDateStr = date.toLocaleDateString('en-CA') // YYYY-MM-DD in local time

      // Sum all sessions for this day
      const dayMinutes = sessions
        .filter((s) => s.completedAt.toLocaleDateString('en-CA') === localDateStr)
        .reduce((sum, s) => sum + s.duration, 0)

      weekData.push({
        day: dayName,
        hours: dayMinutes / 3600, // Convert seconds to hours
        date
      })
    }

    return weekData
  },

  getSubjectBreakdown: () => {
    const { sessions } = get()

    // Group sessions by subject
    const subjectMap = new Map<string, { name: string; color: string; minutes: number }>()

    sessions.forEach((session) => {
      if (session.subject) {
        const key = session.subject.id
        const existing = subjectMap.get(key)

        if (existing) {
          existing.minutes += session.duration / 60
        } else {
          subjectMap.set(key, {
            name: session.subject.name,
            color: session.subject.color,
            minutes: session.duration / 60
          })
        }
      }
    })

    // Calculate percentages
    const totalMinutes = Array.from(subjectMap.values()).reduce(
      (sum, subject) => sum + subject.minutes,
      0
    )

    return Array.from(subjectMap.values())
      .map((subject) => ({
        ...subject,
        percentage: totalMinutes > 0 ? (subject.minutes / totalMinutes) * 100 : 0
      }))
      .sort((a, b) => b.minutes - a.minutes)
  }
}))

// Helper function to get previous date string
function getPreviousDate(dateStr: string): string {
  const date = new Date(dateStr)
  date.setDate(date.getDate() - 1)
  return date.toISOString().split('T')[0]
}
