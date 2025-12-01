import { GoogleGenAI } from "@google/genai";
import { GameState, Player, Suit } from "../types";

// Initialize Gemini Client
// In a real app, strict error handling for missing API key should be here.
// We assume process.env.API_KEY is available as per instructions.
const ai = new GoogleGenAI({ apiKey: "AIzaSyCrt5W_7_b8rRRaRZ3FpcQG2k39S2FRdUU" });

const MODEL_NAME = 'gemini-2.0-flash-lite';

export const generateRoundNarrative = async (
  round: number,
  winningSuit: Suit,
  eliminatedCount: number,
  survivors: number
): Promise<string> => {
  try {
    const prompt = `
      You are the cold, omniscient Game Master of "The Jack", a game of deception and death.
      
      Status Report:
      - Round ${round} complete.
      - ${eliminatedCount} players guessed incorrectly and were executed.
      - ${survivors} remain.
      
      Describe the aftermath. Focus on the paranoia. Do not mention specific suits. One cryptic sentence.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "The trust has been broken. Only the liars remain.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The system reboots... the Jack is still watching.";
  }
};

export const generateGameIntro = async (): Promise<string> => {
    try {
        const prompt = "Generate a terrifying welcome message for 'The Jack'. Remind them that one player is a traitor. One sentence.";
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
        });
        return response.text || "Look at your neighbor; one of you is the Jack, and they will kill you all.";
    } catch (error) {
        return "The game begins. Trust no one.";
    }
}