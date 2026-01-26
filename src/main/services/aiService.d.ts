import { AISettings, StudyContext, AIResponse, QuickInsight } from './aiTypes';
/**
 * Main AI Service
 * Manages AI providers and handles data aggregation from the database
 */
export declare class AIService {
    private providers;
    private currentProvider;
    private settings;
    constructor();
    /**
     * Initialize the AI service with settings
     */
    initialize(settings: AISettings): Promise<void>;
    /**
     * Check if AI is configured and ready
     */
    isReady(): boolean;
    /**
     * Aggregate study data from database
     */
    getStudyContext(userId: string): Promise<StudyContext>;
    /**
     * Calculate study streak
     */
    private calculateStreak;
    /**
     * Calculate productive hours
     */
    private calculateProductiveHours;
    /**
     * Send a message to the AI
     */
    sendMessage(userId: string, message: string, userName?: string, examName?: string, examDate?: string, responseLength?: 'short' | 'long'): Promise<AIResponse>;
    /**
     * Get quick insights for Analytics page
     */
    getQuickInsights(userId: string): Promise<QuickInsight[]>;
}
export declare const aiService: AIService;
