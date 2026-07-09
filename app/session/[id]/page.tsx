"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import SessionMatchCard from "@/components/sessions/session-match-card";
import {
  ensureSeedData,
  getPlayers,
  upsertMatch,
} from "@/lib/storage";
import {
  getPlayerMap,
  getSessionById,
  getSessionMatches,
  getSessionParticipants,
  groupMatchesByRound,
} from "@/lib/sessions/session-utils";
import type { MatchRecord, Player, SessionRecord } from "@/types";

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const sessionId = params?.id ?? "";

  const [session, setSession] = useState<SessionRecord | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);

  function reload() {
    ensureSeedData();

    const currentSession = getSessionById(sessionId);
    const currentPlayers = getPlayers();
    const currentMatches = getSessionMatches(sessionId);

    setSession(currentSession);
    setPlayers(currentPlayers);
    setMatches(currentMatches);
  }

  useEffect(() => {
    reload();
  }, [sessionId]);

  const playerMap = useMemo(() => getPlayerMap(players), [players]);
  const rounds = useMemo(() => groupMatchesByRound(matches), [matches]);

  if (!session) {
    return (
      <AppShell title="Chi tiết session" subtitle="Không tìm thấy session">
        <SectionCard title="Thông báo">
          <div className="space-y-3 text-sm text-slate-600">
            <p>Session không tồn tại hoặc đã bị xoá.</p>
            <button
              onClick={() => router.push("/sessions")}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Quay lại danh sách session
            </button>
          </div>
        </SectionCard>
      </AppShell>
    );
  }

  const participants = getSessionParticipants(session, playerMap);

  function handleSaveScore(match: MatchRecord, scoreA: number, scoreB: number) {
    upsertMatch({
      sessionId: match.sessionId,
      round: match.round,
      court: match.court ?? 1,
      teamA: { playerIds: match.teamA.playerIds },
      teamB: { playerIds: match.teamB.playerIds },
      scoreA,
      scoreB,
    });

    reload();
  }

  return (
    <AppShell
      title={`Session ${new Date(session.date).toLocaleDateString("vi-VN")}`}
      subtitle={`Mode: ${session.mode ?? "normal"}`}
    >
      <div className="space-y-4">
        <SectionCard title="Tổng quan">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <InfoBox label="Mode" value={session.mode ?? "normal"} />
            <InfoBox label="Điểm thắng" value={session.pointToWin} />
            <InfoBox label="Số sân" value={session.courtCount ?? 1} />
            <InfoBox label="Số trận" value={matches.length} />
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">Người tham gia</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {participants.map((item) => (
                <span
                  key={item.id}
                  className="rounded-full bg-white px-3 py-2 text-sm text-slate-700"
                >
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Các round / trận đấu">
          {rounds.length === 0 ? (
            <div className="text-sm text-slate-500">
              Chưa có trận nào trong session này.
            </div>
          ) : (
            <div className="space-y-6">
              {rounds.map((roundBlock) => (
                <div key={roundBlock.round} className="space-y-3">
                  <div className="text-base font-bold text-slate-900">
                    Round {roundBlock.round}
                  </div>

                  <div className="space-y-3">
                    {roundBlock.matches.map((match) => (
                      <SessionMatchCard
                        key={match.id}
                        match={match}
                        playerMap={playerMap}
                        onSaveScore={handleSaveScore}
                      />
                    ))}
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

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-lg font-bold text-slate-900">{value}</div>
    </div>
  );
}