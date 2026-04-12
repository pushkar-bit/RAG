import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Header() {
  return (
    <header className="flex items-center justify-between p-4 border-b">
      <Link href="/" className="text-xl font-bold">
        Antigravity
      </Link>
      <div>
        <SignedOut>
          <Link href="/sign-in" className="text-sm font-medium hover:underline mr-4">
            Sign In
          </Link>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </header>
  );
}
