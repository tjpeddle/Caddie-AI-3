import { GoogleGenAI, Chat } from "@google/genai";
import { CADDIE_SYSTEM_INSTRUCTION } from "../constants";
import { Message } from "../types";

class GeminiService {
  private ai: GoogleGenAI;
  private chat: Chat | null = null;

  constructor() {
    const apiKey = import.meta.env.VITE_API_KEY;
    if (!apiKey) throw new Error("API_KEY environment variable not set");
    this.ai = new GoogleGenAI({ apiKey });
  }

  public initializeChat(history: Message[] = []) {
    const genAIHistory = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));

    if (genAIHistory.length > 0 && genAIHistory[genAIHistory.length - 1].role === "user") {
      genAIHistory.pop();
    }

    this.chat = this.ai.chats.create({
      model: "gemini-2.5-flash",
      history: genAIHistory,
      config: { systemInstruction: CADDIE_SYSTEM_INSTRUCTION },
    });
  }

  public async sendMessage(message: Message): Promise<string> {
    if (!this.chat) throw new Error("Chat not initialized");
    const response = await this.chat.sendMessage({ message: message.content });
    return response.text;
  }
}

export const geminiService = new GeminiService();

