import { ClerkProvider } from "@clerk/nextjs";
import Header from "../components/Header";
import "./globals.css";
import { AnimatedSVGBackground } from "../components/ui/animated-svg-background";

export const metadata = {
  title: 'InsightRAG - Knowledge Assistant',
  description: 'Grounded AI pipeline transparency platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased min-h-screen flex flex-col">
          <AnimatedSVGBackground />
          <Header />
          <div className="flex-1 flex overflow-hidden">
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
