import React from 'react';
import { useData } from '../contexts/DataContext';
import { TaskStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, CheckCircle2, CircleDollarSign, Building2, WifiOff } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { roadmap, monday, taskStatus, usingFallback, refreshData } = useData();

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
      name: deal.deal_name.split(' ').slice(0, 2).join(' '), // Shorten name
      Completed: completed, 
      Remaining: remaining
    };
  });

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-[#0B3B2E]">Portfolio Dashboard</h1>
        <p className="text-gray-600">Real-time acquisition velocity and pipeline health.</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-[#0B3B2E]">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 font-medium">Active Deals</p>
              <h3 className="text-3xl font-bold text-[#0B3B2E]">{totalDeals}</h3>
            </div>
            <Building2 className="text-[#F4A024] w-8 h-8" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-[#00A86B]">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 font-medium">Sites (Active DD)</p>
              <h3 className="text-3xl font-bold text-[#0B3B2E]">{sitesUnderContract}</h3>
            </div>
            <CircleDollarSign className="text-[#00A86B] w-8 h-8" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-[#F4A024]">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 font-medium">Open Tasks</p>
              <h3 className="text-3xl font-bold text-[#0B3B2E]">{criticalPathTasks}</h3>
            </div>
            <AlertCircle className="text-[#F4A024] w-8 h-8" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-gray-800">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 font-medium">Next Closing</p>
              <h3 className="text-lg font-bold text-[#0B3B2E] truncate w-32" title={closingSoon}>{closingSoon || 'None'}</h3>
            </div>
            <CheckCircle2 className="text-gray-800 w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm lg:col-span-2">
          <h2 className="text-xl font-bold text-[#0B3B2E] mb-4">Task Completion by Deal</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dealStatusData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#4B5563" />
                <YAxis stroke="#4B5563" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B3B2E', color: '#fff', border: 'none', borderRadius: '4px' }}
                  itemStyle={{ color: '#F4A024' }}
                />
                <Legend />
                <Bar dataKey="Completed" stackId="a" fill="#00A86B" radius={[0, 0, 4, 4]} />
                <Bar dataKey="Remaining" stackId="a" fill="#0B3B2E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Feed */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-bold text-[#0B3B2E] mb-4">Critical Blockers</h2>
          <div className="space-y-4">
            {(Object.entries(taskStatus) as [string, TaskStatus][])
              .filter(([, val]) => val.status === 'In Progress' || val.status === 'Blocked')
              .slice(0, 5)
              .map(([key, val], idx) => {
                const [deal, phase, task] = key.split('_');
                return (
                  <div key={idx} className="p-3 bg-gray-50 rounded border-l-2 border-[#F4A024]">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-[#0B3B2E] uppercase">{phase}</span>
                      <span className="text-xs text-gray-500">{val.date}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 mt-1">{task}</p>
                    <p className="text-xs text-gray-600 mt-1 truncate">{deal}</p>
                  </div>
                );
              })}
          </div>
          <button className="w-full mt-4 py-2 text-sm font-medium text-[#00A86B] border border-[#00A86B] rounded hover:bg-[#00A86B] hover:text-white transition-colors">
            View All Tasks
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
