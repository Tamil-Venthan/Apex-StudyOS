import { AIProvider, AIProviderConfig, AIResponse, StudyContext, QuickInsight } from './aiTypes';
/**
 * Gemini AI Provider Implementation
 * Uses Google's Gemini API for generating study insights and recommendations
 */
export declare class GeminiProvider implements AIProvider {
    name: string;
    private apiKey;
    private model;
    private apiUrl;
    initialize(config: AIProviderConfig): Promise<void>;
    isConfigured(): boolean;
    /**
     * Build a comprehensive prompt with study context
     */
    private buildPrompt;
    /**
     * Format study context into readable text for the AI
     */
    private formatStudyContext;
    /**
     * Send a message to Gemini API
     */
    sendMessage(message: string, context: StudyContext, userName?: string, examName?: string, examDate?: string, responseLength?: 'short' | 'long'): Promise<AIResponse>;
    /**
     * Generate quick insights for Analytics page
     */
    generateQuickInsights(context: StudyContext): Promise<QuickInsight[]>;
}
