import React from 'react';
import { useData } from '../contexts/DataContext';
import { ClipboardList, AlertTriangle } from 'lucide-react';

const Integration: React.FC = () => {
  const { checklist, roadmap } = useData();
  
  const integrationDeals = roadmap.deals.filter(d => 
    d.status === 'Closing' || d.status === 'Integration' || d.status === 'Diligence'
  );

  return (
    <div className="space-y-6">
       <header className="mb-6">
        <h1 className="text-3xl font-bold text-[#006747]">Integration Planning</h1>
        <p className="text-gray-600">Standardized Ops workflows for upcoming sites.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-[#006747] flex items-center gap-2">
             <ClipboardList /> Standard Links Checklist
          </h2>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#006747] text-white">
                <tr>
                  <th className="px-4 py-3 font-semibold">Priority</th>
                  <th className="px-4 py-3 font-semibold">Task</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                </tr>
              </thead>
              <tbody>
                {checklist.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        item.priority === 'High' ? 'bg-red-100 text-red-700' : 
                        item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{item.task}</td>
                    <td className="px-4 py-3 text-gray-500">{item.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
           <h2 className="text-xl font-bold text-[#006747] mb-4 flex items-center gap-2">
             <AlertTriangle className="text-[#F4A024]" /> Active Transitions
          </h2>
          <div className="space-y-4">
            {integrationDeals.map((deal, idx) => (
              <div key={idx} className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-[#006747]">{deal.deal_name}</h3>
                  <span className="text-xs font-medium px-2 py-1 bg-[#006747] text-white rounded">
                    {deal.status}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                    <span>Target Date: <span className="font-semibold">{deal.closing_date}</span></span>
                  </div>
                   <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 rounded-full bg-[#F4A024]"></div>
                    <span>Pending: DRB Controller Setup</span>
                  </div>
                   <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 rounded-full bg-[#F4A024]"></div>
                    <span>Pending: Utility Transfer</span>
                  </div>
                </div>
                <button className="mt-4 w-full text-center py-2 border border-[#006747] rounded text-sm font-medium hover:bg-green-50 text-[#006747] transition-colors">
                  Generate Integration Plan
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Integration;
