import { GoogleGenAI } from "@google/genai";

// Safe access to process.env for browser environments
const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) || ''; 

const ai = new GoogleGenAI({ apiKey });

export const geminiService = {
  /**
   * Refines raw user text into professional feedback using the SBI (Situation-Behavior-Impact) model.
   */
  refineFeedback: async (rawText: string, type: string): Promise<string> => {
    if (!apiKey) return "API Key missing. Cannot generate AI response.";

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a corporate communications expert. Rewrite the following ${type} feedback to be constructive, professional, and actionable. 
        Use the Situation-Behavior-Impact (SBI) model if appropriate. Keep the tone helpful but objective.
        
        Raw Feedback: "${rawText}"
        
        Refined Feedback:`,
      });
      return response.text || rawText;
    } catch (error) {
      console.error("Gemini API Error:", error);
      return rawText; // Fallback to original text
    }
  },

  /**
   * Analyzes the sentiment and key themes of a piece of feedback for Admins.
   */
  analyzeFeedback: async (text: string): Promise<string> => {
    if (!apiKey) return "API Key missing.";

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
  }
};