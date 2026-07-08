"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import { getMatches, getPlayers, getSessions } from "@/lib/storage";
import type { MatchRecord, Player, SessionRecord } from "@/types";

function formatDate(value?: string) {
  if (!value) return "-";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleString("vi-VN");
}

export default function SessionHistoryPage() {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

  useEffect(() => {
    setMatches(getMatches());
    setPlayers(getPlayers());
    setSessions(getSessions());
  }, []);

  const playerMap = useMemo(() => {
    return Object.fromEntries(players.map((p) => [p.id, p]));
  }, [players]);

  const sessionMap = useMemo(() => {
    return Object.fromEntries(sessions.map((s) => [s.id, s]));
  }, [sessions]);

  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => {
      const timeA = a.createdAt ? Date.parse(a.createdAt) : 0;
      const timeB = b.createdAt ? Date.parse(b.createdAt) : 0;

      return (Number.isNaN(timeB) ? 0 : timeB) - (Number.isNaN(timeA) ? 0 : timeA);
    });
  }, [matches]);

  function getPlayerName(playerId: string) {
    return playerMap[playerId]?.nickname || playerMap[playerId]?.name || "Ẩn danh";
  }

  function renderTeam(playerIds: string[]) {
    return playerIds.map(getPlayerName).join(" / ");
  }

  return (
    <AppShell
      title="Lịch sử trận đấu"
      subtitle="Xem lại toàn bộ kết quả đã nhập trong các session"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-slate-900">
              Match history
            </div>
            <div className="text-sm text-slate-500">
              Tổng số trận đã lưu: {sortedMatches.length}
            </div>
          </div>

          <Link
            href="/session"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Quay lại Session
          </Link>
        </div>

        {sortedMatches.length === 0 ? (
          <SectionCard title="Lịch sử trận">
            <div className="py-8 text-center text-sm text-slate-500">
              Chưa có trận nào được lưu.
            </div>
          </SectionCard>
        ) : (
          <div className="space-y-3">
            {sortedMatches.map((match) => {
              const session = sessionMap[match.sessionId];

              return (
                <SectionCard
                  key={match.id}
                  title={`Round ${match.round}`}
                  subtitle={`Session: ${session?.date || "-"}`}
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="text-sm text-slate-500">
                        Thời gian nhập kết quả: {formatDate(match.createdAt)}
                      </div>

                      <div className="text-xl font-bold text-slate-900">
                        {match.scoreA} - {match.scoreB}
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Team A
                        </div>
                        <div className="mt-1 text-sm font-medium text-slate-900">
                          {renderTeam(match.teamA.playerIds)}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Team B
                        </div>
                        <div className="mt-1 text-sm font-medium text-slate-900">
                          {renderTeam(match.teamB.playerIds)}
                        </div>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}