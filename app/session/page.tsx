"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import SessionSummaryCard from "@/components/sessions/session-summary-card";
import { ensureSeedData, getMatches, getSessions } from "@/lib/storage";
import type { SessionRecord } from "@/types";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [matchCountMap, setMatchCountMap] = useState<Record<string, number>>({});

  useEffect(() => {
    ensureSeedData();

    const allSessions = getSessions();
    const allMatches = getMatches();

    const nextMatchCountMap: Record<string, number> = {};
    for (const session of allSessions) {
      nextMatchCountMap[session.id] = allMatches.filter(
        (m) => m.sessionId === session.id
      ).length;
    }

    setSessions(allSessions);
    setMatchCountMap(nextMatchCountMap);
  }, []);

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  }, [sessions]);

  return (
    <AppShell
      title="Sessions"
      subtitle="Quản lý các buổi chơi pickleball"
    >
      <div className="space-y-4">
        <SectionCard
          title="Danh sách session"
          action={
            <Link
              href="/sessions/create"
              className="rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
            >
              + Tạo session
            </Link>
          }
        >
          {sortedSessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-slate-500">
              Chưa có session nào.
            </div>
          ) : (
            <div className="space-y-3">
              {sortedSessions.map((session) => (
                <SessionSummaryCard
                  key={session.id}
                  session={session}
                  matchCount={matchCountMap[session.id] ?? 0}
                  participantCount={session.participantIds.length}
                />
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}