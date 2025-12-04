import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { ChecklistItem, DealRoadmap, DocumentData, MondayItem, TaskMap } from '../types';
import { 
  subscribeToChecklist, 
  subscribeToDeals, 
  subscribeToDocuments, 
  subscribeToSites, 
  subscribeToTasks 
} from '../services/dataService';
import { seedDatabase } from '../services/seedService';

interface AppData {
  roadmap: { deals: DealRoadmap[] };
  taskStatus: TaskMap;
  documents: DocumentData[];
  checklist: ChecklistItem[];
  monday: MondayItem[];
  loading: boolean;
  usingFallback: boolean; // Kept for interface compatibility, always false now
  lastSynced: Date | null;
  refreshData: () => Promise<void>; // Kept for compatibility
  seedData: () => Promise<void>;
}

const DataContext = createContext<AppData | undefined>(undefined);

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

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deals, setDeals] = useState<DealRoadmap[]>([]);
  const [taskStatus, setTaskStatus] = useState<TaskMap>({});
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [rawMonday, setRawMonday] = useState<MondayItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Subscribe to real-time updates
  useEffect(() => {
    setLoading(true);
    
    const unsubDeals = subscribeToDeals((data) => {
      setDeals(data);
      setLastSynced(new Date());
    });
    
    const unsubTasks = subscribeToTasks((data) => {
      setTaskStatus(data);
    });

    const unsubDocs = subscribeToDocuments((data) => {
      setDocuments(data);
    });

    const unsubChecklist = subscribeToChecklist((data) => {
      setChecklist(data);
    });

    const unsubSites = subscribeToSites((data) => {
      setRawMonday(data);
    });

    // Check if we have received initial data
    // This is a simple approximation. In a real app we might track each loading state.
    // Here we just assume after a short timeout or when data arrives we are good.
    // However, onSnapshot fires immediately with empty or current data.
    const timer = setTimeout(() => setLoading(false), 1000);

    return () => {
      unsubDeals();
      unsubTasks();
      unsubDocs();
      unsubChecklist();
      unsubSites();
      clearTimeout(timer);
    };
  }, []);

  // Computed Monday items with deal associations
  const monday = useMemo(() => {
    return mapMondayDeals(rawMonday, deals);
  }, [rawMonday, deals]);

  const handleSeed = async () => {
    setLoading(true);
    await seedDatabase();
    setLoading(false);
  };

  const refreshData = async () => {
    // No-op for Firestore listeners, but kept for interface
    console.log("Data refresh requested (handled by real-time listeners)");
  };

  return (
    <DataContext.Provider value={{
      roadmap: { deals },
      taskStatus,
      documents,
      checklist,
      monday,
      loading,
      usingFallback: false,
      lastSynced,
      refreshData,
      seedData: handleSeed
    }}>
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
