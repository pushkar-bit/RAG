import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function Header() {
  const { userId } = await auth();

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <Link href="/" className="text-xl font-bold">
        Antigravity
      </Link>
      <div>
        {!userId ? (
          <Link href="/sign-in" className="text-sm font-medium hover:underline mr-4">
            Sign In
          </Link>
        ) : (
          <UserButton />
        )}
      </div>
    </header>
  );
}
