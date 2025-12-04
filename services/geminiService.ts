import { GoogleGenAI } from "@google/genai";
import { DocumentData, DealRoadmap, TaskMap } from "../types";

// Initialize the client
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

interface ChatResponse {
  text: string;
  evidence: DocumentData[];
}

interface AIContextData {
  roadmap: { deals: DealRoadmap[] };
  taskStatus: TaskMap;
  documents: DocumentData[];
}

/**
 * RAG function using dynamic context data.
 */
export const queryTransactionAI = async (userQuery: string, context: AIContextData): Promise<ChatResponse> => {
  try {
    const { documents, taskStatus, roadmap } = context;

    // 1. Retrieval Step (Keyword matching)
    const lowerQuery = userQuery.toLowerCase();
    
    // Filter Documents
    const relevantDocs = documents.filter(doc => 
      doc.filename.toLowerCase().includes(lowerQuery) || 
      (doc.deal && doc.deal.toLowerCase().includes(lowerQuery)) ||
      doc.text_snippet.toLowerCase().includes(lowerQuery) ||
      doc.summary.toLowerCase().includes(lowerQuery)
    ).slice(0, 5); // Increased to top 5

    // Retrieve Task Context
    const relevantTasks = Object.entries(taskStatus)
        .filter(([key]) => key.toLowerCase().includes(lowerQuery))
        .map(([key, val]) => `${key}: ${val.status} (${val.notes})`)
        .slice(0, 8);

    // 2. Construct Prompt
    const contextString = `
      RELEVANT DOCUMENTS FOUND:
      ${relevantDocs.map(d => `- File: ${d.filename}\n  Summary: ${d.summary}\n  Snippet: ${d.text_snippet}`).join('\n')}

      RELEVANT TASKS FOUND:
      ${relevantTasks.join('\n')}

      ALL DEALS OVERVIEW:
      ${JSON.stringify(roadmap.deals)}
    `;

    const systemInstruction = `
      You are LINKS Transaction AI, the internal acquisitions assistant for Links Car Wash.
      Brand Tone: Confident, Helpful, Efficient, Clear.
      Brand Colors (Mental Context): Dark Evergreen, Links Green, Gold.
      
      Your Goal: Answer the user's question about the deal pipeline using ONLY the provided context.
      
      Rules:
      - If the answer is not in the context, say "Not in the current dataset."
      - Be direct. No fluff.
      - Structure answers cleanly (bullets, short paragraphs).
      - Do not give legal advice.
      - When citing documents, mention the filename.
    `;

    const fullPrompt = `
      Context Data:
      ${contextString}

      User Question: "${userQuery}"

      Answer:
    `;

    // 3. Call Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2, // Low temperature for factual accuracy
      }
    });

    return {
      text: response.text || "I couldn't generate a response based on the data.",
      evidence: relevantDocs
    };

  } catch (error) {
    console.error("AI Service Error:", error);
    return {
      text: "I encountered an error processing your request. Please check your network or API key.",
      evidence: []
    };
  }
};