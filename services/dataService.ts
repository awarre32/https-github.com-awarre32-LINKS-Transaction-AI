/**
 * Data Service
 * 
 * Handles fetching transaction data from Google Cloud Storage.
 * Strategy:
 * 1. Attempt to fetch JSON files from the public bucket 'links-transaction-ai' via standard HTTP.
 * 2. If successful, infer relationships (e.g., mapping Monday.com items to Deals).
 * 3. If fetch fails (network/CORS), the DataContext will fallback to local mocks.
 */

import { ChecklistItem, DealRoadmap, DocumentData, MondayItem, TaskMap } from "../types";

const BUCKET_NAME = 'links-transaction-ai';

/**
 * Helper to fetch a single JSON file from the GCS bucket using the public direct URL.
 * Since the bucket is public, this is the most reliable method and avoids API key permission issues.
 */
const fetchGcsFile = async <T>(filename: string): Promise<T | null> => {
  try {
    // Direct public access URL
    const url = `https://storage.googleapis.com/${BUCKET_NAME}/${filename}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`[GCS] Failed to fetch ${filename}. Status: ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.warn(`[GCS] Network error fetching ${filename}`, error);
    return null;
  }
};

/**
 * Intelligent matching to associate a Site (Monday Item) with a Deal.
 * Matches keywords like "Rich's", "Slappy's", "Arcadia" from the Deal name to the Site name.
 */
const mapMondayDeals = (mondayItems: MondayItem[], deals: DealRoadmap[]): MondayItem[] => {
  return mondayItems.map(item => {
    // If already associated (e.g. from mock), keep it.
    if (item.deal_association) return item;

    // Find best matching deal
    const matchedDeal = deals.find(deal => {
      // Create keywords from deal name (e.g. "Rich's 7-Site Deal" -> "Rich's")
      const keywords = deal.deal_name.split(' ').filter(w => w.length > 3 && !w.includes('Site') && !w.includes('Deal'));
      return keywords.some(keyword => item.task.includes(keyword));
    });

    return {
      ...item,
      deal_association: matchedDeal ? matchedDeal.deal_name : 'Unassigned'
    };
  });
};

/**
 * Main data fetching function.
 * Fetches all required JSON files in parallel from the GCS bucket.
 */
export const fetchAllData = async () => {
  // Default empty return structure
  const result = {
    roadmap: null as { deals: DealRoadmap[] } | null,
    taskStatus: null as TaskMap | null,
    documents: null as DocumentData[] | null,
    checklist: null as ChecklistItem[] | null,
    monday: null as MondayItem[] | null
  };

  try {
    // Fix: Inline the array in Promise.all so TypeScript infers it as a tuple, not an array of unions.
    const [roadmap, taskStatus, documents, checklist, monday] = await Promise.all([
      fetchGcsFile<{ deals: DealRoadmap[] }>('roadmap.json'),
      fetchGcsFile<TaskMap>('task_status.json'),
      fetchGcsFile<DocumentData[]>('documents.json'),
      fetchGcsFile<ChecklistItem[]>('checklist_data.json'),
      fetchGcsFile<MondayItem[]>('monday_data.json'),
    ]);

    // Process Monday data if available to add deal associations
    let processedMonday = monday;
    if (monday && roadmap) {
      processedMonday = mapMondayDeals(monday, roadmap.deals);
    }

    return {
      roadmap,
      taskStatus,
      documents,
      checklist,
      monday: processedMonday
    };

  } catch (error) {
    console.error("[GCS] Error connecting to Google Cloud Storage:", error);
    return result;
  }
};

// Legacy single fetcher (unused but kept for type safety if needed)
export const fetchJson = async <T>(filename: string): Promise<T | null> => {
  return fetchGcsFile<T>(filename);
};