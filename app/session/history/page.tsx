"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/page-header";
import SectionCard from "@/components/section-card";
import { getMatches, getPlayers, getSessions } from "@/lib/storage";
import type { MatchRecord, Player, SessionRecord } from "@/types";

export default function SessionHistoryPage() {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

  useEffect(() => {
    setMatches(getMatches());
    setPlayers(getPlayers());
    setSessions(getSessions());
  }, []);

  const sortedMatches = useMemo(() => {
    return [...matches].sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime()
    );
  }, [matches]);

  const playerMap = useMemo(() => {
    const map = new Map<string, Player>();
    for (const player of players) {
      map.set(player.id, player);
    }
    return map;
  }, [players]);

  const sessionMap = useMemo(() => {
    const map = new Map<string, SessionRecord>();
    for (const session of sessions) {
      map.set(session.id, session);
    }
    return map;
  }, [sessions]);

  function getPlayerName(id: string) {
    return playerMap.get(id)?.name ?? id;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lịch sử trận đấu"
        description="Xem lại các trận đã nhập điểm."
      />

      {sortedMatches.length === 0 ? (
        <SectionCard title="Chưa có dữ liệu">
          <div className="text-sm text-slate-600">
            Hiện chưa có trận nào được lưu.
          </div>
        </SectionCard>
      ) : (
        <div className="space-y-4">
          {sortedMatches.map((match) => {
            const session = sessionMap.get(match.sessionId);

            return (
              <SectionCard key={match.id} title={`Round ${match.round}`}>
                <div className="space-y-3">
                  <div className="text-sm text-slate-500">
                    Session: {session?.date || "-"}
                  </div>

                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 rounded-2xl border border-slate-200 p-4">
                      <div className="mb-2 text-sm font-semibold text-slate-500">
                        Team A
                      </div>
                      <div className="space-y-1">
                        {match.teamA.playerIds.map((id) => (
                          <div key={id} className="font-medium text-slate-800">
                            {getPlayerName(id)}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex min-w-[120px] flex-col items-center justify-center rounded-2xl bg-slate-900 px-4 py-6 text-white">
                      <div className="text-sm text-slate-300">Tỷ số</div>
                      <div className="mt-1 text-2xl font-bold">
                        {match.scoreA} - {match.scoreB}
                      </div>
                    </div>

                    <div className="flex-1 rounded-2xl border border-slate-200 p-4">
                      <div className="mb-2 text-sm font-semibold text-slate-500">
                        Team B
                      </div>
                      <div className="space-y-1">
                        {match.teamB.playerIds.map((id) => (
                          <div key={id} className="font-medium text-slate-800">
                            {getPlayerName(id)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400">
                    Created: {match.createdAt ? new Date(match.createdAt).toLocaleString("vi-VN") : "-"}
                  </div>
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}
    </div>
  );
}