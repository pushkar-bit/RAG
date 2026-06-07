"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-background">
      <SignIn
        path="/sign-in"
        appearance={{
          elements: {
            card: "bg-background border border-border shadow-2xl rounded-3xl",
            headerTitle: "text-foreground font-bold tracking-tight",
            headerSubtitle: "text-muted-foreground",
            socialButtonsBlockButton:
              "bg-muted hover:bg-muted/80 border-border text-foreground font-medium",
            formButtonPrimary:
              "bg-foreground text-background hover:opacity-90 transition-all font-bold",
            footerActionLink: "text-foreground font-bold hover:underline",
          },
        }}
      />
    </div>
  );
}
