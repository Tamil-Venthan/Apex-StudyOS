import { AIProvider, AIProviderConfig, AIResponse, StudyContext } from './aiTypes'

/**
 * OpenRouter AI Provider Implementation
 * Uses OpenRouter API to access various LLMs (Claude, GPT, Llama, etc.)
 */
export class OpenRouterProvider implements AIProvider {
    name = 'openrouter'
    private apiKey: string = ''
    private model: string = 'meta-llama/llama-3.3-70b-instruct:free' // Default free model
    private apiUrl = 'https://openrouter.ai/api/v1/chat/completions'

    async initialize(config: AIProviderConfig): Promise<void> {
        this.apiKey = config.apiKey
        if (config.model) {
            this.model = config.model
        }
    }

    isConfigured(): boolean {
        return this.apiKey.length > 0
    }

    /**
     * Build a comprehensive prompt with study context
     */
    private buildPrompt(
        userMessage: string,
        context: StudyContext,
        userName?: string,
        examName?: string,
        examDate?: string,
        responseLength?: 'short' | 'long'
    ): string {
        // Reusing the same prompt building logic as GeminiProvider for consistency
        // We can potentially extract this to a shared utility if it grows
        const contextStr = this.formatStudyContext(context)

        // Calculate days until exam if provided
        let examInfo = ''
        if (examName) {
            examInfo = `\n# Target Exam:\n**${examName}**`
            if (examDate) {
                const daysUntil = Math.ceil(
                    (new Date(examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                )
                examInfo += ` - **${daysUntil} days remaining**`
            }
            examInfo += '\n'
        }

        const responseInstructions = responseLength === 'short'
            ? `# Instructions:
- Provide concise, focused insights based on the data
- Be encouraging but keep it brief
- Prioritize the most important 2-3 points
- Give direct, actionable recommendations
- Keep explanations short and to the point`
            : `# Instructions:
- Provide comprehensive, detailed insights based on the data above
- Be encouraging and motivating with thorough explanations
- Prioritize important topics and subjects with low completion rates
- Give detailed recommendations with reasoning and context
- Suggest specific study plans with time allocations and strategies
- Explain patterns in productivity and how to leverage them
- Provide actionable next steps with clear explanations`

        const greeting = userName ? `Hello ${userName}! ` : ''

        return `You are an intelligent Study Coach AI assistant for a study tracking application called "Apex StudyOS". 
You help students (primarily CMA/CA exam preparation) analyze their study patterns and provide personalized recommendations.
${examInfo}
# Current Study Data:
${contextStr}

# User Query:
${userMessage}

${responseInstructions}

# Formatting Guidelines:
- Use ## for main section headings
- Use ### for subsections when needed
- Use bullet points (-) for lists
- Use **bold** for emphasis on key subjects and numbers
- Add blank lines between sections for clarity
${responseLength === 'long' ? '- Use numbered lists for step-by-step action plans\n- Explain WHY behind recommendations, not just WHAT to do' : '- Keep lists short and focused'}

${greeting}Respond with ${responseLength === 'long' ? 'detailed, thorough' : 'concise, focused'} analysis and recommendations:`
    }

    /**
     * Format study context into readable text for the AI
     */
    private formatStudyContext(context: StudyContext): string {
        let contextStr = ''

        // Subject completion summary
        if (context.subjects.length > 0) {
            contextStr += '## Subjects Overview:\n'
            context.subjects.forEach((subject) => {
                contextStr += `- **${subject.name}**: ${subject.completionRate}% complete (${subject.completedTopics}/${subject.totalTopics} topics)\n`
                if (subject.importantTopics > 0) {
                    contextStr += `  - ${subject.importantTopics} important topics marked\n`
                }
                if (subject.daysUntilExam !== null && subject.daysUntilExam !== undefined) {
                    if (subject.daysUntilExam > 0) {
                        contextStr += `  - 📅 Exam in ${subject.daysUntilExam} days!\n`
                    } else if (subject.daysUntilExam === 0) {
                        contextStr += `  - ⚠️ Exam TODAY!\n`
                    }
                }
            })
            contextStr += '\n'
        }

        // Course attendance summary
        if (context.courses.length > 0) {
            contextStr += '## Course Attendance:\n'
            context.courses.forEach((course) => {
                contextStr += `- **${course.name}**: ${course.attendanceRate}% (${course.attendedClasses}/${course.totalClasses} classes)\n`
            })
            contextStr += '\n'
        }

        // Upcoming events and deadlines
        if (context.upcomingEvents && context.upcomingEvents.length > 0) {
            contextStr += '## Upcoming Events & Deadlines:\n'
            context.upcomingEvents.slice(0, 5).forEach((event) => {
                const emoji = event.type === 'exam' ? '📝' : event.type === 'deadline' ? '⏰' : '📅'
                contextStr += `- ${emoji} **${event.title}** in ${event.daysUntil} days\n`
            })
            contextStr += '\n'
        }

        // Study statistics
        contextStr += '## Study Statistics:\n'
        contextStr += `- Total Focus Time: ${Math.floor(context.studyStats.totalFocusMinutes / 60)}h ${context.studyStats.totalFocusMinutes % 60}m\n`
        contextStr += `- Total Sessions: ${context.studyStats.totalSessions}\n`
        contextStr += `- Sessions This Week: ${context.studyStats.sessionsThisWeek}\n`
        contextStr += `- Sessions Today: ${context.studyStats.sessionsToday}\n`
        contextStr += `- Current Streak: ${context.studyStats.currentStreak} days\n`
        contextStr += `- Avg Session: ${Math.floor(context.studyStats.averageSessionDuration / 60)} minutes\n\n`

        // Productive hours
        if (context.productiveHours.length > 0) {
            const topHours = context.productiveHours
                .sort((a, b) => b.sessionCount - a.sessionCount)
                .slice(0, 3)
            contextStr += '## Most Productive Hours:\n'
            topHours.forEach((h) => {
                contextStr += `- ${h.hour}:00 - ${h.sessionCount} sessions\n`
            })
            contextStr += '\n'
        }

        return contextStr
    }

    /**
     * Send a message to OpenRouter API
     */
    async sendMessage(
        message: string,
        context: StudyContext,
        userName?: string,
        examName?: string,
        examDate?: string,
        responseLength?: 'short' | 'long'
    ): Promise<AIResponse> {
        if (!this.isConfigured()) {
            return {
                success: false,
                error: 'OpenRouter API key not configured. Please add your API key in settings.'
            }
        }

        try {
            const prompt = this.buildPrompt(message, context, userName, examName, examDate, responseLength)

            // Adjust token limits based on response length
            const maxTokens = responseLength === 'short' ? 1024 : 4096

            const response = await fetch(
                this.apiUrl,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'HTTP-Referer': 'https://apex-studyos.app', // Required by OpenRouter
                        'X-Title': 'Apex StudyOS', // Required by OpenRouter
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: this.model,
                        messages: [
                            {
                                role: 'user',
                                content: prompt
                            }
                        ],
                        temperature: 0.7,
                        max_tokens: maxTokens,
                        top_p: 0.95
                    })
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error?.message || 'API request failed')
            }

            const data = await response.json()

            if (!data.choices || data.choices.length === 0) {
                throw new Error('No response generated')
            }

            const aiMessage = data.choices[0].message.content

            return {
                success: true,
                message: aiMessage
            }
        } catch (error) {
            console.error('OpenRouter API Error:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get AI response'
            }
        }
    }
}
