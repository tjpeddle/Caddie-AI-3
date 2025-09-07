
import { GoogleGenAI, Chat } from "@google/genai";
import { CADDIE_SYSTEM_INSTRUCTION } from '../constants';
import { Message } from "../types";

class GeminiService {
  private ai: GoogleGenAI;
  private chat: Chat | null = null;

  constructor() {
    // Fix: Sourced API key from process.env.API_KEY to align with coding guidelines and fix TypeScript error.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API_KEY environment variable not set");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  public initializeChat(history: Message[] = []) {
    // Map the app's message format to the format required by the Google GenAI SDK
    const genAIHistory = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));

    // The last message in the history is the user's, but the SDK's history
    // should end with the model's last response. We remove the last user message
    // as it will be the one we are about to send to get a new response.
    // This only matters when restoring a session.
    if (genAIHistory.length > 0 && genAIHistory[genAIHistory.length - 1].role === 'user') {
      genAIHistory.pop();
    }

    this.chat = this.ai.chats.create({
        model: 'gemini-2.5-flash',
        history: genAIHistory,
        config: {
            systemInstruction: CADDIE_SYSTEM_INSTRUCTION,
        },
    });
  }

  public async sendMessage(message: string): Promise<string> {
    if (!this.chat) {
        throw new Error("Chat not initialized. Please call initializeChat first.");
    }
    try {
      const response = await this.chat.sendMessage({ message });
      return response.text;
    } catch (error) {
      console.error("Error sending message to Gemini:", error);
      throw new Error("Failed to get a response from the AI Caddie.");
    }
  }
}

export const geminiService = new GeminiService();