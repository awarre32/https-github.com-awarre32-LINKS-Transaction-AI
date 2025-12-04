import React, { useState } from 'react';
import { AppView } from './types';
import Dashboard from './components/Dashboard';
import TaskBoard from './components/TaskBoard';
import DocumentChat from './components/DocumentChat';
import SiteList from './components/SiteList';
import Integration from './components/Integration';
import { DataProvider, useData } from './contexts/DataContext';
import { LayoutDashboard, CheckSquare, FileText, Map, Zap, Menu, X, Loader2, RefreshCw, Globe, AlertTriangle, Database } from 'lucide-react';
// import linksLogoWhite from '/logo-links.png'; // Fallback to public folder path for testing or if import fails

// Fix for image import issue: Use the file we put in src/assets if possible, 
// otherwise use the public path directly as string.
// Since Vite imports for static assets can be tricky without proper type definitions in some envs,
// we will try to use the public folder path which we know works reliably in Vite for /public assets.
// We copied src/assets/links-logo.png to public/logo-links.png earlier.
const LOGO_SRC = "/logo-links.png"; 

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { loading, roadmap, seedData, lastSynced } = useData();
  const [refreshing, setRefreshing] = useState(false);

  const handleSeed = async () => {
    if (confirm("This will overwrite existing Firestore data with mock data. Continue?")) {
      setRefreshing(true);
      await seedData();
      setRefreshing(false);
    }
  };

  const NavItem = ({ view, icon: Icon, label }: { view: AppView, icon: React.ElementType, label: string }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setMobileMenuOpen(false);
      }}
      className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-all ${
        currentView === view 
          ? 'bg-[#006747] text-white shadow-md' 
          : 'text-gray-300 hover:bg-[#052e22]/50 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  );

  if (loading && !refreshing) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 text-[#006747]">
        <img src={LOGO_SRC} alt="Links Car Wash" className="w-32 mb-6 p-2 bg-[#006747] rounded-lg shadow-lg" />
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <h2 className="text-xl font-bold">Connecting to Deal Room...</h2>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F5F7FA] overflow-hidden font-sans">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#052e22] text-white p-4 shadow-xl z-20 border-r border-[#006747]/30">
        <div className="mb-8 px-2 flex flex-col items-start">
            {/* Using the public path logo or fallback */}
            <div className="flex items-center gap-2 mb-2">
               {/* Just use text if logo fails, but here we try img */}
               <img src={LOGO_SRC} alt="Links Car Wash" className="h-10 w-auto bg-white rounded p-1" />
            </div>
            <span className="text-xs font-light opacity-80 uppercase tracking-widest text-green-300">Transaction AI</span>
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
            <span className="truncate" title="Google Cloud Storage">Source: Firestore Live</span>
          </p>
          <p className="opacity-70 truncate mb-1">links-transaction-ai</p>
          {lastSynced && (
            <p className="text-[10px] opacity-60 mb-2">
              Synced: {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
          <p className="mt-1">v2.0 • Powered by Gemini</p>
          
          {roadmap && roadmap.deals.length === 0 && (
            <div className="mt-4 p-3 bg-yellow-900/30 rounded border border-yellow-500/50">
              <p className="text-yellow-300 font-bold flex items-center gap-1 mb-1 text-[10px] uppercase tracking-wider">
                <AlertTriangle className="w-3 h-3" /> No Data Found
              </p>
              <p className="mb-2 opacity-80 leading-tight">Firestore is empty.</p>
              <button 
                onClick={handleSeed}
                disabled={refreshing}
                className="w-full flex justify-center items-center gap-2 bg-[#F4A024]/20 hover:bg-[#F4A024]/40 text-white py-1.5 rounded transition-colors text-xs font-medium border border-[#F4A024]/30"
              >
                <Database className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Seeding...' : 'Seed Database'}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-[#052e22] text-white p-4 flex justify-between items-center z-30 shadow-md">
        <div className="flex items-center gap-2">
           <img src={LOGO_SRC} alt="Links Car Wash" className="h-8 w-auto bg-white rounded p-0.5" />
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-[#052e22] z-20 pt-20 p-4 space-y-2 md:hidden">
          <NavItem view={AppView.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
          <NavItem view={AppView.TASKS} icon={CheckSquare} label="Tasks & Diligence" />
          <NavItem view={AppView.DOCUMENTS} icon={FileText} label="Document AI" />
          <NavItem view={AppView.SITES} icon={Map} label="Sites" />
          <NavItem view={AppView.INTEGRATION} icon={Zap} label="Integration" />
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 md:pt-8 bg-[#F5F7FA]">
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