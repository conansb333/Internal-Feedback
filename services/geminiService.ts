
import { GoogleGenAI } from "@google/genai";

// Initialize lazily to prevent runtime crashes if process is undefined in browser
const getAiClient = () => {
  try {
    // Safety check for process.env
    // @ts-ignore
    const apiKey = typeof process !== "undefined" && process.env ? process.env.API_KEY : undefined;
    
    if (!apiKey) {
      console.warn("Gemini API Key is missing.");
      return null;
    }
    return new GoogleGenAI({ apiKey });
  } catch (e) {
    console.error("Failed to initialize Gemini Client:", e);
    return null;
  }
};

export const geminiService = {
  /**
   * Analyzes the sentiment and key themes of a piece of feedback for Admins.
   */
  analyzeFeedback: async (text: string): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "AI Service Unavailable (Config Error).";

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
    if (!ai) return "AI Service Unavailable (Config Error).";
    
    if (feedbacks.length === 0) return "No data available to analyze.";

    // Limit context to prevent token overflow, take last 20 descriptions
    const context = feedbacks
        .slice(0, 20)
        .map(f => `- Type: ${f.processType}, Description: ${f.faultDescription}`)
        .join('\n');

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
  }
};
