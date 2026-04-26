"use client";

import React, { useState } from 'react';
import { Search, SlidersHorizontal, Info, ShieldCheck, ShieldAlert, FileText, Activity, Loader2, ThumbsUp, ThumbsDown, Image as ImageIcon, X } from 'lucide-react';

export default function ChatDashboard() {
  const [query, setQuery] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRagMode, setIsRagMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Structured Chat History mapping state representations strictly
  const [history, setHistory] = useState<Array<any>>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleFeedback = async (index: number, label: 'correct' | 'incorrect') => {
    const interaction = history[index];
    if (interaction.feedback) return; // Prevent double feedback

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${API_BASE_URL}/api/chat/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: interaction.query,
          response: interaction.rag_response,
          label: label,
          retrievedChunks: interaction.retrieved_chunks
        })
      });

      if (res.ok) {
        const newHistory = [...history];
        newHistory[index].feedback = label;
        setHistory(newHistory);
      }
    } catch (err) {
      console.error("Feedback submission failed:", err);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() && !image) return;

    setIsLoading(true);
    setError(null);
    
    const currentQuery = query;
    const currentImage = image;
    
    setQuery('');
    removeImage();

    try {
      const formData = new FormData();
      if (currentQuery) formData.append('query', currentQuery);
      if (currentImage) formData.append('image', currentImage);

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${API_BASE_URL}/api/chat/compare`, {
        method: 'POST',
        body: formData
      });

      const json = await res.json();
      
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to extract response pipeline');
      }

      setHistory(prev => [...prev, { query: currentQuery, ...json.data }]);
    } catch (err: any) {
      setError(err.message || "An unknown system error occurred routing the API matrix.");
    } finally {
      setIsLoading(false);
    }
  };

  const latestInteraction = history.length > 0 ? history[history.length - 1] : null;

  return (
    <div className="flex-1 flex w-full h-[calc(100vh-73px)]">
      
      {/* LEFT PANEL: Document Context */}
      <aside className="w-72 border-r bg-background/80 flex-col overflow-hidden hidden lg:flex relative z-10">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-semibold text-sm">Indexed Knowledge</h3>
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm text-center text-muted-foreground pt-10">
           <FileText className="w-10 h-10 mx-auto opacity-20 mb-2" />
           <p>Knowledge Base is active.</p>
           <p className="text-xs">Chunks uploaded via the Documents Pipeline map out vectors behind the scenes here.</p>
        </div>
      </aside>

      {/* CENTER PANEL: Generative RAG Space */}
      <main className="flex-1 flex flex-col bg-background/50 relative overflow-hidden">
        {/* Toggle Mode Banner */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-background border shadow-sm rounded-full px-1 p-1 flex items-center gap-1">
          <button 
            onClick={() => setIsRagMode(true)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all focus:outline-none ${isRagMode ? 'bg-foreground text-background shadow-sm' : 'hover:bg-muted text-muted-foreground'}`}
          >
            RAG Grounded
          </button>
          <button 
            onClick={() => setIsRagMode(false)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all focus:outline-none ${!isRagMode ? 'bg-foreground text-background shadow-sm' : 'hover:bg-muted text-muted-foreground'}`}
          >
            Standard GenAI 
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-20 flex flex-col">
            <div className="flex gap-4 w-full max-w-3xl mx-auto mt-auto flex-col space-y-6">
              
              {history.length === 0 && !isLoading && (
                <div className="text-center text-muted-foreground opacity-50 my-auto">
                   <Info className="w-10 h-10 mx-auto mb-4" />
                   <p>Query the system to observe mathematically grounded hallucination reduction.</p>
                </div>
              )}

              {history.map((interaction, idx) => {
                const displayAnswer = isRagMode ? interaction.rag_response : interaction.non_rag_response;
                const isRagFallback = interaction.rag_response.includes("No reliable information found");

                return (
                  <React.Fragment key={idx}>
                    <div className="flex items-start gap-3 w-full">
                       <div className="w-8 h-8 rounded shrink-0 bg-muted flex items-center justify-center font-bold text-xs uppercase text-muted-foreground">U</div>
                       <p className="text-sm bg-background p-4 rounded-xl border shadow-sm w-full whitespace-pre-wrap">{interaction.query}</p>
                    </div>
                    
                     <div className="flex items-start gap-3 w-full">
                        <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center text-background font-bold text-xs transition-colors duration-500 ${isRagMode ? 'bg-foreground' : 'bg-orange-500'}`}>AI</div>
                        <div className={`text-sm p-5 rounded-xl border shadow-sm flex-1 leading-relaxed transition-all duration-500 group relative ${isRagMode ? 'bg-background border-border' : 'bg-orange-500/5 border-orange-500/30'}`}>
                          
                          {isRagMode && isRagFallback ? (
                            <div className="mb-4">
                              <p className="font-mono text-xs text-yellow-600 dark:text-yellow-500 uppercase tracking-widest font-semibold mb-2">System Override Triggered</p>
                              <p className="opacity-80">{displayAnswer}</p>
                            </div>
                          ) : (
                            <p className="mb-4 whitespace-pre-wrap leading-loose">{displayAnswer}</p>
                          )}
                          
                          <div className="pt-3 border-t flex items-center justify-between text-xs mt-4">
                            {isRagMode ? (
                              <div className="flex flex-col gap-2 w-full">
                                <div className="flex items-center justify-between">
                                  <span className={`flex items-center gap-1.5 font-semibold ${isRagFallback ? 'text-yellow-600 dark:text-yellow-500' : 'text-green-600 dark:text-green-500'}`}>
                                    {isRagFallback ? <ShieldAlert className="w-4 h-4"/> : <ShieldCheck className="w-4 h-4"/>} 
                                    {isRagFallback ? 'Hardware Fallback Limit Executed' : 'Grounding Trace Active & Validated'}
                                  </span>
                                  
                                  {!isRagFallback && interaction.confidence_score !== undefined && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Confidence</span>
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                                          <div 
                                            className={`h-full transition-all duration-1000 ${interaction.confidence_score > 80 ? 'bg-green-500' : interaction.confidence_score > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                            style={{ width: `${interaction.confidence_score}%` }}
                                          />
                                        </div>
                                        <span className={`font-mono font-bold ${interaction.confidence_score > 80 ? 'text-green-500' : interaction.confidence_score > 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                                          {interaction.confidence_score}%
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="flex items-center gap-1.5 font-semibold text-orange-600 dark:text-orange-500">
                                <ShieldAlert className="w-4 h-4"/> Ungrounded Neural Extrapolation (High Hallucination Risk)
                              </span>
                            )}

                            {/* Feedback System UI */}
                            {isRagMode && !isRagFallback && (
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => handleFeedback(idx, 'correct')}
                                  className={`p-1.5 rounded-md hover:bg-muted transition-colors ${interaction.feedback === 'correct' ? 'text-green-500 bg-green-500/10' : 'text-muted-foreground'}`}
                                  title="Correct Answer"
                                >
                                  <ThumbsUp className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleFeedback(idx, 'incorrect')}
                                  className={`p-1.5 rounded-md hover:bg-muted transition-colors ${interaction.feedback === 'incorrect' ? 'text-red-500 bg-red-500/10' : 'text-muted-foreground'}`}
                                  title="Incorrect Answer"
                                >
                                  <ThumbsDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                     </div>
                  </React.Fragment>
                );
              })}

              {isLoading && (
                 <div className="flex items-start gap-3 w-full animate-pulse">
                    <div className="w-8 h-8 rounded shrink-0 bg-foreground flex items-center justify-center text-background font-bold text-xs">AI</div>
                    <div className="text-sm p-5 rounded-xl border bg-background shadow-sm flex-1 flex items-center gap-3">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> <span className="text-muted-foreground font-mono">Routing matrices via embedding threshold filter...</span>
                    </div>
                 </div>
              )}

              {error && (
                 <div className="p-4 border border-red-500/50 bg-red-500/10 text-red-500 rounded-xl text-sm font-semibold flex items-center gap-2">
                   <ShieldAlert className="w-4 h-4" /> System Trace Failed: {error}
                 </div>
              )}

            </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-background/80 border-t backdrop-blur-md pb-6 relative z-20">
          <div className="max-w-3xl mx-auto space-y-4">
            
            {/* Image Preview Area */}
            {imagePreview && (
              <div className="flex items-center gap-3 p-2 bg-muted/50 border rounded-xl w-fit relative animate-in fade-in slide-in-from-bottom-2">
                <img src={imagePreview} alt="Preview" className="w-12 h-12 object-cover rounded-lg border" />
                <div className="pr-8">
                  <p className="text-[10px] font-bold uppercase opacity-50">Diagram Attached</p>
                  <p className="text-xs truncate max-w-[150px]">{image?.name}</p>
                </div>
                <button 
                  onClick={removeImage}
                  className="absolute right-2 top-2 p-1 hover:bg-background rounded-full transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <form className="relative flex items-center gap-2" onSubmit={handleSearch}>
              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={isLoading}
                  placeholder={image ? "Describe what to find in this diagram..." : "Ask the knowledge base..."}
                  className="w-full bg-background border shadow-sm rounded-xl py-4 pl-4 pr-12 focus:outline-none focus:ring-1 focus:ring-foreground font-medium text-sm transition-all text-foreground disabled:opacity-50"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <label className="p-2 hover:bg-muted rounded-lg cursor-pointer transition-colors text-muted-foreground">
                    <ImageIcon className="w-4 h-4" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isLoading || (!query.trim() && !image)}
                className="p-4 bg-foreground text-background rounded-xl hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
              >
                <Search className="w-5 h-5" />
              </button>
            </form>
          </div>
          <p className="text-center text-[10px] text-muted-foreground mt-4 uppercase tracking-widest font-semibold flex items-center justify-center gap-2">
           <Info className="w-3 h-3"/> OCR Engine enabled for diagram-based question analysis
          </p>
        </div>
      </main>

      {/* RIGHT PANEL: Transparency Payload / Explainability Engine */}
      <aside className="w-96 border-l bg-background/80 flex-col hidden xl:flex relative z-10 max-h-screen">
        <div className="p-4 border-b shrink-0 flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
             <Activity className="w-4 h-4 text-primary" /> Reasoning Trace
          </h3>
          <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded opacity-50 uppercase tracking-tighter">Live Debug</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-8">
          {!latestInteraction ? (
            <div className="text-center text-muted-foreground text-xs pt-20 opacity-50 px-8">
              <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 opacity-40" />
              </div>
              <p className="font-medium text-sm text-foreground/70 mb-1">Waiting for Query</p>
              <p>Execute a search to observe the semantic grounding logic and retrieval weights.</p>
            </div>
          ) : (
            <>
              {/* Core Execution Metrics */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Execution Metrics</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 border rounded-xl bg-muted/20">
                    <p className="text-[9px] uppercase font-bold opacity-50 mb-1">Latency</p>
                    <p className="text-lg font-mono font-bold">{latestInteraction.metadata?.retrievalTimeMs || 0}<span className="text-[10px] font-sans ml-0.5">ms</span></p>
                  </div>
                  <div className="p-3 border rounded-xl bg-muted/20">
                    <p className="text-[9px] uppercase font-bold opacity-50 mb-1">Confidence</p>
                    <p className={`text-lg font-mono font-bold ${latestInteraction.confidence_score > 80 ? 'text-green-500' : 'text-yellow-500'}`}>{latestInteraction.confidence_score || 0}%</p>
                  </div>
                </div>
              </div>
              
              {/* Reasoning Engine */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Retrieval Logic</h4>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded">
                    <ShieldCheck className="w-3 h-3" /> Grounded
                  </div>
                </div>

                <div className="space-y-4">
                  {latestInteraction.retrieved_chunks && latestInteraction.retrieved_chunks.map((chunk: any, idx: number) => {
                    const simInfo = latestInteraction.scores?.find((s: any) => s.chunkId === chunk.chunkId);
                    const scorePerc = simInfo ? Math.round(simInfo.similarity * 100) : 0;
                    
                    // Determine reasoning based on score and presence
                    const reason = scorePerc > 90 ? "Critical Evidence Match" : scorePerc > 75 ? "High Semantic Relevancy" : "Supporting Context";
                    
                    return (
                      <div key={idx} className="group relative">
                        <div className="absolute -left-2 top-0 bottom-0 w-0.5 bg-border group-hover:bg-primary transition-colors" />
                        
                        <div className="pl-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-primary flex items-center gap-1">
                               Chunk #{idx + 1}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {scorePerc}% Match
                              </span>
                            </div>
                          </div>

                          <div className="p-3 border rounded-xl bg-background shadow-sm group-hover:border-primary/30 transition-all">
                            <div className="flex items-start gap-2 mb-2">
                              <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${scorePerc > 85 ? 'bg-green-500' : 'bg-yellow-500'}`} />
                              <p className="text-[10px] font-bold text-foreground/80 leading-none">{reason}</p>
                            </div>
                            
                            <p className="text-xs leading-relaxed text-muted-foreground/90 italic line-clamp-4">
                              "{chunk.text}"
                            </p>

                            <div className="mt-3 pt-2 border-t flex items-center justify-between text-[9px] font-bold uppercase tracking-tighter opacity-40">
                              <span className="truncate max-w-[120px]">{chunk.documentId || "External Knowledge"}</span>
                              <span>Source Offset: {idx}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Explainability Summary */}
              <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                 <h5 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                   <Info className="w-3.5 h-3.5" /> Explainability Note
                 </h5>
                 <p className="text-[11px] text-primary/80 leading-relaxed">
                   The system used <strong>{latestInteraction.retrieved_chunks?.length || 0} document chunks</strong> to synthesize this response. 
                   Segments were selected based on high semantic alignment with your query vectors, filtered through a 70% similarity threshold.
                 </p>
              </div>
            </>
          )}

        </div>
      </aside>
    </div>
  );
}
