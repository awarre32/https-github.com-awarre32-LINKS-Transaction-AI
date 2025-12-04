import React, { useState } from 'react';
import { AppView } from './types';
import Dashboard from './components/Dashboard';
import TaskBoard from './components/TaskBoard';
import DocumentChat from './components/DocumentChat';
import SiteList from './components/SiteList';
import Integration from './components/Integration';
import { DataProvider, useData } from './contexts/DataContext';
import { LayoutDashboard, CheckSquare, FileText, Map, Zap, Menu, X, Loader2, RefreshCw, Globe, AlertTriangle } from 'lucide-react';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { loading, usingFallback, refreshData } = useData();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const NavItem = ({ view, icon: Icon, label }: { view: AppView, icon: React.ElementType, label: string }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setMobileMenuOpen(false);
      }}
      className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-all ${
        currentView === view 
          ? 'bg-[#00A86B] text-white shadow-md' 
          : 'text-gray-300 hover:bg-[#0B3B2E]/50 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  );

  if (loading && !refreshing) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-100 text-[#0B3B2E]">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <h2 className="text-xl font-bold">Connecting to Deal Room...</h2>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0B3B2E] text-white p-4 shadow-xl z-20">
        <div className="mb-8 px-2 flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#F4A024] rounded-md flex items-center justify-center font-bold text-[#0B3B2E]">L</div>
            <span className="text-xl font-bold tracking-tight">LINKS <span className="font-light opacity-80">AI</span></span>
        </div>
        
        <nav className="space-y-2 flex-1">
          <NavItem view={AppView.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
          <NavItem view={AppView.TASKS} icon={CheckSquare} label="Tasks & Diligence" />
          <NavItem view={AppView.DOCUMENTS} icon={FileText} label="Document AI" />
          <NavItem view={AppView.SITES} icon={Map} label="Sites" />
          <NavItem view={AppView.INTEGRATION} icon={Zap} label="Integration" />
        </nav>

        <div className="mt-auto pt-4 border-t border-white/10 text-xs text-gray-400">
          <p className="flex items-center gap-1 mb-1">
            <Globe className="w-3 h-3" />
            <span className="truncate" title="Google Cloud Storage">Source: GCS Public Bucket</span>
          </p>
          <p className="opacity-70 truncate">links-transaction-ai</p>
          <p className="mt-1">v1.4 • Powered by Gemini</p>
          
          {usingFallback && (
            <div className="mt-4 p-3 bg-red-900/30 rounded border border-red-500/50">
              <p className="text-red-300 font-bold flex items-center gap-1 mb-1 text-[10px] uppercase tracking-wider">
                <AlertTriangle className="w-3 h-3" /> Offline Mode
              </p>
              <p className="mb-2 opacity-80 leading-tight">Using internal cache.</p>
              <p className="text-[10px] text-gray-400 mb-2 italic">
                Check bucket CORS settings if public.
              </p>
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-full flex justify-center items-center gap-2 bg-[#00A86B]/20 hover:bg-[#00A86B]/40 text-white py-1.5 rounded transition-colors text-xs font-medium border border-[#00A86B]/30"
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Connecting...' : 'Retry Connection'}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-[#0B3B2E] text-white p-4 flex justify-between items-center z-30 shadow-md">
        <span className="font-bold">LINKS Transaction AI</span>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-[#0B3B2E] z-20 pt-20 p-4 space-y-2 md:hidden">
          <NavItem view={AppView.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
          <NavItem view={AppView.TASKS} icon={CheckSquare} label="Tasks & Diligence" />
          <NavItem view={AppView.DOCUMENTS} icon={FileText} label="Document AI" />
          <NavItem view={AppView.SITES} icon={Map} label="Sites" />
          <NavItem view={AppView.INTEGRATION} icon={Zap} label="Integration" />
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 md:pt-8">
        <div className="max-w-7xl mx-auto">
          {currentView === AppView.DASHBOARD && <Dashboard />}
          {currentView === AppView.TASKS && <TaskBoard />}
          {currentView === AppView.DOCUMENTS && <DocumentChat />}
          {currentView === AppView.SITES && <SiteList />}
          {currentView === AppView.INTEGRATION && <Integration />}
        </div>
      </main>

    </div>
  );
};

const App: React.FC = () => {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
};

export default App;