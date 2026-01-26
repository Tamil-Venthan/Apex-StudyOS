// Type definitions for AI service
export type AIProviderType = 'gemini' | 'openai' | 'claude' | 'local' | 'openrouter'

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface AIResponse {
  success: boolean
  message?: string
  error?: string
}

export interface StudyContext {
  // Subject and topic data
  subjects: Array<{
    id: string
    name: string
    color: string
    totalTopics: number
    completedTopics: number
    importantTopics: number
    completionRate: number
    targetDate?: Date | null
    daysUntilExam?: number | null
    modules?: any[]
  }>

  // Course and attendance data
  courses: Array<{
    id: string
    name: string
    totalClasses: number
    attendedClasses: number
    attendanceRate: number
    startDate?: Date | null
    endDate?: Date | null
  }>

  // Study session statistics
  studyStats: {
    totalFocusMinutes: number
    totalSessions: number
    sessionsThisWeek: number
    sessionsToday: number
    currentStreak: number
    averageSessionDuration: number
  }

  // Recent sessions
  recentSessions: Array<{
    date: Date
    duration: number
    subject?: string
  }>

  // Study patterns
  productiveHours: Array<{
    hour: number
    sessionCount: number
  }>

  // Upcoming events and deadlines
  upcomingEvents?: Array<{
    title: string
    date: Date
    type: 'exam' | 'assignment' | 'class' | 'deadline'
    subjectName?: string
    daysUntil: number
  }>

  // User goals (if available)
  goals?: {
    targetHoursPerDay?: number
    examDate?: Date
    targetCompletionDate?: Date
  }
}

export interface AIProviderConfig {
  apiKey: string
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface AISettings {
  provider: AIProviderType
  gemini?: AIProviderConfig
  openai?: AIProviderConfig
  claude?: AIProviderConfig
  openrouter?: AIProviderConfig
  enabled: boolean
}

// Abstract provider interface
export interface AIProvider {
  name: string
  initialize(config: AIProviderConfig): Promise<void>
  sendMessage(
    message: string,
    context: StudyContext,
    userName?: string,
    examName?: string,
    examDate?: string,
    responseLength?: 'short' | 'long'
  ): Promise<AIResponse>
  isConfigured(): boolean
}

export interface QuickInsight {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  icon: string
}
