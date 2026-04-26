"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, Legend
} from 'recharts';
import { 
  Activity, TrendingUp, Target, Zap, AlertCircle, Filter, 
  Layers, CheckCircle2, Loader2, RefreshCw, Database, 
  ArrowUp, ArrowDown, Minus, Brain
} from 'lucide-react';

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border p-3 rounded-xl shadow-2xl text-xs">
        <p className="text-muted-foreground mb-2 font-bold uppercase tracking-widest">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="flex items-center gap-2 font-medium" style={{ color: entry.color }}>
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
            {entry.name}: <span className="font-mono font-bold">{typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, icon: Icon, color, bg, trend }: any) => (
  <div className="p-6 bg-background border border-border rounded-2xl shadow-sm hover:shadow-md hover:border-border/80 transition-all group">
    <div className="flex justify-between items-start mb-5">
      <div className={`p-2.5 rounded-xl ${bg} ${color} group-hover:scale-110 transition-transform`}>
        <Icon className="w-5 h-5" />
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
          trend > 0 ? 'bg-green-500/10 text-green-500' : trend < 0 ? 'bg-red-500/10 text-red-500' : 'bg-muted text-muted-foreground'
        }`}>
          {trend > 0 ? <ArrowUp className="w-3 h-3" /> : trend < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </div>
    <p className="text-3xl font-mono tracking-tighter font-bold">{value}</p>
    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{label}</p>
    {sub && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</p>}
  </div>
);

// ─── Chart Card ───────────────────────────────────────────────────────────────
const ChartCard = ({ title, subtitle, legend, children }: any) => (
  <div className="p-6 bg-background border border-border rounded-2xl shadow-sm space-y-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground/70 mt-0.5">{subtitle}</p>}
      </div>
      {legend && (
        <div className="flex items-center gap-3 shrink-0">
          {legend.map((l: any, i: number) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
      )}
    </div>
    {children}
  </div>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function MetricsDashboard() {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState('all');
  const [filterDocSet, setFilterDocSet] = useState('all');

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${API_BASE_URL}/api/evaluation/history`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch metrics');
      setHistory(json.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Filtering ─────────────────────────────────────────────────────────────
  const filteredHistory = useMemo(() => {
    let data = [...history];
    const now = Date.now();
    if (filterDate === '24h') data = data.filter(r => now - new Date(r.timestamp).getTime() < 86400000);
    if (filterDate === '7d') data = data.filter(r => now - new Date(r.timestamp).getTime() < 604800000);
    if (filterDocSet !== 'all') data = data.filter(r => r.documentSet === filterDocSet);
    return data;
  }, [history, filterDate, filterDocSet]);

  const docSets = useMemo(() => ['all', ...Array.from(new Set(history.map(r => r.documentSet)))], [history]);

  // ─── Data Processing ────────────────────────────────────────────────────────
  // Support both old (avgOverallScore) and new (overall_accuracy_percent) field names
  const getRagScore = (run: any) => {
    const m = run.aggregatedMetrics?.rag;
    if (!m) return 0;
    return m.overall_accuracy_percent != null ? m.overall_accuracy_percent : (m.avgOverallScore * 100 ?? 0);
  };
  const getNonRagScore = (run: any) => {
    const m = run.aggregatedMetrics?.nonRag ?? run.aggregatedMetrics?.non_rag;
    if (!m) return 0;
    return m.overall_accuracy_percent != null ? m.overall_accuracy_percent : (m.avgOverallScore * 100 ?? 0);
  };
  const getRagSim = (run: any) => {
    const m = run.aggregatedMetrics?.rag;
    return m?.average_semantic_similarity ?? m?.avgSemanticSimilarity ?? 0;
  };

  const timelineData = [...filteredHistory].reverse().map(run => ({
    name: new Date(run.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    RAG: parseFloat(getRagScore(run).toFixed(1)),
    Baseline: parseFloat(getNonRagScore(run).toFixed(1)),
  }));

  const comparisonData = filteredHistory.slice(0, 8).reverse().map((run, i) => ({
    name: `Run ${i + 1}`,
    RAG: parseFloat(getRagScore(run).toFixed(1)),
    Baseline: parseFloat(getNonRagScore(run).toFixed(1)),
  }));

  const similarityData = [...filteredHistory].reverse().map(run => ({
    name: new Date(run.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    'RAG Sim': parseFloat(getRagSim(run).toFixed(3)),
  }));

  // ─── KPI Calculations ────────────────────────────────────────────────────────
  const latestRun = filteredHistory[0];
  const totalQueries = filteredHistory.reduce((acc, r) => acc + (r.totalQueries || 0), 0);
  const avgRagAcc = filteredHistory.length > 0
    ? filteredHistory.reduce((acc, r) => acc + getRagScore(r), 0) / filteredHistory.length
    : 0;
  const avgNonRagAcc = filteredHistory.length > 0
    ? filteredHistory.reduce((acc, r) => acc + getNonRagScore(r), 0) / filteredHistory.length
    : 0;
  const uplift = avgRagAcc - avgNonRagAcc;
  const successRate = filteredHistory.length > 0
    ? (filteredHistory.filter(r => getRagScore(r) >= 50).length / filteredHistory.length) * 100
    : 0;
  const failureRate = 100 - successRate;
  const latestRagSim = latestRun ? getRagSim(latestRun) : 0;

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-sm font-medium">Loading evaluation telemetry...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-10">
        
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-foreground rounded-xl">
                <Brain className="w-5 h-5 text-background" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">ML Performance Monitor</h1>
            </div>
            <p className="text-sm text-muted-foreground ml-[52px]">
              Real-time RAG pipeline accuracy and semantic grounding telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-xl border text-xs font-medium">
              <Filter className="w-3.5 h-3.5 opacity-50" />
              <select className="bg-transparent focus:outline-none" value={filterDate} onChange={e => setFilterDate(e.target.value)}>
                <option value="all">All Time</option>
                <option value="7d">Last 7 Days</option>
                <option value="24h">Last 24 Hours</option>
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-xl border text-xs font-medium">
              <Database className="w-3.5 h-3.5 opacity-50" />
              <select className="bg-transparent focus:outline-none" value={filterDocSet} onChange={e => setFilterDocSet(e.target.value)}>
                {docSets.map(s => <option key={s} value={s}>{s === 'all' ? 'All Doc Sets' : s}</option>)}
              </select>
            </div>
            <button 
              onClick={fetchHistory}
              className="p-2 hover:bg-muted rounded-xl transition-colors border"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 border border-red-500/30 bg-red-500/5 text-red-500 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* ── KPI Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <KpiCard 
            label="RAG Accuracy" value={`${avgRagAcc.toFixed(1)}%`}
            sub="Weighted avg across all runs"
            icon={Target} color="text-green-500" bg="bg-green-500/10"
            trend={uplift}
          />
          <KpiCard 
            label="Total Queries" value={totalQueries.toLocaleString()}
            sub={`Across ${filteredHistory.length} benchmark runs`}
            icon={Zap} color="text-blue-500" bg="bg-blue-500/10"
          />
          <KpiCard 
            label="Avg Grounding Score" value={latestRagSim.toFixed(3)}
            sub="Latest run semantic similarity"
            icon={Activity} color="text-purple-500" bg="bg-purple-500/10"
          />
          <KpiCard 
            label="Failure Rate" value={`${failureRate.toFixed(1)}%`}
            sub="Runs below 50% accuracy"
            icon={AlertCircle} color="text-orange-500" bg="bg-orange-500/10"
            trend={-failureRate}
          />
        </div>

        {/* ── RAG Uplift Banner ── */}
        {filteredHistory.length > 0 && (
          <div className="p-5 border border-green-500/20 bg-green-500/5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-xl">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="font-bold text-sm text-green-600 dark:text-green-400">RAG Accuracy Uplift</p>
                <p className="text-xs text-muted-foreground">Grounding improves performance over standard GenAI</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-center">
              <div>
                <p className="text-2xl font-mono font-bold text-green-500">+{uplift.toFixed(1)}%</p>
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Accuracy Gain</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div>
                <p className="text-2xl font-mono font-bold">{avgRagAcc.toFixed(1)}%</p>
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">RAG Score</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div>
                <p className="text-2xl font-mono font-bold text-muted-foreground">{avgNonRagAcc.toFixed(1)}%</p>
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Baseline</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Charts Row 1 ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <ChartCard 
            title="Accuracy Over Time" 
            subtitle="RAG vs baseline across evaluation runs"
            legend={[{ label: 'RAG', color: 'hsl(var(--foreground))' }, { label: 'Baseline', color: '#f97316' }]}
            className="lg:col-span-2"
          >
            <div style={{gridColumn: 'span 2'}} />
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} domain={[0, 100]} unit="%" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="RAG" stroke="hsl(var(--foreground))" strokeWidth={2.5}
                    dot={{ r: 4, fill: 'hsl(var(--foreground))', strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                    activeDot={{ r: 6, strokeWidth: 0 }} animationDuration={1500}
                  />
                  <Line type="monotone" dataKey="Baseline" stroke="#f97316" strokeWidth={2} strokeDasharray="5 5"
                    dot={false} animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Semantic Grounding" subtitle="Vector similarity score across runs">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={similarityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="simGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} domain={[0, 1]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="RAG Sim" stroke="hsl(var(--foreground))" strokeWidth={2}
                    fillOpacity={1} fill="url(#simGrad)" animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* ── Charts Row 2 ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <ChartCard 
            title="RAG vs Non-RAG Comparison" 
            subtitle="Side-by-side accuracy per benchmark run"
            legend={[{ label: 'RAG', color: 'hsl(var(--foreground))' }, { label: 'Non-RAG', color: '#f97316' }]}
          >
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} domain={[0, 100]} unit="%" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="RAG" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} maxBarSize={20} />
                  <Bar dataKey="Baseline" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={20} opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Query Success Rate" subtitle="Percentage of runs meeting the 50% accuracy threshold">
            <div className="h-[260px] flex flex-col items-center justify-center gap-8">
              {/* Donut-style success indicator */}
              <div className="relative w-36 h-36">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                  <circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke="hsl(var(--foreground))" strokeWidth="10"
                    strokeDasharray={`${successRate * 2.513} 251.3`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-2xl font-mono font-bold">{successRate.toFixed(0)}%</p>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Success</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-center">
                <div>
                  <p className="text-lg font-mono font-bold text-green-500">{filteredHistory.filter(r => getRagScore(r) >= 50).length}</p>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Passed</p>
                </div>
                <div className="w-px h-6 bg-border" />
                <div>
                  <p className="text-lg font-mono font-bold text-red-500">{filteredHistory.filter(r => getRagScore(r) < 50).length}</p>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Failed</p>
                </div>
                <div className="w-px h-6 bg-border" />
                <div>
                  <p className="text-lg font-mono font-bold">{filteredHistory.length}</p>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Total</p>
                </div>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* ── Execution History Table ── */}
        <div className="bg-background border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b bg-muted/20 flex justify-between items-center">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Layers className="w-4 h-4" /> Evaluation History
            </h2>
            <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded">{filteredHistory.length} Runs</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-muted/10">
                  {['Timestamp', 'Document Set', 'Queries', 'RAG Score', 'Baseline', 'Uplift', 'Status'].map(h => (
                    <th key={h} className="p-4 text-[10px] font-bold uppercase tracking-widest opacity-50 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm">
                {filteredHistory.map((run, idx) => {
                  const ragScore = getRagScore(run);
                  const nonRagScore = getNonRagScore(run);
                  const delta = ragScore - nonRagScore;
                  const passed = ragScore >= 50;
                  return (
                    <tr key={idx} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(run.timestamp).toLocaleString()}
                      </td>
                      <td className="p-4 font-medium">{run.documentSet}</td>
                      <td className="p-4 font-mono text-center">{run.totalQueries}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-foreground transition-all" style={{ width: `${ragScore}%` }} />
                          </div>
                          <span className="text-xs font-bold font-mono">{ragScore.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground font-mono text-xs">{nonRagScore.toFixed(1)}%</td>
                      <td className="p-4">
                        <span className={`font-mono text-xs font-bold ${delta >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider ${passed ? 'text-green-500' : 'text-red-500'}`}>
                          {passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                          {passed ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredHistory.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-16 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-3 opacity-40">
                        <Activity className="w-10 h-10" />
                        <p className="font-medium">No evaluation data found.</p>
                        <p className="text-xs">POST to <span className="font-mono">/api/evaluation/run</span> with your test cases to populate the dashboard.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
