import React, { useState, useEffect, useRef } from 'react';

// Sub-component for the Ward Status Badge
const WardBadge = ({ ward }) => {
  const colors = {
    "Emergency": "bg-red-600 border-red-700 shadow-red-100",
    "Mental Health": "bg-purple-600 border-purple-700 shadow-purple-100",
    "General": "bg-blue-600 border-blue-700 shadow-blue-100"
  };

  return ward ? (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] uppercase font-bold text-slate-400 ml-1">Assigned Ward</p>
      <span className={`${colors[ward] || 'bg-gray-500'} text-white px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border-b-2 shadow-lg transition-all`}>
        {ward}
      </span>
    </div>
  ) : null;
};

export default function App() {
  // --- 1. SESSION MANAGEMENT (Invisible to User) ---
  const generateId = () => "sid_" + Math.random().toString(36).substr(2, 9);
  const [sessionId, setSessionId] = useState(generateId());
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState({ 
    name: "", 
    age: "", 
    query: "", 
    ward: "", 
    complete: false 
  });

  const scrollRef = useRef(null);

  const startNewPatient = () => {
    setSessionId(generateId());
    setMessages([]);
    setInput("");
    setSummary({ 
      name: "", 
      age: "", 
      query: "", 
      ward: "", 
      complete: false 
    });
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const send = async () => {
    if (!input.trim() || summary.complete) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: currentInput, 
          session_id: sessionId 
        })
      });
      
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);

      if (data.patient_summary || data.ward) {
        setSummary(prev => ({
          ...prev,
          name: data.patient_summary?.name || prev.name,
          age: data.patient_summary?.age || prev.age,
          query: data.patient_summary?.query || prev.query,
          ward: data.ward || prev.ward,
          complete: data.complete || false
        }));
      }
    } catch (error) {
      console.error("Connection Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Error connecting to hospital server." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex flex-col md:flex-row gap-6 font-sans">
      {/* Sidebar: Patient Information Card */}
      <div className="w-full md:w-80 bg-white p-6 rounded-3xl shadow-xl h-fit border border-slate-200 sticky top-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-3 h-8 bg-blue-600 rounded-full"></div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Patient Record</h2>
            {/* SESSION ID REMOVED FROM HERE */}
          </div>
        </div>
        
        <div className="space-y-6">
          <WardBadge ward={summary.ward} />
          
          <div className="space-y-3">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Full Name</p>
              <p className="text-slate-800 font-bold text-lg">{summary.name || "---"}</p>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Patient Age</p>
              <p className="text-slate-800 font-bold text-lg">{summary.age || "---"}</p>
            </div>
            
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <p className="text-[10px] uppercase font-bold text-blue-400 mb-1">Initial Complaint</p>
              <p className="text-blue-900 italic text-sm leading-relaxed">
                {summary.query || "Waiting for details..."}
              </p>
            </div>
          </div>
          
          {summary.complete ? (
            <button 
              onClick={startNewPatient}
              className="w-full bg-blue-600 text-white p-4 rounded-xl text-center shadow-lg hover:bg-blue-700 transition-all font-bold uppercase text-xs tracking-widest animate-in fade-in zoom-in"
            >
              + Register New Patient
            </button>
          ) : (
            <div className="bg-green-50 border border-green-100 text-green-700 p-4 rounded-xl text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest">Ongoing Triage...</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 bg-white rounded-3xl shadow-2xl flex flex-col h-[85vh] overflow-hidden border border-slate-200">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center shadow-2xl mb-6">
                 <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                 </svg>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">Hospital Triage AI</h3>
              <p className="text-slate-500 max-w-sm mb-8">Ready to assist with your patient check-in.</p>
              
              <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl max-w-sm text-left shadow-sm">
                <p className="text-[10px] font-bold text-blue-500 uppercase mb-2 tracking-widest">Recommended Format:</p>
                <p className="text-sm text-blue-800 leading-relaxed italic mb-4">
                  "I am [Name], [Age] years old, and I have [Symptoms]."
                </p>
                <button 
                  onClick={() => setInput("I am Bhanu Prasad, 21 years old, and I have a high fever.")}
                  className="text-[10px] bg-white text-blue-600 px-3 py-1.5 rounded-lg border border-blue-200 font-bold hover:bg-blue-100 transition-all"
                >
                  💡 Use Sample Prompt
                </button>
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'}`}>
                  <p className="text-sm leading-relaxed">{m.content}</p>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-full text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                AI is processing...
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-white border-t border-slate-100">
          <div className="flex gap-3">
            <input 
              disabled={summary.complete || isLoading}
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && send()} 
              placeholder={summary.complete ? "Check-in Finished. Click 'New Patient'." : "Type patient details here..."} 
              className="flex-1 px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all disabled:bg-slate-50 disabled:cursor-not-allowed" 
            />
            <button 
              onClick={send} 
              disabled={isLoading || summary.complete} 
              className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:bg-slate-400"
            >
              {summary.complete ? 'VERIFIED' : 'SEND'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}