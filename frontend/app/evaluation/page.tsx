"use client";

import React, { useState } from 'react';
import { 
  Upload, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  BarChart3, 
  ArrowRight, 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  Loader2,
  Database,
  Brain,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EvaluationDashboard() {
  const [testCases, setTestCases] = useState<any[]>([
    { question: "What are the components of the end-sem project evaluation?", expected_answer: "The evaluation includes project implementation, documentation, and a final presentation or viva." },
    { question: "How is the project implementation graded?", expected_answer: "It is graded based on functionality, code quality, and the use of relevant technologies." }
  ]);
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          setTestCases(json);
        } else {
          setError("Invalid JSON format. Expected an array of objects.");
        }
      } catch (err) {
        setError("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const runEvaluation = async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${API_BASE_URL}/api/evaluation/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testCases })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Evaluation failed');

      setResults(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const ScoreBar = ({ value, label, color }: { value: number, label: string, color: string }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold opacity-60">
        <span>{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col w-full max-w-7xl mx-auto p-6 md:p-10 space-y-8 overflow-y-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Evaluation Engine</h1>
          <p className="text-muted-foreground mt-1">Benchmark RAG performance against ground truth datasets.</p>
        </div>
        
        <div className="flex gap-3">
          <label className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg cursor-pointer transition-colors text-sm font-medium border border-border/50">
            <Upload className="w-4 h-4" />
            Upload Dataset
            <input type="file" className="hidden" accept=".json" onChange={handleFileUpload} />
          </label>
          <button 
            onClick={runEvaluation}
            disabled={isLoading || testCases.length === 0}
            className="flex items-center gap-2 px-6 py-2 bg-foreground text-background rounded-lg hover:opacity-90 disabled:opacity-50 transition-all text-sm font-bold shadow-lg shadow-foreground/10"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            Run Benchmark
          </button>
        </div>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl flex items-center gap-3 text-sm font-medium"
        >
          <AlertCircle className="w-5 h-5" />
          {error}
        </motion.div>
      )}

      {/* Stats Overview */}
      {results && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Overall Accuracy', rag: results.aggregated_metrics.rag?.avg_overall_score ?? 0, non: results.aggregated_metrics.non_rag?.avg_overall_score ?? 0, icon: ShieldCheck, color: 'text-green-500' },
            { label: 'Avg Similarity', rag: results.aggregated_metrics.rag?.average_semantic_similarity ?? 0, non: results.aggregated_metrics.non_rag?.average_semantic_similarity ?? 0, icon: Brain, color: 'text-blue-500' },
            { label: 'Exact Match Rate', rag: results.aggregated_metrics.rag?.exact_match_rate ?? 0, non: results.aggregated_metrics.non_rag?.exact_match_rate ?? 0, icon: Search, color: 'text-purple-500' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 bg-background border border-border/50 rounded-2xl shadow-sm space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest opacity-60">{stat.label}</h3>
              </div>
              
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>RAG Pipeline</span>
                    <span className="text-lg">{(stat.rag * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-foreground transition-all duration-1000" style={{ width: `${stat.rag * 100}%` }} />
                  </div>
                </div>
                
                <div className="space-y-2 opacity-60">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Standard GenAI</span>
                    <span>{(stat.non * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${stat.non * 100}%` }} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Dataset / Results Table */}
      <div className="bg-background border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
          <h2 className="text-sm font-bold uppercase tracking-widest opacity-60 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Evaluation Dataset ({testCases.length} Queries)
          </h2>
        </div>
        
        <div className="divide-y divide-border/50">
          {!results ? (
            testCases.map((tc, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between group hover:bg-muted/20 transition-colors">
                <div className="flex-1">
                  <p className="text-sm font-semibold">{tc.question}</p>
                  <p className="text-xs text-muted-foreground mt-1 italic">Expected: {tc.expected_answer}</p>
                </div>
                <div className="text-[10px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  PENDING BENCHMARK
                </div>
              </div>
            ))
          ) : (
            results.results.map((result: any, idx: number) => (
              <div key={idx} className="flex flex-col">
                <button 
                  onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                  className="w-full p-4 flex items-center justify-between hover:bg-muted/20 transition-colors text-left"
                >
                  <div className="flex-1 flex items-center gap-4">
                    <div className={`p-2 rounded-full ${(result.rag_scores?.overall_score ?? 0) > (result.non_rag_scores?.overall_score ?? 0) ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                      {(result.rag_scores?.overall_score ?? 0) > (result.non_rag_scores?.overall_score ?? 0) ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{result.question}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-mono bg-foreground/5 px-1.5 py-0.5 rounded text-foreground">RAG: {((result.rag_scores?.overall_score ?? 0) * 100).toFixed(0)}%</span>
                        <span className="text-[10px] font-mono bg-orange-500/5 px-1.5 py-0.5 rounded text-orange-500">GENAI: {((result.non_rag_scores?.overall_score ?? 0) * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                  {expandedIndex === idx ? <ChevronUp className="w-4 h-4 opacity-50" /> : <ChevronDown className="w-4 h-4 opacity-50" />}
                </button>
                
                <AnimatePresence>
                  {expandedIndex === idx && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-muted/10"
                    >
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-border/30">
                        {/* RAG Column */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground">
                            <ShieldCheck className="w-4 h-4" /> Grounded Response
                          </div>
                          <div className="p-4 bg-background border rounded-xl text-sm leading-relaxed shadow-sm min-h-[100px]">
                            {result.rag_response}
                          </div>
                          <div className="grid grid-cols-2 gap-4 pt-2">
                            <ScoreBar value={result.rag_scores?.semantic_similarity ?? 0} label="Similarity" color="bg-blue-500" />
                            <ScoreBar value={result.rag_scores?.partial_score ?? 0} label="Partial" color="bg-orange-500" />
                          </div>
                        </div>

                        {/* Non-RAG Column */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-orange-500">
                            <ShieldAlert className="w-4 h-4" /> Generic GenAI
                          </div>
                          <div className="p-4 bg-background border border-orange-500/20 rounded-xl text-sm leading-relaxed shadow-sm min-h-[100px] text-muted-foreground">
                            {result.non_rag_response}
                          </div>
                          <div className="grid grid-cols-2 gap-4 pt-2">
                            <ScoreBar value={result.non_rag_scores?.semantic_similarity ?? 0} label="Similarity" color="bg-blue-500/50" />
                            <ScoreBar value={result.non_rag_scores?.partial_score ?? 0} label="Partial" color="bg-orange-500/50" />
                          </div>
                        </div>

                        <div className="md:col-span-2 p-4 bg-foreground/5 rounded-xl border border-border/50">
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2">Ground Truth (Expected Answer)</p>
                          <p className="text-sm font-medium">{result.expected_answer}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
