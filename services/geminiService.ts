
import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
};

export const geminiService = {
  /**
   * Analyzes the sentiment and key themes of a piece of feedback for Admins.
   */
  analyzeFeedback: async (text: string): Promise<string> => {
    const ai = getAiClient();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze the following feedback report. Provide a very brief summary (1-2 sentences) of the core issue or praise, and tag the sentiment (Positive, Neutral, Negative).
        
        Feedback: "${text}"
        
        Analysis:`,
      });
      return response.text || "Analysis failed.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Could not analyze.";
    }
  },

  /**
   * Generates a "Root Cause" summary for a list of feedback items.
   */
  generateAnalyticsInsight: async (feedbacks: any[]): Promise<string> => {
    const ai = getAiClient();
    if (feedbacks.length === 0) return "No data available to analyze.";

    const context = feedbacks
        .slice(0, 20)
        .map(f => `- Type: ${f.processType}, Description: ${f.faultDescription}`)
        .join('\n');

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are an operations analyst. Read the following recent feedback reports and provide a "Manager Executive Summary".
        
        1. Identify the ONE main root cause trend (e.g. "Confusion with new return portal").
        2. Suggest ONE specific action for the manager (e.g. "Update the training guide on Refund vs Exchange").
        
        Keep it under 60 words. Be direct.
        
        Reports:
        ${context}
        
        Insight:`,
      });
      return response.text || "Could not generate insight.";
    } catch (error) {
        console.error("Gemini Insight Error", error);
        return "AI Service Unavailable.";
    }
  },

  /**
   * Provides real-time coaching on feedback drafts to ensure they are constructive.
   */
  coachFeedback: async (text: string): Promise<string> => {
    const ai = getAiClient();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a helpful HR coaching assistant. Review this draft feedback for a colleague.
        
        Draft: "${text}"
        
        Task:
        1. Rate the tone (Constructive, Neutral, Aggressive, or Vague).
        2. If Aggressive or Vague, suggest a specific, professional rewrite.
        3. If Constructive, just say "Looks good!".
        
        Keep it short (max 2 sentences).`,
      });
      return response.text || "No feedback generated.";
    } catch (error) {
      return "Unable to provide coaching right now.";
    }
  }
};
