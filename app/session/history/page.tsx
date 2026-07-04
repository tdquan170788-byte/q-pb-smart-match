"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, History } from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import { getMatches, getPlayers, getSessions } from "@/lib/storage";
import type { MatchRecord, Player, SessionRecord } from "@/types";

export default function SessionHistoryPage() {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setMatches(getMatches());
    setPlayers(getPlayers());
    setSessions(getSessions());
    setReady(true);
  }, []);

  const sortedMatches = useMemo(() => {
    return [...matches].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [matches]);

  function getPlayerNames(ids: string[]) {
    return ids
      .map((id) => players.find((p) => p.id === id)?.name ?? "Unknown")
      .join(" / ");
  }

  function getSessionLabel(sessionId: string) {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return "Session không xác định";
    return new Date(session.date).toLocaleDateString("vi-VN");
  }

  return (
    <AppShell title="Lịch sử trận" subtitle="Toàn bộ match đã lưu">
      <div className="space-y-4">
        <Link
          href="/session"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
        >
          <ArrowLeft size={16} />
          Quay lại session
        </Link>

        <SectionCard title={`Tổng số trận đã lưu: ${matches.length}`}>
          {!ready ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
              Đang tải...
            </div>
          ) : sortedMatches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <History className="text-slate-500" size={22} />
              </div>
              <div className="text-base font-semibold">Chưa có trận nào</div>
              <div className="mt-1 text-sm text-slate-500">
                Khi session bắt đầu lưu kết quả trận, lịch sử sẽ hiện ở đây.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedMatches.map((match) => (
                <div
                  key={match.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-800">
                        Session {getSessionLabel(match.sessionId)} • Round {match.round}
                      </div>

                      <div className="mt-2 text-sm text-slate-600">
                        {getPlayerNames(match.teamA.playerIds)}
                      </div>
                      <div className="text-xs text-slate-400">vs</div>
                      <div className="text-sm text-slate-600">
                        {getPlayerNames(match.teamB.playerIds)}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-800">
                      {match.scoreA} - {match.scoreB}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}