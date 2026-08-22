"use client";

import { useRouter } from "next/navigation";
import { Button } from "./ui/Button";

interface AppShellProps {
  children: React.ReactNode;
  showHeader?: boolean;
  email?: string;
  sessionProgress?: string;
}

export function AppShell({
  children,
  showHeader = true,
  email,
  sessionProgress,
}: AppShellProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-bg">
      {/* Top Bar */}
      {showHeader && (
        <header className="sticky top-0 z-50 bg-surface border-b border-hairline">
          <div className="h-16 px-6 flex items-center justify-between max-w-7xl mx-auto w-full">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-accent-deep flex items-center justify-center text-white font-bold text-sm">
                S
              </div>
              <span className="text-body font-600 text-ink hidden sm:inline">
                Senebiclabs
              </span>
            </div>

            {/* Center Progress */}
            {sessionProgress && (
              <div className="text-small text-slate text-center">
                {sessionProgress}
              </div>
            )}

            {/* Right: Email + Sign Out */}
            <div className="flex items-center gap-4">
              {email && (
                <span className="text-small text-slate hidden sm:inline">
                  {email}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/")}
              >
                Sign out
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {children}
      </main>
    </div>
  );
}
