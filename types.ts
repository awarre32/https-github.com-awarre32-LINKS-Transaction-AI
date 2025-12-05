export interface DealRoadmap {
  deal_name: string;
  status: 'PSA' | 'Diligence' | 'Closing' | 'Integration';
  closing_date: string;
}

export interface TaskStatus {
  status: 'Completed' | 'In Progress' | 'Not Started' | 'Blocked';
  date: string;
  notes: string;
  department?: DepartmentView;
  targetDate?: string;
  updatedBy?: string;
}

export interface TaskMap {
  [key: string]: TaskStatus;
}

export interface DocumentData {
  id?: string; // Optional ID for Firestore docs
  filename: string;
  deal: string | null;
  needs_ocr: boolean;
  summary: string;
  text_snippet: string;
  full_text?: string;
  type?: 'PSA' | 'ESA' | 'Title' | 'Survey' | 'Financial' | 'Other';
  url?: string;
  uploadedAt?: string;
}

export interface ChecklistItem {
  task: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface MondayItem {
  task: string; // Used as Site Name usually in this context
  status: string;
  date: string;
  deal_association?: string; // Inferred helper
}

export interface ParsedTask {
  deal_name: string;
  phase_code: string;
  task_name: string;
  status: string;
  date: string;
  notes: string;
  original_key: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  TASKS = 'TASKS',
  DOCUMENTS = 'DOCUMENTS',
  SITES = 'SITES',
  INTEGRATION = 'INTEGRATION'
}

export type DepartmentView = 'All' | 'Exec' | 'Ops' | 'Legal' | 'Finance' | 'HR' | 'Dev' | 'Other';
