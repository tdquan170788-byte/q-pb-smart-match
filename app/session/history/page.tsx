"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/page-header";
import {
  ensureSeedData,
  getMatches,
  getPlayers,
  getSessions,
} from "@/lib/storage";
import type { MatchRecord, Player, SessionRecord } from "@/types";

function getPlayerName(playerMap: Map<string, Player>, id: string) {
  return playerMap.get(id)?.nickname?.trim() || playerMap.get(id)?.name || id;
}

export default function SessionHistoryPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);

  useEffect(() => {
    ensureSeedData();
    setPlayers(getPlayers());
    setSessions(getSessions());
    setMatches(getMatches());
  }, []);

  const playerMap = useMemo(
    () => new Map(players.map((p) => [p.id, p])),
    [players]
  );

  const sessionMap = useMemo(
    () => new Map(sessions.map((s) => [s.id, s])),
    [sessions]
  );

  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => {
      const tb = new Date(b.createdAt ?? 0).getTime();
      const ta = new Date(a.createdAt ?? 0).getTime();
      return tb - ta;
    });
  }, [matches]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lịch sử trận đấu"
        description="Danh sách toàn bộ trận đã nhập điểm từ các session."
      />

      <div className="space-y-4">
        {sortedMatches.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
            Chưa có trận nào được lưu.
          </div>
        ) : (
          sortedMatches.map((match) => {
            const session = sessionMap.get(match.sessionId);

            return (
              <div
                key={match.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-bold text-slate-900">
                      Round {match.round} • Sân {match.court ?? 1}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      Session: {session?.date ?? "-"} • Mode: {session?.mode ?? "normal"}
                    </div>
                  </div>

                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {match.scoreA} - {match.scoreB}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Team A
                    </div>
                    <div className="space-y-1 font-semibold text-slate-900">
                      {match.teamA.playerIds.map((id) => (
                        <div key={id}>{getPlayerName(playerMap, id)}</div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Team B
                    </div>
                    <div className="space-y-1 font-semibold text-slate-900">
                      {match.teamB.playerIds.map((id) => (
                        <div key={id}>{getPlayerName(playerMap, id)}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}