import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { ParsedTask, TaskStatus } from '../types';
import { Filter, CheckCircle, Clock } from 'lucide-react';

const TaskBoard: React.FC = () => {
  const { taskStatus, roadmap } = useData();
  const [selectedDeal, setSelectedDeal] = useState<string>('All');

  // Parse tasks
  const allTasks: ParsedTask[] = (Object.entries(taskStatus) as [string, TaskStatus][]).map(([key, val]) => {
    const parts = key.split('_');
    // Standard: Deal Name_Phase_Task Name
    // Fallback if split doesn't produce enough parts (though unlikely with controlled data)
    const deal_name = parts[0] || 'Unknown Deal';
    const phase_code = parts[1] || 'Misc';
    const task_name = parts.slice(2).join('_') || key;
    
    return {
      deal_name,
      phase_code,
      task_name,
      status: val.status,
      date: val.date,
      notes: val.notes,
      original_key: key
    };
  });

  const filteredTasks = selectedDeal === 'All' 
    ? allTasks 
    : allTasks.filter(t => t.deal_name === selectedDeal);

  // Group by Phase
  const phases = ['R-1', 'R-2', 'R-3', 'R-4', 'R-Closing', 'CHK', 'Ops'];
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Completed': return 'text-[#006747] bg-green-50';
      case 'In Progress': return 'text-[#F4A024] bg-orange-50';
      case 'Not Started': return 'text-gray-400 bg-gray-50';
      default: return 'text-red-500 bg-red-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Completed': return <CheckCircle className="w-4 h-4" />;
      case 'In Progress': return <Clock className="w-4 h-4" />;
      default: return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#006747]">Diligence & Operations</h1>
          <p className="text-gray-600">Track milestones from PSA to Integration.</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-white p-2 rounded shadow-sm border border-gray-100">
          <Filter className="w-5 h-5 text-gray-500" />
          <select 
            className="bg-transparent text-sm font-medium focus:outline-none text-[#006747]"
            value={selectedDeal}
            onChange={(e) => setSelectedDeal(e.target.value)}
          >
            <option value="All">All Deals</option>
            {roadmap.deals.map(d => (
              <option key={d.deal_name} value={d.deal_name}>{d.deal_name}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-x-auto pb-4">
        {phases.map(phase => {
            const phaseTasks = filteredTasks.filter(t => t.phase_code === phase || (phase === 'Ops' && t.phase_code.startsWith('Ops')));
            
            return (
              <div key={phase} className="min-w-[300px] bg-white rounded-lg shadow-sm flex flex-col h-full border-t-4 border-[#006747]">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-bold text-[#006747] text-lg">{phase} Phase</h3>
                  <div className="text-xs text-gray-500 mt-1 flex justify-between">
                    <span>{phaseTasks.length} Tasks</span>
                    <span>{phaseTasks.filter(t => t.status === 'Completed').length} Done</span>
                  </div>
                </div>
                
                <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[600px]">
                  {phaseTasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 italic text-sm">No tasks tracked</div>
                  ) : (
                    phaseTasks.map((task, idx) => (
                      <div key={idx} className="bg-white border border-gray-100 rounded p-3 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 font-medium ${getStatusColor(task.status)}`}>
                            {getStatusIcon(task.status)}
                            {task.status}
                          </span>
                          {task.date && <span className="text-xs text-gray-500">{task.date}</span>}
                        </div>
                        <p className="text-sm font-medium text-gray-800 leading-tight mb-2">{task.task_name}</p>
                        {selectedDeal === 'All' && (
                          <p className="text-xs text-[#006747] font-medium bg-gray-100 inline-block px-1 rounded">{task.deal_name}</p>
                        )}
                        {task.notes && (
                          <div className="mt-2 text-xs text-gray-500 italic border-l-2 border-[#F4A024] pl-2">
                            "{task.notes}"
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
        })}
      </div>
    </div>
  );
};

export default TaskBoard;
