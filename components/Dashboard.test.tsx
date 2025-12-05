import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Dashboard from './Dashboard';
import { DataProvider } from '../contexts/DataContext';

// Mock dependencies
vi.mock('../services/geminiService', () => ({
  runDealTool: vi.fn().mockResolvedValue({ text: 'Mock AI Analysis', evidence: [] }),
}));

vi.mock('../services/dataService', () => ({
  subscribeToDeals: vi.fn(() => () => {}),
  subscribeToTasks: vi.fn(() => () => {}),
  subscribeToDocuments: vi.fn(() => () => {}),
  subscribeToChecklist: vi.fn(() => () => {}),
  subscribeToSites: vi.fn(() => () => {}),
  setTaskStatus: vi.fn(),
  uploadDocument: vi.fn(),
}));

vi.mock('../services/seedService', () => ({
  seedDatabase: vi.fn(),
}));

// Mock ResizeObserver for Recharts
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('Dashboard Component', () => {
  it('renders dashboard with title', () => {
    render(
      <DataProvider>
        <Dashboard />
      </DataProvider>
    );
    expect(screen.getByText('Portfolio Dashboard')).toBeInTheDocument();
  });

  it('renders KPI cards', () => {
    render(
      <DataProvider>
        <Dashboard />
      </DataProvider>
    );
    expect(screen.getByText('Active Deals')).toBeInTheDocument();
    expect(screen.getByText('Sites (Active DD)')).toBeInTheDocument();
  });
});
