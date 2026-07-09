"use client";

import { ReactNode } from "react";
import BottomNav from "./bottom-nav";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function AppShell({ title, subtitle, children }: Props) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-md flex-col">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-5 pb-4 pt-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-lg font-bold text-white shadow-card">
              QD
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">{title}</h1>
              {subtitle ? (
                <p className="text-sm text-slate-500">{subtitle}</p>
              ) : (
                <p className="text-sm text-slate-500">Q-PB Smart Match</p>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-4 pb-24">{children}</main>

        <BottomNav />
      </div>
    </div>
  );
}