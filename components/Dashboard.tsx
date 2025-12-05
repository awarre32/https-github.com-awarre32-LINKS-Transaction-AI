import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { TaskStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle, CheckCircle2, CircleDollarSign, Building2, WifiOff, AlertTriangle, Activity, Clock4 } from 'lucide-react';
import { runDealTool } from '../services/geminiService';

const Dashboard: React.FC = () => {
  const { roadmap, monday, taskStatus, usingFallback, refreshData, currentDeptView } = useData();
  const [aiResults, setAiResults] = useState<Record<string, { text: string; loading: boolean }>>({});
  const tasksByDeal = useMemo(() => {
    const map: Record<string, TaskStatus[]> = {};
    (Object.entries(taskStatus) as [string, TaskStatus][]).forEach(([key, val]) => {
      const parts = key.split('_');
      const dealName = parts[0] || 'Unknown Deal';
      if (!map[dealName]) map[dealName] = [];
      map[dealName].push(val);
    });
    return map;
  }, [taskStatus]);

  const dealReadiness = useMemo(() => {
    return roadmap.deals.map(deal => {
      const tasks = tasksByDeal[deal.deal_name] || [];
      const total = tasks.length || 1;
      const completed = tasks.filter(t => t.status === 'Completed').length;
      const blockers = tasks.filter(t => t.status === 'Blocked').length;
      const inProgress = tasks.filter(t => t.status === 'In Progress').length;
      const progress = Math.round((completed / total) * 100);
      const topBlockers = tasks
        .map((t, idx) => ({ ...t, idx }))
        .filter(t => t.status === 'Blocked' || t.status === 'In Progress')
        .slice(0, 3);
      return { deal, progress, blockers, inProgress, total, completed, topBlockers };
    });
  }, [roadmap.deals, tasksByDeal]);

  // Calculations
  const totalDeals = roadmap.deals.length;
  const sitesUnderContract = monday.filter(m => m.status === 'Under Contract' || m.status === 'Diligence').length;
  const criticalPathTasks = (Object.values(taskStatus) as TaskStatus[]).filter(t => t.status === 'In Progress').length;
  const closingSoon = roadmap.deals
    .filter(d => d.status === 'Closing')
    .map(d => d.deal_name)
    .join(', ');

  // Chart Data Preparation
  const dealStatusData = roadmap.deals.map(deal => {
    // Count tasks for this deal
    const dealTasks = (Object.entries(taskStatus) as [string, TaskStatus][]).filter(([key]) => key.startsWith(deal.deal_name));
    const completed = dealTasks.filter(([, v]) => v.status === 'Completed').length;
    const remaining = dealTasks.filter(([, v]) => v.status !== 'Completed').length;

    return {
      name: (deal.deal_name || '').split(' ').slice(0, 2).join(' '), // Shorten name
      Completed: completed,
      Remaining: remaining
    };
  });

  return (
    <div className="space-y-6">
      <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#006747]">Portfolio Dashboard</h1>
          <p className="text-gray-600">Real-time acquisition velocity and pipeline health.</p>
        </div>
          <div className="flex items-center gap-2 bg-white shadow-sm border border-gray-100 px-4 py-2 rounded-full text-xs text-gray-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Data
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">Links Transaction AI</span>
          </div>
      </header>

      {usingFallback && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-start gap-3">
            <WifiOff className="text-red-500 w-6 h-6 mt-1 md:mt-0" />
            <div>
              <h3 className="text-red-800 font-bold">Using Mock/Offline Data</h3>
              <p className="text-red-600 text-sm">
                Could not connect to Google Cloud Storage. Displaying sample data instead.
                <br />
                <span className="text-xs opacity-75">Tip: Check bucket CORS configuration or file permissions.</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => refreshData()}
            className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded font-medium text-sm hover:bg-red-50 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Active Deals" value={totalDeals} icon={<Building2 className="w-6 h-6" />} />
        <KpiCard label="Sites (Active DD)" value={sitesUnderContract} icon={<CircleDollarSign className="w-6 h-6" />} />
        <KpiCard label="Open Tasks" value={criticalPathTasks} icon={<AlertCircle className="w-6 h-6" />} tone="amber" />
        <KpiCard label="Next Closing" value={closingSoon || 'None'} icon={<CheckCircle2 className="w-6 h-6" />} tone="slate" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Chart Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#006747]">Task Completion by Deal</h2>
            <span className="text-xs text-gray-500 flex items-center gap-1"><Activity className="w-4 h-4" /> Velocity</span>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dealStatusData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#4B5563" />
                <YAxis stroke="#4B5563" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#052e22', color: '#fff', border: 'none', borderRadius: '4px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="Remaining" stackId="a" fill="#E5E7EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Completed" stackId="a" fill="#006747" radius={[0, 0, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Feed */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-[#006747] mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" /> Critical Blockers</h2>
          <div className="space-y-3">
            {(Object.entries(taskStatus) as [string, TaskStatus][])
              .filter(([, val]) => {
                const isBlock = val.status === 'In Progress' || val.status === 'Blocked';
                if (!isBlock) return false;
                if (currentDeptView !== 'All' && (val.department || 'Other') !== currentDeptView) return false;
                return true;
              })
              .slice(0, 5)
              .map(([key, val], idx) => {
                const [deal, phase, task] = key.split('_');
                return (
                  <div key={idx} className="p-3 bg-amber-50 rounded border border-amber-100">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">{phase}</span>
                      <span className="text-[10px] text-amber-700">{val.status}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{task}</p>
                    <p className="text-xs text-gray-600 mt-1 truncate">{deal}</p>
                  </div>
                );
              })}
            {Object.values(taskStatus).filter(val => val.status === 'In Progress' || val.status === 'Blocked').length === 0 && (
              <div className="text-sm text-gray-500 italic">No blockers right now.</div>
            )}
          </div>
          <button className="w-full mt-4 py-2 text-sm font-medium text-[#006747] border border-[#006747] rounded hover:bg-[#006747] hover:text-white transition-colors">
            View All Tasks
          </button>
        </div>
      </div>

      {/* Deal Readiness */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-[#006747]">Deal Readiness</h2>
            <p className="text-sm text-gray-500">Progress, blockers, and momentum by deal.</p>
          </div>
        </div>
        <div className="space-y-4">
          {dealReadiness.map(({ deal, progress, blockers, inProgress, total, completed, topBlockers }) => (
            <div key={deal.deal_name} className="border border-gray-100 rounded p-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{deal.deal_name}</h3>
                  <p className="text-xs text-gray-500">Status: {deal.status} • {completed}/{total} done</p>
                </div>
                <span className="text-sm font-semibold text-[#006747]">{progress}%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded">
                <div
                  className="h-2 bg-[#006747] rounded"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex gap-4 text-xs text-gray-600 mt-2">
                <span className="px-2 py-1 rounded bg-green-50 text-[#006747] font-semibold">Completed: {completed}</span>
                <span className="px-2 py-1 rounded bg-orange-50 text-[#F4A024] font-semibold">In Progress: {inProgress}</span>
                <span className="px-2 py-1 rounded bg-red-50 text-red-600 font-semibold">Blockers: {blockers}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  { label: 'AI: Verify Title', tool: 'verifyTitle' as const },
                  { label: 'AI: Summarize ESA', tool: 'summarizeESA' as const },
                  { label: 'AI: Missing Docs', tool: 'missingDocs' as const },
                ].map(btn => (
                  <button
                    key={btn.tool}
                    className="text-xs px-2 py-1 rounded border border-[#006747] text-[#006747] hover:bg-[#006747] hover:text-white transition-colors"
                    disabled={aiResults[deal.deal_name]?.loading}
                    onClick={async () => {
                      setAiResults(prev => ({ ...prev, [deal.deal_name]: { text: '', loading: true } }));
                      const res = await runDealTool(btn.tool, deal.deal_name, {
                        documents: [],
                        taskStatus,
                        roadmap,
                        checklist: [],
                        monday,
                        currentDeptView,
                        currentDealFilter: deal.deal_name
                      });
                      setAiResults(prev => ({ ...prev, [deal.deal_name]: { text: res.text, loading: false } }));
                    }}
                  >
                    {aiResults[deal.deal_name]?.loading ? 'Working…' : btn.label}
                  </button>
                ))}
              </div>
              {aiResults[deal.deal_name]?.text && (
                <div className="mt-3 text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded p-3">
                  {aiResults[deal.deal_name].text}
                </div>
              )}
              {topBlockers.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-bold text-gray-700 mb-1">Top blockers / in-progress:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {topBlockers.map((t, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${t.status === 'Blocked' ? 'bg-red-500' : 'bg-orange-400'}`} />
                        <span>{t.notes || 'Task pending'} ({t.status})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

type KpiCardProps = {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone?: 'green' | 'amber' | 'slate';
};

const toneMap = {
  green: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    iconBg: 'bg-white',
    border: 'border border-emerald-100'
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    iconBg: 'bg-white',
    border: 'border border-amber-100'
  },
  slate: {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    iconBg: 'bg-white',
    border: 'border border-slate-100'
  }
};

const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon, tone = 'green' }) => {
  const t = toneMap[tone];
  return (
    <div className={`p-5 rounded-xl shadow-sm ${t.bg} ${t.border}`}>
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <span className={`p-2 rounded-lg ${t.iconBg} text-[#006747] shadow-sm`}>{icon}</span>
      </div>
      <h3 className="text-3xl font-bold text-[#006747]">{value}</h3>
    </div>
  );
};

export default Dashboard;
