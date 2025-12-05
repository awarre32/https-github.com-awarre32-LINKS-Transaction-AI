import { GoogleGenAI } from "@google/genai";
import { DocumentData, DealRoadmap, TaskMap, ChecklistItem, MondayItem, DepartmentView } from "../types";

// Initialize the client
// accessing via import.meta.env for Vite compatibility
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

interface ChatResponse {
  text: string;
  evidence: DocumentData[];
}

interface AIContextData {
  roadmap: { deals: DealRoadmap[] };
  taskStatus: TaskMap;
  documents: DocumentData[];
  checklist: ChecklistItem[];
  monday: MondayItem[];
  currentDealFilter?: string | 'All';
  currentDeptView?: DepartmentView;
}

/**
 * RAG function using dynamic context data across all 5 datasets.
 */
export const queryTransactionAI = async (userQuery: string, context: AIContextData): Promise<ChatResponse> => {
  try {
    if (!apiKey) {
      return {
        text: "Configuration Error: VITE_GEMINI_API_KEY is missing. Please check your environment variables.",
        evidence: []
      };
    }

    const { documents, taskStatus, roadmap, checklist, monday, currentDealFilter = 'All', currentDeptView = 'All' } = context;

    // 1. Retrieval Step (Keyword matching)
    const lowerQuery = userQuery.toLowerCase();
    const queryTerms = lowerQuery.split(' ').filter(term => term.length > 3); // Simple term extraction

    // A. Filter Documents (VDR)
    const docScore = (doc: DocumentData) => {
      const docStr = `${doc.filename} ${doc.deal || ''} ${doc.summary} ${doc.text_snippet}`.toLowerCase();
      let score = 0;
      if (currentDealFilter !== 'All' && doc.deal === currentDealFilter) score += 5;
      queryTerms.forEach(term => { if (docStr.includes(term)) score += 1; });
      if (docStr.includes(lowerQuery)) score += 3;
      return score;
    };
    const relevantDocs = documents
      .map(d => ({ d, score: docScore(d) }))
      .filter(x => x.score > 0 || currentDealFilter === 'All')
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(x => x.d);

    // B. Retrieve Task Context (Diligence/Closing/Ops)
    const relevantTasks = Object.entries(taskStatus)
      .filter(([key, val]) => {
        if (currentDealFilter !== 'All' && !key.startsWith(currentDealFilter)) return false;
        if (currentDeptView !== 'All' && (val.department || 'Other') !== currentDeptView) return false;
        return key.toLowerCase().includes(lowerQuery) || queryTerms.some(term => key.toLowerCase().includes(term));
      })
      .map(([key, val]) => `- ${key}: ${val.status} (Date: ${val.date}) ${val.notes ? `[Note: ${val.notes}]` : ''}`)
      .slice(0, 15);

    // C. Retrieve Site Profiles (Monday.com)
    const relevantSites = monday
      .filter(site => site.task.toLowerCase().includes(lowerQuery) || (site.deal_association && site.deal_association.toLowerCase().includes(lowerQuery)))
      .map(site => `- Site: ${site.task} | Status: ${site.status} | Date: ${site.date} | Deal: ${site.deal_association}`)
      .slice(0, 10);

    // D. Retrieve Integration Templates (Checklist)
    // If the user asks about "integration", "ops", "equipment", "signage", include relevant template items
    const relevantTemplates = checklist
      .filter(item =>
        item.task.toLowerCase().includes(lowerQuery) ||
        (item.category && item.category.toLowerCase().includes(lowerQuery)) ||
        lowerQuery.includes('integration') || lowerQuery.includes('plan')
      )
      .map(item => `- [Template] ${item.category || 'General'}: ${item.task} (Priority: ${item.priority})`)
      .slice(0, 10);

    // 2. Construct System Instruction & Prompt
    const systemInstruction = `
      You are LINKS Transaction AI, the internal acquisitions, diligence, closing, and integration assistant for Links Car Wash.

      YOUR JOB:
      Analyze, track, validate, summarize, and explain all operational, legal, financial, and development components of the active deal portfolio.

      BRAND VOICE:
      - Confident, Helpful, Efficient, Clear.
      - Customer-first internally = Operations-first.
      - No fluff — precise, actionable, reliable.

      DATASETS YOU HAVE ACCESS TO:
      1. Roadmap: Official list of deals and phases.
      2. Task Status: Master DD + Closing + Integration task matrix. (Keys: Deal_Phase_TaskName).
      3. Documents: ~850 VDR documents (PSAs, Surveys, Title, ESA, etc.).
      4. Checklist Data: Generic Ops/Integration templates. (Label these as "Source: Template/Recommendation").
      5. Monday Data: Site-level mappings and under-contract dates.

      CORE CAPABILITIES:
      1. Portfolio Dashboard: List deals, sites, phase counts, closing readiness.
      2. Task Analysis: "What's left?" -> Group by Phase (R-1, R-2, R-3, R-Closing).
      3. Document Search: "Purchase price?", "Phase I status?". ALWAYS cite the filename.
      4. Site Profiles: Deal name, status, key docs, gaps.
      5. Integration Planning: Build checklists using Task Status (existing) + Checklist Data (recommendations).

      RULES:
      - Never fabricate a document or detail. If missing, say "Not in the current dataset."
      - If you infer a deal from a filename/site name, state it is an inference.
      - Do not provide legal advice, only summaries.
      - If asked for a table or list, use clean Markdown.
      - Use the department perspective provided: ${currentDeptView}. Frame action items for that team when relevant.
    `;

    const contextString = `
      === CONTEXT ===
      Department perspective: ${currentDeptView}
      Deal focus: ${currentDealFilter}

      === DEAL ROADMAP (OFFICIAL) ===
      ${JSON.stringify(roadmap.deals)}

      === SITE PROFILES (MONDAY.COM) ===
      ${relevantSites.length > 0 ? relevantSites.join('\n') : "No specific sites matched."}

      === TASK STATUS (TRACKED ITEMS) ===
      ${relevantTasks.length > 0 ? relevantTasks.join('\n') : "No specific tracked tasks matched."}

      === DOCUMENT EVIDENCE (VDR) ===
      ${relevantDocs.map(d => `FILE: ${d.filename}\nDEAL: ${d.deal || 'Inferred'}\nSUMMARY: ${d.summary}\nSNIPPET: "${d.text_snippet}"`).join('\n\n')}

      === INTEGRATION TEMPLATES (RECOMMENDATIONS) ===
      ${relevantTemplates.length > 0 ? relevantTemplates.join('\n') : "No templates matched."}
    `;

    const fullPrompt = `
      CONTEXT DATA:
      ${contextString}

      USER QUESTION: 
      "${userQuery}"

      YOUR RESPONSE (as LINKS Transaction AI):
    `;

    // 3. Call Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash', // Updated to latest flash model if available, or keep 1.5-flash
      contents: fullPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1, // Very low temperature for high factual adherence
        maxOutputTokens: 1000,
      }
    });

    return {
      text: response.text || "I couldn't generate a response based on the data provided.",
      evidence: relevantDocs
    };

  } catch (error) {
    console.error("AI Service Error:", error);
    return {
      text: "I encountered an error processing your request. Please check your network connection and API key.",
      evidence: []
    };
  }
};

export type DealTool =
  | 'verifyTitle'
  | 'summarizeESA'
  | 'missingDocs';

const toolPrompts: Record<DealTool, string> = {
  verifyTitle: "Verify title commitments and list exceptions or gaps.",
  summarizeESA: "Summarize environmental/ESA findings and flag issues.",
  missingDocs: "List missing or critical documents for this deal (PSA, title, survey, ESA, financials)."
};

/**
 * Tool helper for per-deal AI actions (title, ESA, missing docs).
 */
export const runDealTool = async (
  tool: DealTool,
  dealName: string,
  context: AIContextData
): Promise<ChatResponse> => {
  const prompt = `Deal: ${dealName}\nTask: ${toolPrompts[tool]}\nDepartment perspective: ${context.currentDeptView || 'All'}\nFocus only on this deal unless evidence shows otherwise.`;
  return queryTransactionAI(prompt, { ...context, currentDealFilter: dealName });
};
