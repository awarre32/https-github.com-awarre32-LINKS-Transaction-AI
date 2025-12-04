/**
 * Data Service
 * 
 * Handles fetching transaction data from Google Cloud Storage.
 * Strategy:
 * 1. Attempt to fetch via Direct Public URL (Standard).
 * 2. If that fails (likely CORS), attempt via JSON API Endpoint.
 * 3. Uses cache-busting to ensure fresh data.
 */

import { ChecklistItem, DealRoadmap, DocumentData, MondayItem, TaskMap } from "../types";

const BUCKET_NAME = 'links-transaction-ai';

/**
 * Fetch with multiple strategies to handle CORS/Network issues.
 */
const fetchGcsFile = async <T>(filename: string): Promise<T | null> => {
  const cacheBuster = `?t=${new Date().getTime()}`;
  
  // Strategy 1: Direct Public URL
  // Works best if Bucket is Public + CORS is configured.
  const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${filename}${cacheBuster}`;
  
  // Strategy 2: JSON API
  // Works best for some browser clients if Direct URL is blocked by strict CORS, 
  // provided the object is public.
  const apiUrl = `https://storage.googleapis.com/storage/v1/b/${BUCKET_NAME}/o/${filename}?alt=media&t=${new Date().getTime()}`;

  try {
    // Attempt Strategy 1
    const response = await fetch(publicUrl);
    if (response.ok) {
      return await response.json();
    }
    throw new Error(`Direct fetch failed: ${response.status}`);
  } catch (directError) {
    console.warn(`[GCS] Direct access failed for ${filename}, trying API endpoint...`, directError);
    
    try {
      // Attempt Strategy 2
      const apiResponse = await fetch(apiUrl);
      if (apiResponse.ok) {
        return await apiResponse.json();
      }
      console.warn(`[GCS] API access failed for ${filename}: ${apiResponse.status}`);
    } catch (apiError) {
      console.warn(`[GCS] All fetch strategies failed for ${filename}`, apiError);
    }
  }

  return null;
};

/**
 * Intelligent matching to associate a Site (Monday Item) with a Deal.
 */
const mapMondayDeals = (mondayItems: MondayItem[], deals: DealRoadmap[]): MondayItem[] => {
  return mondayItems.map(item => {
    if (item.deal_association) return item;

    const matchedDeal = deals.find(deal => {
      const keywords = deal.deal_name.split(' ').filter(w => w.length > 3 && !w.includes('Site') && !w.includes('Deal'));
      return keywords.some(keyword => item.task.includes(keyword));
    });

    return {
      ...item,
      deal_association: matchedDeal ? matchedDeal.deal_name : 'Unassigned'
    };
  });
};

export const fetchAllData = async () => {
  const result = {
    roadmap: null as { deals: DealRoadmap[] } | null,
    taskStatus: null as TaskMap | null,
    documents: null as DocumentData[] | null,
    checklist: null as ChecklistItem[] | null,
    monday: null as MondayItem[] | null,
    error: null as string | null
  };

  try {
    const [roadmap, taskStatus, documents, checklist, monday] = await Promise.all([
      fetchGcsFile<{ deals: DealRoadmap[] }>('roadmap.json'),
      fetchGcsFile<TaskMap>('task_status.json'),
      fetchGcsFile<DocumentData[]>('documents.json'),
      fetchGcsFile<ChecklistItem[]>('checklist_data.json'),
      fetchGcsFile<MondayItem[]>('monday_data.json'),
    ]);

    let processedMonday = monday;
    if (monday && roadmap) {
      processedMonday = mapMondayDeals(monday, roadmap.deals);
    }

    // Check if critical data is missing
    if (!roadmap || !taskStatus) {
      result.error = "Connection Failed: Could not load 'roadmap.json' or 'task_status.json'. check CORS settings.";
    }

    return {
      roadmap,
      taskStatus,
      documents,
      checklist,
      monday: processedMonday,
      error: result.error
    };

  } catch (error) {
    console.error("[GCS] Critical error fetching data:", error);
    return { ...result, error: "Network Error" };
  }
};

export const fetchJson = async <T>(filename: string): Promise<T | null> => {
  return fetchGcsFile<T>(filename);
};
