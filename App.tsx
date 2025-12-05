import React, { useState } from 'react';
import { AppView } from './types';
import Dashboard from './components/Dashboard';
import TaskBoard from './components/TaskBoard';
import DocumentChat from './components/DocumentChat';
import SiteList from './components/SiteList';
import Integration from './components/Integration';
import { DataProvider, useData } from './contexts/DataContext';
import { LayoutDashboard, CheckSquare, FileText, Map, Zap, Menu, X, Loader2, Globe, AlertTriangle } from 'lucide-react';
// import linksLogoWhite from '/logo-links.png'; // Fallback to public folder path for testing or if import fails

// Fix for image import issue: Use the file we put in src/assets if possible, 
// otherwise use the public path directly as string.
// Since Vite imports for static assets can be tricky without proper type definitions in some envs,
// we will try to use the public folder path which we know works reliably in Vite for /public assets.
// We copied src/assets/links-logo.png to public/logo-links.png earlier.
const LOGO_SRC = "/logo-links.png";

interface NavItemProps {
  view: AppView;
  icon: React.ElementType;
  label: string;
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  setMobileMenuOpen: (open: boolean) => void;
}

const NavItem: React.FC<NavItemProps> = ({ view, icon: Icon, label, currentView, setCurrentView, setMobileMenuOpen }) => (
  <button
    onClick={() => {
      setCurrentView(view);
      setMobileMenuOpen(false);
    }}
    className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-all ${currentView === view
      ? 'bg-[#006747] text-white shadow-md'
      : 'text-gray-300 hover:bg-[#052e22]/50 hover:text-white'
      }`}
  >
    <Icon className="w-5 h-5" />
    <span className="font-medium">{label}</span>
  </button>
);

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { loading, roadmap, lastSynced, currentDeptView, setCurrentDeptView, currentDealFilter, setCurrentDealFilter } = useData();
  const [refreshing] = useState(false);

  // Auto-seed effect removed per user request

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
        <div className="mb-10 px-2 flex flex-col items-start">
          {/* Using the public path logo or fallback */}
          <div className="flex items-center gap-2 mb-3">
            {/* Just use text if logo fails, but here we try img */}
            <img src={LOGO_SRC} alt="Links Car Wash" className="h-16 w-auto bg-white rounded-lg p-2 shadow-md border border-white/30" />
          </div>
          <span className="text-xs font-light opacity-90 uppercase tracking-[0.3em] text-green-200">Transaction AI</span>
        </div>

        <nav className="space-y-2 flex-1">
          <NavItem view={AppView.DASHBOARD} icon={LayoutDashboard} label="Dashboard" currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} />
          <NavItem view={AppView.TASKS} icon={CheckSquare} label="Tasks & Diligence" currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} />
          <NavItem view={AppView.DOCUMENTS} icon={FileText} label="Document AI" currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} />
          <NavItem view={AppView.SITES} icon={Map} label="Sites" currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} />
          <NavItem view={AppView.INTEGRATION} icon={Zap} label="Integration" currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} />
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
              {/* Seed button removed per user request */}
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-[#052e22] text-white p-4 flex justify-between items-center z-30 shadow-md">
        <div className="flex items-center gap-2">
          <img src={LOGO_SRC} alt="Links Car Wash" className="h-10 w-auto bg-white rounded p-1 shadow" />
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-[#052e22] z-20 pt-20 p-4 space-y-2 md:hidden">
          <NavItem view={AppView.DASHBOARD} icon={LayoutDashboard} label="Dashboard" currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} />
          <NavItem view={AppView.TASKS} icon={CheckSquare} label="Tasks & Diligence" currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} />
          <NavItem view={AppView.DOCUMENTS} icon={FileText} label="Document AI" currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} />
          <NavItem view={AppView.SITES} icon={Map} label="Sites" currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} />
          <NavItem view={AppView.INTEGRATION} icon={Zap} label="Integration" currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} />
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 md:pt-8 bg-[#F5F7FA]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <label className="text-xs uppercase tracking-wide text-gray-500">Department</label>
              <select
                className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm text-gray-700"
                value={currentDeptView}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onChange={(e) => setCurrentDeptView(e.target.value as any)}
              >
                {['All', 'Exec', 'Ops', 'Legal', 'Finance', 'HR', 'Dev', 'Other'].map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs uppercase tracking-wide text-gray-500">Deal</label>
              <select
                className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm text-gray-700 min-w-[200px]"
                value={currentDealFilter}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onChange={(e) => setCurrentDealFilter(e.target.value as any)}
              >
                <option value="All">All Deals</option>
                {roadmap.deals.map(d => (
                  <option key={d.deal_name} value={d.deal_name}>{d.deal_name}</option>
                ))}
              </select>
            </div>
          </div>
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
