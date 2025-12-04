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
  const { documents, taskStatus, roadmap } = useData();
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<Message[]>([
    { role: 'ai', content: "Hello. I am LINKS Transaction AI. Accessing document vault... Ready. Ask me about PSAs, ESAs, Title Commitments, or Financials." }
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

    // Pass the current context data to the AI service
    const response = await queryTransactionAI(userMsg.content, {
      documents,
      taskStatus,
      roadmap
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
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="p-4 bg-[#0B3B2E] text-white flex items-center gap-2">
        <Search className="text-[#F4A024]" />
        <h2 className="font-bold">Deal Intelligence & Document Search</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
        {history.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-4 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-[#00A86B] text-white rounded-br-none' 
                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
            }`}>
              {msg.role === 'ai' && (
                <div className="flex items-center gap-2 mb-2 text-[#0B3B2E] font-bold text-xs uppercase tracking-wider">
                  <Bot className="w-4 h-4" /> Transaction AI
                </div>
              )}
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {msg.content}
              </div>

              {msg.evidence && msg.evidence.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Verified Evidence:</p>
                  <div className="space-y-2">
                    {msg.evidence.map((doc, i) => (
                      <div key={i} className="flex gap-3 bg-gray-50 p-2 rounded border border-gray-200">
                        <FileText className="w-8 h-8 text-[#0B3B2E] flex-shrink-0" />
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-[#0B3B2E] truncate" title={doc.filename}>{doc.filename}</p>
                          <p className="text-xs text-gray-500 truncate">{doc.deal || 'Unknown Deal'}</p>
                          <p className="text-xs text-gray-600 mt-1 italic line-clamp-2">"{doc.text_snippet}"</p>
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
            <div className="bg-white p-4 rounded-lg rounded-bl-none shadow-sm border border-gray-200 flex items-center gap-2">
              <div className="w-2 h-2 bg-[#0B3B2E] rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-[#00A86B] rounded-full animate-bounce delay-75" />
              <div className="w-2 h-2 bg-[#F4A024] rounded-full animate-bounce delay-150" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-white border-t">
        <div className="relative">
          <input 
            type="text" 
            className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A86B] focus:border-transparent outline-none text-sm"
            placeholder="Ask about purchase prices, environmental reports, or closing dates..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button 
            onClick={handleSearch}
            disabled={loading}
            className="absolute right-2 top-2 p-1.5 bg-[#0B3B2E] text-white rounded hover:bg-[#00A86B] transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-center text-gray-400 mt-2">
          AI may hallucinate. Verify all critical data against original documents.
        </p>
      </div>
    </div>
  );
};

export default DocumentChat;