import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { AuthButtons } from "./AuthButtons";

export default function Header() {
  return (
    <header className="flex flex-col md:flex-row items-center justify-between p-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-40">
      <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight px-2">
        <LayoutDashboard className="w-6 h-6" />
        InsightRAG
      </Link>

      <div className="mt-4 md:mt-0">
        <AuthButtons />
      </div>
    </header>
  );
}
