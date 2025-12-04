import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ChecklistItem, DealRoadmap, DocumentData, MondayItem, TaskMap } from '../types';
import { fetchAllData } from '../services/dataService';
import { MOCK_CHECKLIST, MOCK_DOCUMENTS, MOCK_MONDAY, MOCK_ROADMAP, MOCK_TASK_STATUS } from '../constants';

interface AppData {
  roadmap: { deals: DealRoadmap[] };
  taskStatus: TaskMap;
  documents: DocumentData[];
  checklist: ChecklistItem[];
  monday: MondayItem[];
  loading: boolean;
  usingFallback: boolean;
  lastSynced: Date | null;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<AppData | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState({
    roadmap: MOCK_ROADMAP,
    taskStatus: MOCK_TASK_STATUS,
    documents: MOCK_DOCUMENTS,
    checklist: MOCK_CHECKLIST,
    monday: MOCK_MONDAY,
    loading: true,
    usingFallback: false,
    lastSynced: null as Date | null
  });

  const loadData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    
    const fetched = await fetchAllData();
    
    // If we successfully fetched the core roadmap and status, use the remote data.
    // Otherwise, fall back to the mocks defined in initial state.
    if (fetched.roadmap && fetched.taskStatus) {
      console.log("[Data Context] Successfully connected to GCS Deal Room.");
      setState({
        roadmap: fetched.roadmap,
        taskStatus: fetched.taskStatus,
        documents: fetched.documents || [],
        checklist: fetched.checklist || [],
        monday: fetched.monday || [],
        loading: false,
        usingFallback: false,
        lastSynced: new Date()
      });
    } else {
      console.info("[Data Context] Remote data unavailable. Initializing with local datasets.");
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        usingFallback: true,
        lastSynced: new Date()
      }));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <DataContext.Provider value={{ ...state, refreshData: loadData }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};