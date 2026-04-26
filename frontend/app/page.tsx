"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Terminal, 
  ShieldCheck, 
  Zap, 
  Activity, 
  ChevronRight,
  Database,
  MessageSquare,
  BarChart3
} from 'lucide-react';

export default function Home() {
  const errorTrace = `Runtime TypeError: Cannot read properties of undefined (reading 'overall_score')
at evaluation.controller.js (Line 48:33)
at EvaluationDashboard (app/evaluation/page.tsx)
at renderWithHooks (react-dom.development.js:15037)
at performUnitOfWork (react-dom.development.js:9555)
[SYSTEM]: DETECTED_TRACE_DENSITY: HIGH
[PIPELINE]: GROUNDING_MAP_INITIALIZED`;

  return (
    <main className="flex-1 relative overflow-hidden flex flex-col items-center justify-center">
      {/* Background with Image and stylized error trace */}
      <div 
        className="absolute inset-0 z-0 opacity-40 mix-blend-screen grayscale contrast-125"
        style={{ 
          backgroundImage: 'url("/bg_debug.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      {/* Moving Noise Overlay */}
      <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />

      {/* Hero Section */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20 flex flex-col items-center text-center">
        
        {/* Floating Error Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 flex items-center gap-2"
        >
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-bold font-mono text-red-500 uppercase tracking-[0.2em]">Live Trace: TypeError Refactor complete</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 leading-[0.9]"
        >
          Insight<span className="text-muted-foreground/30 italic">RAG</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl md:text-2xl text-muted-foreground/80 max-w-3xl font-medium leading-relaxed mb-12"
        >
          A grounded RAG system built for total transparency. Map every AI decision to its mathematical source, monitor latency in real-time, and eliminate hallucinations with high-dimensional vector grounding.
        </motion.p>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-24"
        >
          <Link href="/chat" className="px-8 py-4 bg-foreground text-background rounded-full font-bold hover:scale-105 transition-all flex items-center gap-3 group shadow-2xl shadow-foreground/20">
            Start Grounded Chat <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/documents" className="px-8 py-4 bg-background/50 border border-border rounded-full font-bold backdrop-blur-md hover:bg-muted transition-all">
            Ingest Knowledge Base
          </Link>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          {[
            { 
              title: "Vector Ingestion", 
              desc: "Automated chunking and embedding generation for corporate PDFs into high-dimensional space.",
              icon: Database,
              link: "/documents"
            },
            { 
              title: "Grounded Inference", 
              desc: "Context-aware chat pipeline that ensures responses are mapped directly to your internal data.",
              icon: MessageSquare,
              link: "/chat"
            },
            { 
              title: "Pipeline Analytics", 
              desc: "Deep-dive metrics for accuracy, latency, and semantic similarity constraints.",
              icon: BarChart3,
              link: "/insights"
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (i * 0.1) }}
            >
              <Link href={feature.link} className="block p-8 bg-background/30 border border-border/50 rounded-3xl backdrop-blur-xl hover:border-foreground/20 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <feature.icon className="w-24 h-24" />
                </div>
                <div className="p-3 bg-muted w-fit rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Aesthetic Error Trace - Bottom Left */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        transition={{ delay: 1 }}
        className="fixed bottom-10 left-10 hidden xl:block select-none pointer-events-none"
      >
        <pre className="text-[10px] font-mono leading-tight text-foreground uppercase tracking-widest">
          {errorTrace}
        </pre>
      </motion.div>

      {/* System Pulse - Bottom Right */}
      <div className="fixed bottom-10 right-10 flex items-center gap-4 text-[10px] font-bold font-mono tracking-[0.3em] uppercase opacity-40">
        <div className="flex gap-1 items-end h-4">
          {[1,2,3,2,4,1,3,2].map((h, i) => (
            <motion.div 
              key={i}
              animate={{ height: [`${h*25}%`, `${(h+1)*20}%`, `${h*25}%`] }}
              transition={{ repeat: Infinity, duration: 1 + (i*0.2) }}
              className="w-1 bg-foreground rounded-full" 
            />
          ))}
        </div>
        System Active: Grounding Engine 3.3
      </div>
    </main>
  );
}
