import { AIProvider, AIProviderConfig, AIResponse, StudyContext } from './aiTypes';
/**
 * OpenRouter AI Provider Implementation
 * Uses OpenRouter API to access various LLMs (Claude, GPT, Llama, etc.)
 */
export declare class OpenRouterProvider implements AIProvider {
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
     * Send a message to OpenRouter API
     */
    sendMessage(message: string, context: StudyContext, userName?: string, examName?: string, examDate?: string, responseLength?: 'short' | 'long'): Promise<AIResponse>;
}
