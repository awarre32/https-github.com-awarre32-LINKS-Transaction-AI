import React from 'react';
import { useData } from '../contexts/DataContext';
import { MapPin, Calendar } from 'lucide-react';
import { MondayItem, TaskStatus } from '../types';

const SiteList: React.FC = () => {
  const { monday, taskStatus, currentDeptView } = useData();

  // Group sites by Deal
  const groupedSites: Record<string, MondayItem[]> = {};
  
  monday.forEach(site => {
    const deal = site.deal_association || "Unassigned";
    if (!groupedSites[deal]) groupedSites[deal] = [];
    groupedSites[deal].push(site);
  });

  const countOpenTasksForDeal = (dealName: string) => {
    const entries = Object.entries(taskStatus) as [string, TaskStatus][];
    return entries.filter(([key, val]) => {
      const deal = key.split('_')[0];
      if (deal !== dealName) return false;
      if (val.status === 'Completed') return false;
      if (currentDeptView !== 'All' && (val.department || 'Other') !== currentDeptView) return false;
      return true;
    }).length;
  };

  return (
    <div className="space-y-6">
       <header className="mb-6">
        <h1 className="text-3xl font-bold text-[#006747]">Site Profiles</h1>
        <p className="text-gray-600">Individual site tracking and Monday.com mappings.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(groupedSites).map(([dealName, sites]) => (
          <div key={dealName} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[#006747]">{dealName}</h3>
                {currentDeptView !== 'All' && (
                  <span className="text-[11px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {countOpenTasksForDeal(dealName)} open for {currentDeptView}
                  </span>
                )}
              </div>
              <span className="text-xs bg-white px-2 py-1 rounded border border-gray-200 font-medium text-gray-600">
                {sites.length} Sites
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {sites.map((site, idx) => (
                <div key={idx} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <MapPin className="text-[#006747] w-5 h-5 mt-1 opacity-80" />
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">{site.task}</h4>
                      <div className="flex items-center gap-4 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          site.status === 'Integrated' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {site.status}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                           <Calendar className="w-3 h-3" />
                           {site.date}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SiteList;
