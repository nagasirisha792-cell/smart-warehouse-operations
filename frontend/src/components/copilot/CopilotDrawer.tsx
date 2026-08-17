import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User as UserIcon, Sparkles, RefreshCw, Zap } from 'lucide-react';
import { apiService } from '../../api/client';
import type { CopilotResponse } from '../../types';

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  actions?: string[];
  severity?: string;
  timestamp: string;
}

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: "👋 Hi! I'm **WareMind Copilot**, your operational AI assistant.\n\nAsk me anything about warehouse operations, SLA risks, stockouts, bottlenecks, or order allocation!",
      actions: ['Which orders are at risk today?', 'Which products need reordering?', 'What is the current bottleneck?'],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const res: CopilotResponse = await apiService.queryCopilot(textToSend);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: res.answer,
        actions: res.actions,
        severity: res.severity,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: '⚠️ Sorry, I encountered an error querying the decision engine.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0d1320] border-l border-[rgba(59,130,246,0.25)] shadow-2xl z-50 flex flex-col animate-slide-in">
      {/* Header */}
      <div className="p-4 border-b border-[rgba(59,130,246,0.15)] flex items-center justify-between bg-[#0f1523]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              WareMind Copilot
              <span className="text-[10px] bg-blue-500/20 text-blue-300 font-extrabold px-1.5 py-0.5 rounded border border-blue-500/30">
                ACTIVE
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Rule-Based Operational AI Assistant</p>
          </div>
        </div>
        <button onClick={onClose} className="btn-icon">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400 font-semibold">
              {m.sender === 'ai' ? (
                <>
                  <Bot className="w-3 h-3 text-blue-400" />
                  <span>WareMind AI</span>
                </>
              ) : (
                <>
                  <UserIcon className="w-3 h-3 text-emerald-400" />
                  <span>Operator</span>
                </>
              )}
              <span>•</span>
              <span>{m.timestamp}</span>
            </div>

            <div className={m.sender === 'user' ? 'copilot-bubble-user' : 'copilot-bubble-ai'}>
              <div className="whitespace-pre-wrap leading-relaxed">
                {m.text}
              </div>

              {m.actions && m.actions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800 space-y-1.5">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Suggested Queries:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {m.actions.map((act, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(act)}
                        className="text-[11px] bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-1.5 rounded-xl font-semibold transition-all text-left cursor-pointer"
                      >
                        ⚡ {act}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 p-2 font-semibold">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
            <span>Analyzing warehouse live state...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div className="px-3 py-2 border-t border-[rgba(59,130,246,0.15)] bg-[#0f1523] flex gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
        <button
          onClick={() => handleSend('Which orders are at risk today?')}
          className="whitespace-nowrap bg-[#162035] hover:bg-slate-800 text-slate-300 px-3 py-1 rounded-lg border border-slate-800 font-semibold cursor-pointer"
        >
          At-risk orders
        </button>
        <button
          onClick={() => handleSend('Which SKUs need reordering?')}
          className="whitespace-nowrap bg-[#162035] hover:bg-slate-800 text-slate-300 px-3 py-1 rounded-lg border border-slate-800 font-semibold cursor-pointer"
        >
          Reorder list
        </button>
        <button
          onClick={() => handleSend('What is the current bottleneck?')}
          className="whitespace-nowrap bg-[#162035] hover:bg-slate-800 text-slate-300 px-3 py-1 rounded-lg border border-slate-800 font-semibold cursor-pointer"
        >
          Bottlenecks
        </button>
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-[rgba(59,130,246,0.15)] bg-[#0d1320]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Copilot (e.g. 'Status of ORD-1001')..."
            className="input flex-1 py-2 text-xs"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="btn-primary px-3 py-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
