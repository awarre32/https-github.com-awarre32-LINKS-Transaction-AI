import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { TaskStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle2, CircleDollarSign, Building2, WifiOff, AlertTriangle, Activity, Clock4 } from 'lucide-react';
import { runDealTool } from '../services/geminiService';
import KpiCard from './KpiCard';

const Dashboard: React.FC = () => {
  const { roadmap, monday, taskStatus, checklist, usingFallback, refreshData, currentDeptView } = useData();
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      name: `${(deal.deal_name || '').split(' ').slice(0, 2).join(' ')} ${(deal as any).risk_score ? `(Risk: ${(deal as any).risk_score})` : ''}`,
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
        <KpiCard label="Critical Path Tasks" value={criticalPathTasks} icon={<Activity className="w-6 h-6" />} />
        <KpiCard label="Closing Soon" value={closingSoon || 'None'} icon={<Clock4 className="w-6 h-6" />} />
      </div>

      {/* Charts & Readiness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Deal Progress</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dealStatusData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="Completed" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Remaining" stackId="a" fill="#e5e7eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Readiness List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-y-auto max-h-[400px]">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Deal Readiness</h2>
          <div className="space-y-4">
            {dealReadiness.map((d, idx) => (
              <div key={idx} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">{d.deal.deal_name}</span>
                  <span className={`text-sm font-bold ${d.progress === 100 ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {d.progress}% Ready
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${d.progress}%` }}
                  ></div>
                </div>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {d.completed} Done
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-500" /> {d.blockers} Blocked
                  </span>
                </div>
                {/* Top Blockers */}
                {d.topBlockers.length > 0 && (
                  <div className="mt-2 pl-2 border-l-2 border-amber-100">
                    <p className="text-xs font-semibold text-amber-700 mb-1">Top Issues:</p>
                    {d.topBlockers.map((b, i) => (
                      <div key={i} className="text-xs text-gray-600 truncate">
                        • {b.originalKey.split('_').pop()}
                      </div>
                    ))}
                  </div>
                )}

                {/* AI Tool Button */}
                <div className="mt-3">
                  <button
                    onClick={async () => {
                      setAiResults(prev => ({ ...prev, [d.deal.deal_name]: { text: 'Analyzing...', loading: true } }));
                      // Context construction for AI
                      const context = {
                        roadmap: { deals: roadmap.deals },
                        taskStatus,
                        documents: [], // Optimization: Don't pass all docs if not needed, or pass filtered
                        checklist,
                        monday,
                        currentDeptView
                      };
                      const res = await runDealTool('risk_analysis', d.deal.deal_name, context);
                      setAiResults(prev => ({ ...prev, [d.deal.deal_name]: { text: res.text, loading: false } }));
                    }}
                    className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 transition-colors"
                  >
                    Analyze Risk (AI)
                  </button>
                  {aiResults[d.deal.deal_name] && (
                    <div className="mt-2 p-2 bg-indigo-50 rounded text-xs text-indigo-800 whitespace-pre-wrap">
                      {aiResults[d.deal.deal_name].text}
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
