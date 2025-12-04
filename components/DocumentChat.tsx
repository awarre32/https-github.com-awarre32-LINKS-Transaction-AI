import React, { useState, useRef, useEffect } from 'react';
import { queryTransactionAI } from '../services/geminiService';
import { useData } from '../contexts/DataContext';
import { Send, FileText, Search, Bot } from 'lucide-react';
import { DocumentData } from '../types';

interface Message {
  role: 'user' | 'ai';
  content: string;
  evidence?: DocumentData[];
}

const DocumentChat: React.FC = () => {
  const { documents, taskStatus, roadmap, checklist, monday } = useData();
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<Message[]>([
    { role: 'ai', content: "LINKS Transaction AI Online.\n\nI can analyze PSAs, track diligence tasks, check site status, or build integration checklists.\n\nHow can I assist with the portfolio today?" }
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    const userMsg: Message = { role: 'user', content: query };
    setHistory(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    // Pass the FULL context data to the AI service
    const response = await queryTransactionAI(userMsg.content, {
      documents,
      taskStatus,
      roadmap,
      checklist,
      monday
    });
    
    setHistory(prev => [...prev, {
      role: 'ai',
      content: response.text,
      evidence: response.evidence
    }]);
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 bg-[#052e22] text-white flex items-center gap-3 shadow-sm z-10 border-b border-[#006747]">
        <div className="bg-white/10 p-1.5 rounded-lg border border-white/20">
           <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
           <h2 className="font-bold text-sm md:text-base">LINKS Transaction AI</h2>
           <p className="text-[10px] md:text-xs text-green-100 opacity-80">Acquisitions • Diligence • Integration</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-[#F5F7FA]">
        {history.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] md:max-w-[80%] rounded-lg p-4 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-[#006747] text-white rounded-br-none' 
                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
            }`}>
              <div className="whitespace-pre-wrap text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-headings:text-[#006747] prose-ul:my-1 prose-li:my-0">
                {msg.content}
              </div>

              {msg.evidence && msg.evidence.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-1">
                    <Search className="w-3 h-3" />
                    Verified Sources
                  </p>
                  <div className="space-y-2">
                    {msg.evidence.map((doc, i) => (
                      <div key={i} className="flex gap-3 bg-gray-50 p-2 rounded border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                        <FileText className="w-8 h-8 text-[#006747] flex-shrink-0 opacity-80" />
                        <div className="overflow-hidden min-w-0">
                          <p className="text-xs font-bold text-[#006747] truncate" title={doc.filename}>{doc.filename}</p>
                          <div className="flex gap-2 text-[10px] text-gray-500 mt-0.5">
                             <span className="bg-white border border-gray-200 px-1.5 rounded text-gray-700">{doc.type || 'DOC'}</span>
                             <span className="truncate">{doc.deal || 'Unassigned'}</span>
                          </div>
                          <p className="text-[10px] text-gray-600 mt-1 italic line-clamp-1">"{doc.text_snippet}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-lg rounded-bl-none shadow-sm border border-gray-200 flex items-center gap-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-[#006747] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-[#006747] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-[#006747] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-gray-500 font-medium">Analyzing pipeline data...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <div className="relative max-w-4xl mx-auto">
          <input 
            type="text" 
            className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006747] focus:border-transparent outline-none text-sm transition-all text-gray-800 placeholder-gray-400"
            placeholder="Ask about closing dates, missing ESAs, integration tasks, or site status..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button 
            onClick={handleSearch}
            disabled={loading}
            className="absolute right-2 top-2 p-1.5 bg-[#006747] text-white rounded hover:bg-[#052e22] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-center text-gray-400 mt-2">
          LINKS Transaction AI v2.0 • Accessing 5 Live Datasets • Verify critical info in VDR.
        </p>
      </div>
    </div>
  );
};

export default DocumentChat;
