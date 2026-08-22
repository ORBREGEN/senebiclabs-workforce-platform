"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

interface AppState {
  available: boolean;
  setAvailable: (next: boolean) => void;
  reviewedThisSession: number;
  countReview: () => void;
  unreadNotifications: number;
  toast: string | null;
  showToast: (message: string) => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [available, setAvailable] = useState(true);
  const [reviewedThisSession, setReviewed] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const value = useMemo<AppState>(
    () => ({
      available,
      setAvailable,
      reviewedThisSession,
      countReview: () => setReviewed((n) => n + 1),
      unreadNotifications: 3,
      toast,
      showToast: (message: string) => {
        setToast(message);
        window.setTimeout(() => setToast(null), 4000);
      },
    }),
    [available, reviewedThisSession, toast]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useAppState must be used inside AppStateProvider");
  }
  return ctx;
}
