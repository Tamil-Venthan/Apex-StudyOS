/**
 * Gemini AI Provider Implementation
 * Uses Google's Gemini API for generating study insights and recommendations
 */
export class GeminiProvider {
    name = 'gemini';
    apiKey = '';
    model = 'gemini-2.0-flash-exp';
    apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/';
    async initialize(config) {
        this.apiKey = config.apiKey;
        if (config.model) {
            this.model = config.model;
        }
    }
    isConfigured() {
        return this.apiKey.length > 0;
    }
    /**
     * Build a comprehensive prompt with study context
     */
    buildPrompt(userMessage, context, userName, examName, examDate, responseLength) {
        const contextStr = this.formatStudyContext(context);
        // Calculate days until exam if provided
        let examInfo = '';
        if (examName) {
            examInfo = `\n# Target Exam:\n**${examName}**`;
            if (examDate) {
                const daysUntil = Math.ceil((new Date(examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                examInfo += ` - **${daysUntil} days remaining**`;
            }
            examInfo += '\n';
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
- Provide actionable next steps with clear explanations`;
        const greeting = userName ? `Hello ${userName}! ` : '';
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

${greeting}Respond with ${responseLength === 'long' ? 'detailed, thorough' : 'concise, focused'} analysis and recommendations:`;
    }
    /**
     * Format study context into readable text for the AI
     */
    formatStudyContext(context) {
        let contextStr = '';
        // Subject completion summary
        if (context.subjects.length > 0) {
            contextStr += '## Subjects Overview:\n';
            context.subjects.forEach((subject) => {
                contextStr += `- **${subject.name}**: ${subject.completionRate}% complete (${subject.completedTopics}/${subject.totalTopics} topics)\n`;
                if (subject.importantTopics > 0) {
                    contextStr += `  - ${subject.importantTopics} important topics marked\n`;
                }
                if (subject.daysUntilExam !== null && subject.daysUntilExam !== undefined) {
                    if (subject.daysUntilExam > 0) {
                        contextStr += `  - 📅 Exam in ${subject.daysUntilExam} days!\n`;
                    }
                    else if (subject.daysUntilExam === 0) {
                        contextStr += `  - ⚠️ Exam TODAY!\n`;
                    }
                }
            });
            contextStr += '\n';
        }
        // Course attendance summary
        if (context.courses.length > 0) {
            contextStr += '## Course Attendance:\n';
            context.courses.forEach((course) => {
                contextStr += `- **${course.name}**: ${course.attendanceRate}% (${course.attendedClasses}/${course.totalClasses} classes)\n`;
            });
            contextStr += '\n';
        }
        // Upcoming events and deadlines
        if (context.upcomingEvents && context.upcomingEvents.length > 0) {
            contextStr += '## Upcoming Events & Deadlines:\n';
            context.upcomingEvents.slice(0, 5).forEach((event) => {
                const emoji = event.type === 'exam' ? '📝' : event.type === 'deadline' ? '⏰' : '📅';
                contextStr += `- ${emoji} **${event.title}** in ${event.daysUntil} days\n`;
            });
            contextStr += '\n';
        }
        // Study statistics
        contextStr += '## Study Statistics:\n';
        contextStr += `- Total Focus Time: ${Math.floor(context.studyStats.totalFocusMinutes / 60)}h ${context.studyStats.totalFocusMinutes % 60}m\n`;
        contextStr += `- Total Sessions: ${context.studyStats.totalSessions}\n`;
        contextStr += `- Sessions This Week: ${context.studyStats.sessionsThisWeek}\n`;
        contextStr += `- Sessions Today: ${context.studyStats.sessionsToday}\n`;
        contextStr += `- Current Streak: ${context.studyStats.currentStreak} days\n`;
        contextStr += `- Avg Session: ${Math.floor(context.studyStats.averageSessionDuration / 60)} minutes\n\n`;
        // Productive hours
        if (context.productiveHours.length > 0) {
            const topHours = context.productiveHours
                .sort((a, b) => b.sessionCount - a.sessionCount)
                .slice(0, 3);
            contextStr += '## Most Productive Hours:\n';
            topHours.forEach((h) => {
                contextStr += `- ${h.hour}:00 - ${h.sessionCount} sessions\n`;
            });
            contextStr += '\n';
        }
        return contextStr;
    }
    /**
     * Send a message to Gemini API
     */
    async sendMessage(message, context, userName, examName, examDate, responseLength) {
        if (!this.isConfigured()) {
            return {
                success: false,
                error: 'Gemini API key not configured. Please add your API key in settings.'
            };
        }
        try {
            const prompt = this.buildPrompt(message, context, userName, examName, examDate, responseLength);
            // Adjust token limits based on response length
            const maxTokens = responseLength === 'short' ? 1024 : 4096;
            const response = await fetch(`${this.apiUrl}${this.model}:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: maxTokens,
                        topP: 0.95,
                        topK: 40
                    }
                })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'API request failed');
            }
            const data = await response.json();
            if (!data.candidates || data.candidates.length === 0) {
                throw new Error('No response generated');
            }
            const aiMessage = data.candidates[0].content.parts[0].text;
            return {
                success: true,
                message: aiMessage
            };
        }
        catch (error) {
            console.error('Gemini API Error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get AI response'
            };
        }
    }
    /**
     * Generate quick insights for Analytics page
     */
    async generateQuickInsights(context) {
        const insights = [];
        // Find subjects with low completion rates
        const lowCompletionSubjects = context.subjects
            .filter((s) => s.completionRate < 50 && s.totalTopics > 0)
            .sort((a, b) => a.completionRate - b.completionRate);
        if (lowCompletionSubjects.length > 0) {
            const subject = lowCompletionSubjects[0];
            insights.push({
                title: `Focus on ${subject.name}`,
                description: `Only ${subject.completionRate}% complete with ${subject.totalTopics - subject.completedTopics} topics remaining`,
                priority: 'high',
                icon: '🎯'
            });
        }
        // Check course attendance
        const lowAttendanceCourses = context.courses.filter((c) => c.attendanceRate < 75);
        if (lowAttendanceCourses.length > 0) {
            const course = lowAttendanceCourses[0];
            const missed = course.totalClasses - course.attendedClasses;
            insights.push({
                title: `Attendance Alert: ${course.name}`,
                description: `${missed} classes pending. Current attendance: ${course.attendanceRate}%`,
                priority: 'high',
                icon: '⚠️'
            });
        }
        // Check study streak
        if (context.studyStats.currentStreak >= 7) {
            insights.push({
                title: `${context.studyStats.currentStreak} Day Streak! 🔥`,
                description: `Amazing consistency! Keep up the great work.`,
                priority: 'low',
                icon: '🔥'
            });
        }
        else if (context.studyStats.currentStreak === 0 && context.studyStats.totalSessions > 0) {
            insights.push({
                title: 'Streak Broken',
                description: "Don't worry! Start a new session today to rebuild your streak.",
                priority: 'medium',
                icon: '💪'
            });
        }
        // Important topics pending
        const importantPending = context.subjects.reduce((sum, s) => {
            if (s.modules) {
                return (sum +
                    s.modules.reduce((acc, m) => {
                        return acc + m.topics.filter((t) => t.isImportant && !t.completed).length;
                    }, 0));
            }
            return sum;
        }, 0);
        if (importantPending > 0) {
            insights.push({
                title: `${importantPending} Important Topics Pending`,
                description: 'Review topics marked as important for maximum impact',
                priority: 'high',
                icon: '⭐'
            });
        }
        return insights.slice(0, 3); // Return top 3 insights
    }
}
