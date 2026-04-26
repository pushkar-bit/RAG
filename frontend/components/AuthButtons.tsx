"use client";

import Link from "next/link";
import { Database, MessageSquare, Activity, SlidersHorizontal } from "lucide-react";
import { UserButton, useUser, SignInButton } from "@clerk/nextjs";

export function AuthButtons() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />;

  return (
    <div className="flex items-center gap-8">
      {isSignedIn ? (
        <>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link href="/documents" className="flex items-center gap-2 hover:text-primary/70 transition-colors">
              <Database className="w-4 h-4" /> Documents
            </Link>
            <Link href="/chat" className="flex items-center gap-2 hover:text-primary/70 transition-colors">
              <MessageSquare className="w-4 h-4" /> Chat
            </Link>
            <Link href="/insights" className="flex items-center gap-2 hover:text-primary/70 transition-colors">
              <Activity className="w-4 h-4" /> Insights
            </Link>
            <Link href="/evaluation" className="flex items-center gap-2 hover:text-primary/70 transition-colors">
              <SlidersHorizontal className="w-4 h-4" /> Evaluation
            </Link>
          </nav>
          <div className="w-px h-4 bg-border hidden md:block" />
          <UserButton />
        </>
      ) : (
        <SignInButton mode="modal">
          <button className="px-4 py-2 bg-foreground text-background rounded-lg text-sm font-bold hover:opacity-90 transition-all">
            Sign In
          </button>
        </SignInButton>
      )}
    </div>
  );
}
