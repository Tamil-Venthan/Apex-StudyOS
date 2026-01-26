import { getDatabase } from '../db'
import { GeminiProvider } from './geminiProvider'
import { OpenRouterProvider } from './openRouterProvider'
import {
  AIProvider,
  AIProviderType,
  AISettings,
  StudyContext,
  AIResponse,
  QuickInsight
} from './aiTypes'

/**
 * Main AI Service
 * Manages AI providers and handles data aggregation from the database
 */
export class AIService {
  private providers: Map<AIProviderType, AIProvider> = new Map()
  private currentProvider: AIProvider | null = null


  constructor() {
    // Register available providers
    this.providers.set('gemini', new GeminiProvider())
    this.providers.set('openrouter', new OpenRouterProvider())
    // Future providers can be added here:
    // this.providers.set('openai', new OpenAIProvider())
    // this.providers.set('claude', new ClaudeProvider())
  }

  /**
   * Initialize the AI service with settings
   */
  async initialize(settings: AISettings): Promise<void> {
    if (!settings.enabled) {
      return
    }



    const provider = this.providers.get(settings.provider)
    if (!provider) {
      throw new Error(`Provider ${settings.provider} not found`)
    }

    // Get provider config based on selected provider
    let config
    switch (settings.provider) {
      case 'gemini':
        config = settings.gemini
        break
      case 'openrouter':
        config = settings.openrouter
        break
      case 'openai':
        config = settings.openai
        break
      case 'claude':
        config = settings.claude
        break
      default:
        throw new Error(`Unsupported provider: ${settings.provider}`)
    }

    if (!config || !config.apiKey) {
      throw new Error('Provider configuration not found')
    }

    await provider.initialize(config)
    this.currentProvider = provider
  }

  /**
   * Check if AI is configured and ready
   */
  isReady(): boolean {
    return this.currentProvider !== null && this.currentProvider.isConfigured()
  }

  /**
   * Aggregate study data from database
   */
  async getStudyContext(userId: string): Promise<StudyContext> {
    // Fetch subjects with topics
    const db = getDatabase()
    const subjects = await db
      .prepare(
        `
      SELECT id, name, color, targetDate
      FROM Subject
      WHERE userId = ?
      ORDER BY createdAt DESC
    `
      )
      .all(userId)

    const processedSubjects = subjects.map((subject: any) => {
      // Query modules for this subject
      const modules = db
        .prepare(
          `
        SELECT * FROM Module WHERE subjectId = ? ORDER BY "order" ASC
      `
        )
        .all(subject.id)

      let totalTopics = 0
      let completedTopics = 0
      let importantTopics = 0

      modules.forEach((module: any) => {
        const topics = db
          .prepare(
            `
          SELECT * FROM Topic WHERE moduleId = ? ORDER BY "order" ASC
        `
          )
          .all(module.id)

        totalTopics += topics.length
        completedTopics += topics.filter((t: any) => t.completed).length
        importantTopics += topics.filter((t: any) => t.isImportant).length
      })

      // Calculate days until exam
      let daysUntilExam: number | null = null
      if (subject.targetDate) {
        const targetDate = new Date(subject.targetDate)
        const now = new Date()
        const diff = targetDate.getTime() - now.getTime()
        daysUntilExam = Math.ceil(diff / (1000 * 60 * 60 * 24))
      }

      return {
        id: subject.id,
        name: subject.name,
        color: subject.color,
        totalTopics,
        completedTopics,
        importantTopics,
        completionRate: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
        targetDate: subject.targetDate ? new Date(subject.targetDate) : null,
        daysUntilExam,
        modules
      }
    })

    // Fetch courses
    const courses = await db
      .prepare(
        `
      SELECT id, name, totalClasses, attendedClasses, startDate, endDate
      FROM Course
      WHERE userId = ?
      ORDER BY createdAt DESC
    `
      )
      .all(userId)

    const processedCourses = courses.map((course: any) => {
      return {
        id: course.id,
        name: course.name,
        totalClasses: course.totalClasses || 0,
        attendedClasses: course.attendedClasses || 0,
        attendanceRate:
          course.totalClasses > 0
            ? Math.round((course.attendedClasses / course.totalClasses) * 100)
            : 0,
        startDate: course.startDate ? new Date(course.startDate) : null,
        endDate: course.endDate ? new Date(course.endDate) : null
      }
    })

    // Fetch study sessions
    const sessions = await db
      .prepare(
        `
      SELECT s.id, s.completedAt, s.duration, s.subjectId, sub.name as subjectName
      FROM StudySession s
      LEFT JOIN Subject sub ON s.subjectId = sub.id
      WHERE s.userId = ?
      ORDER BY s.completedAt DESC
      LIMIT 100
    `
      )
      .all(userId)

    // Calculate study statistics
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - 7)

    let totalFocusMinutes = 0
    let sessionsToday = 0
    let sessionsThisWeek = 0

    sessions.forEach((session: any) => {
      const sessionDate = new Date(session.completedAt)
      const durationMinutes = session.duration / 60

      totalFocusMinutes += durationMinutes

      if (sessionDate >= todayStart) {
        sessionsToday++
      }
      if (sessionDate >= weekStart) {
        sessionsThisWeek++
      }
    })

    const averageSessionDuration = sessions.length > 0 ? totalFocusMinutes / sessions.length : 0

    // Calculate streak
    const streak = this.calculateStreak(sessions)

    // Calculate productive hours
    const productiveHours = this.calculateProductiveHours(sessions)

    // Map recent sessions
    const recentSessions = sessions.slice(0, 20).map((s: any) => ({
      date: new Date(s.completedAt),
      duration: s.duration,
      subject: s.subjectName
    }))

    // Aggregate upcoming events and deadlines
    const upcomingEvents: any[] = []

    // Add exam dates from subjects
    processedSubjects.forEach((subject) => {
      if (subject.targetDate && subject.daysUntilExam && subject.daysUntilExam > 0) {
        upcomingEvents.push({
          title: `${subject.name} Exam`,
          date: subject.targetDate,
          type: 'exam',
          subjectName: subject.name,
          daysUntil: subject.daysUntilExam
        })
      }
    })

    // Add course end dates
    processedCourses.forEach((course) => {
      if (course.endDate) {
        const diff = course.endDate.getTime() - now.getTime()
        const daysUntil = Math.ceil(diff / (1000 * 60 * 60 * 24))
        if (daysUntil > 0 && daysUntil <= 60) {
          upcomingEvents.push({
            title: `${course.name} Course Ends`,
            date: course.endDate,
            type: 'deadline',
            subjectName: course.name,
            daysUntil
          })
        }
      }
    })

    // Sort by date and take next 10
    upcomingEvents.sort((a, b) => a.daysUntil - b.daysUntil)
    const nextEvents = upcomingEvents.slice(0, 10)

    return {
      subjects: processedSubjects,
      courses: processedCourses,
      studyStats: {
        totalFocusMinutes: Math.round(totalFocusMinutes),
        totalSessions: sessions.length,
        sessionsThisWeek,
        sessionsToday,
        currentStreak: streak,
        averageSessionDuration: Math.round(averageSessionDuration)
      },
      recentSessions,
      productiveHours,
      upcomingEvents: nextEvents.length > 0 ? nextEvents : undefined
    }
  }

  /**
   * Calculate study streak
   */
  private calculateStreak(sessions: any[]): number {
    if (sessions.length === 0) return 0

    const sortedSessions = [...sessions].sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    )

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const lastSessionDate = new Date(sortedSessions[0].completedAt)
    lastSessionDate.setHours(0, 0, 0, 0)

    // Streak broken if last session wasn't today or yesterday
    if (lastSessionDate < yesterday) return 0

    let streak = 0
    let currentDate = new Date(today)

    for (let i = 0; i < 365; i++) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const hasSession = sortedSessions.some((s) => {
        const sessionDate = new Date(s.completedAt)
        return sessionDate.toISOString().split('T')[0] === dateStr
      })

      if (hasSession) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }

    return streak
  }

  /**
   * Calculate productive hours
   */
  private calculateProductiveHours(sessions: any[]): Array<{ hour: number; sessionCount: number }> {
    const hourCounts: Record<number, number> = {}

    sessions.forEach((session: any) => {
      const hour = new Date(session.completedAt).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })

    return Object.entries(hourCounts)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        sessionCount: count
      }))
      .filter((item) => item.sessionCount > 0)
  }

  /**
   * Send a message to the AI
   */
  async sendMessage(
    userId: string,
    message: string,
    userName?: string,
    examName?: string,
    examDate?: string,
    responseLength?: 'short' | 'long'
  ): Promise<AIResponse> {
    if (!this.isReady()) {
      return {
        success: false,
        error: 'AI service not configured. Please set up your API key in settings.'
      }
    }

    try {
      const context = await this.getStudyContext(userId)
      return await this.currentProvider!.sendMessage(
        message,
        context,
        userName,
        examName,
        examDate,
        responseLength
      )
    } catch (error) {
      console.error('AI Service Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process request'
      }
    }
  }

  /**
   * Get quick insights for Analytics page
   */
  async getQuickInsights(userId: string): Promise<QuickInsight[]> {
    if (!this.isReady()) {
      return []
    }

    try {
      const context = await this.getStudyContext(userId)

      // Use Gemini provider's quick insights
      if (this.currentProvider instanceof GeminiProvider) {
        return await this.currentProvider.generateQuickInsights(context)
      }

      return []
    } catch (error) {
      console.error('Failed to generate insights:', error)
      return []
    }
  }
}

// Export singleton instance
export const aiService = new AIService()
