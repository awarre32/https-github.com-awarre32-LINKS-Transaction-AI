import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { ChecklistItem, DealRoadmap, DocumentData, MondayItem, TaskMap, TaskStatus, DepartmentView } from '../types';
import {
  subscribeToChecklist,
  subscribeToDeals,
  subscribeToDocuments,
  subscribeToSites,
  subscribeToTasks,
  setTaskStatus as persistTaskStatus
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
  updateTaskStatus: (key: string, status: TaskStatus['status']) => void;
  currentDeptView: DepartmentView;
  setCurrentDeptView: (dept: DepartmentView) => void;
  currentDealFilter: string | 'All';
  setCurrentDealFilter: (deal: string | 'All') => void;
}

const DataContext = createContext<AppData | undefined>(undefined);

/**
 * Intelligent matching to associate a Site (Monday Item) with a Deal.
 */
const mapMondayDeals = (mondayItems: MondayItem[], deals: DealRoadmap[]): MondayItem[] => {
  return mondayItems.map(item => {
    if (item.deal_association) return item;

    const matchedDeal = deals.find(deal => {
      const dealName = deal.deal_name || '';
      const keywords = dealName.split(' ').filter(w => w.length > 3 && !w.includes('Site') && !w.includes('Deal'));
      return keywords.some(keyword => item.task.includes(keyword));
    });

    return {
      ...item,
      deal_association: matchedDeal ? matchedDeal.deal_name : 'Unassigned'
    };
  });
};

const deriveDealNamesFromTasks = (taskStatus: TaskMap): string[] => {
  const names = new Set<string>();
  Object.keys(taskStatus).forEach(key => {
    const parts = key.split('_');
    if (parts[0]) names.add(parts[0]);
  });
  return Array.from(names);
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deals, setDeals] = useState<DealRoadmap[]>([]);
  const [taskStatus, setTaskState] = useState<TaskMap>({});
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [rawMonday, setRawMonday] = useState<MondayItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [currentDeptView, setCurrentDeptView] = useState<DepartmentView>('All');
  const [currentDealFilter, setCurrentDealFilter] = useState<string | 'All'>('All');

  // Subscribe to real-time updates
  useEffect(() => {
    setLoading(true);

    const unsubDeals = subscribeToDeals((data) => {
      setDeals(data);
      setLastSynced(new Date());
    });

    const unsubTasks = subscribeToTasks((data) => {
      setTaskState(data);
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

  // Merge deal names seen in tasks so filters/metrics include everything present in the data files
  const mergedDeals: DealRoadmap[] = useMemo(() => {
    const map = new Map<string, DealRoadmap>();
    deals.forEach(d => map.set(d.deal_name, d));

    deriveDealNamesFromTasks(taskStatus).forEach(name => {
      if (!map.has(name)) {
        map.set(name, {
          deal_name: name,
          status: 'Diligence',
          closing_date: ''
        });
      }
    });

    return Array.from(map.values());
  }, [deals, taskStatus]);

  // Computed Monday items with deal associations
  const monday = useMemo(() => {
    return mapMondayDeals(rawMonday, mergedDeals);
  }, [rawMonday, mergedDeals]);

  const handleSeed = async () => {
    setLoading(true);
    await seedDatabase();
    setLoading(false);
  };

  const refreshData = async () => {
    // No-op for Firestore listeners, but kept for interface
    console.log("Data refresh requested (handled by real-time listeners)");
  };

  const updateTaskStatus = (key: string, status: TaskStatus['status']) => {
    setTaskState(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || { notes: '', date: '' }),
        status
      }
    }));
    // Best-effort persistence to Firestore
    persistTaskStatus(key, status).catch(err => console.warn("Failed to persist task status:", err));
  };

  return (
    <DataContext.Provider value={{
      roadmap: { deals: mergedDeals },
      taskStatus,
      documents,
      checklist,
      monday,
      loading,
      usingFallback: false,
      lastSynced,
      refreshData,
      seedData: handleSeed,
      updateTaskStatus,
      currentDeptView,
      setCurrentDeptView,
      currentDealFilter,
      setCurrentDealFilter
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
