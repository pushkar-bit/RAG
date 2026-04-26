"use client";

import React, { useState, useEffect } from 'react';
import { SignIn } from "@clerk/nextjs";
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function SignInPage() {
  const [showRealLogin, setShowRealLogin] = useState(false);

  const errorTrace = `Runtime TypeError: Cannot read properties of undefined (reading 'overall_score')
at evaluation.controller.js (Line 48:33)
at EvaluationDashboard (app/evaluation/page.tsx)
[SYSTEM]: CLERK_AUTH_DETACHED...
[PIPELINE]: INITIATING_HANDSHAKE_0x9F...`;

  useEffect(() => {
    // Show the "Error Trace" animation for 2.5 seconds before showing the real login
    const timer = setTimeout(() => {
      setShowRealLogin(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-background relative overflow-hidden">
      
      <div className="absolute inset-0 z-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />

      <AnimatePresence mode="wait">
        {!showRealLogin ? (
          <motion.div 
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
            className="z-10 w-full max-w-xl p-8 bg-red-500/5 border border-red-500/20 rounded-3xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-500/20 rounded-lg animate-pulse">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h2 className="text-sm font-bold font-mono text-red-500 uppercase tracking-widest">
                Auth Intercept: Transitioning to Clerk
              </h2>
            </div>
            
            <pre className="text-[10px] font-mono text-red-400/60 leading-relaxed overflow-hidden">
              {errorTrace}
            </pre>

            <div className="mt-8 flex items-center justify-center border-t border-red-500/20 pt-6">
              <div className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin text-red-500" />
                <span className="text-[10px] font-bold font-mono text-red-500">Decrypting Session...</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="clerk"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="z-10"
          >
            <SignIn 
              appearance={{
                elements: {
                  card: "bg-background border border-border shadow-2xl rounded-3xl",
                  headerTitle: "text-foreground font-bold tracking-tight",
                  headerSubtitle: "text-muted-foreground",
                  socialButtonsBlockButton: "bg-muted hover:bg-muted/80 border-border text-foreground font-medium",
                  formButtonPrimary: "bg-foreground text-background hover:opacity-90 transition-all font-bold",
                  footerActionLink: "text-foreground font-bold hover:underline"
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
