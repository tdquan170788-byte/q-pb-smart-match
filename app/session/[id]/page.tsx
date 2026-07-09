"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import {
  getPlayers,
  getSessions,
  upsertMatch,
} from "@/lib/storage";
import { generateScheduleForSession, getSessionMatches } from "@/lib/session";

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const sessionId = params?.id ?? "";

  const players = useMemo(() => getPlayers(), []);
  const sessions = useMemo(() => getSessions(), []);
  const session = sessions.find((s) => s.id === sessionId);

  const [refreshKey, setRefreshKey] = useState(0);

  const playerMap = useMemo(
    () => new Map(players.map((p) => [p.id, p.name])),
    [players]
  );

  const schedule = useMemo(() => {
    if (!session) return null;
    return generateScheduleForSession(session);
  }, [session]);

  const matches = useMemo(() => getSessionMatches(sessionId), [sessionId, refreshKey]);

  if (!session || !schedule) {
    return (
      <AppShell title="Session detail" subtitle="Không tìm thấy session">
        <SectionCard title="Thông báo">
          <div className="space-y-3 text-sm text-slate-600">
            <p>Session không tồn tại hoặc đã bị xoá.</p>
            <button
              onClick={() => router.push("/sessions")}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Quay lại danh sách sessions
            </button>
          </div>
        </SectionCard>
      </AppShell>
    );
  }

  function getSavedMatch(round: number, court: number, teamA: string[], teamB: string[]) {
    return matches.find(
      (m) =>
        m.round === round &&
        (m.court ?? 1) === court &&
        sameIds(m.teamA.playerIds, teamA) &&
        sameIds(m.teamB.playerIds, teamB)
    );
  }

  function handleSaveScore(
    round: number,
    court: number,
    teamA: string[],
    teamB: string[],
    scoreA: number,
    scoreB: number
  ) {
    upsertMatch({
      sessionId: session.id,
      round,
      court,
      teamA: { playerIds: teamA },
      teamB: { playerIds: teamB },
      scoreA,
      scoreB,
    });

    setRefreshKey((x) => x + 1);
  }

  return (
    <AppShell
      title={session.mode === "team" ? "Team session" : "Normal session"}
      subtitle={`Ngày ${session.date} • Chạm ${session.pointToWin} • Court ${session.courtCount ?? 1}`}
    >
      <div className="space-y-4">
        <SectionCard title="Tổng quan">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatBox label="Mode" value={session.mode ?? "normal"} />
            <StatBox label="Participants" value={session.participantIds.length} />
            <StatBox label="Rounds" value={schedule.totalRounds} />
            <StatBox label="Matches saved" value={matches.length} />
          </div>
        </SectionCard>

        {schedule.rounds.map((round) => (
          <SectionCard key={round.round} title={`Round ${round.round}`}>
            <div className="space-y-4">
              {round.matches.map((match) => {
                const saved = getSavedMatch(
                  round.round,
                  match.court,
                  match.teamA,
                  match.teamB
                );

                return (
                  <MatchScoreCard
                    key={`${round.round}-${match.court}-${match.teamA.join("-")}-${match.teamB.join("-")}`}
                    round={round.round}
                    court={match.court}
                    teamA={match.teamA.map((id) => playerMap.get(id) ?? id)}
                    teamB={match.teamB.map((id) => playerMap.get(id) ?? id)}
                    initialScoreA={saved?.scoreA ?? 0}
                    initialScoreB={saved?.scoreB ?? 0}
                    onSave={(scoreA, scoreB) =>
                      handleSaveScore(
                        round.round,
                        match.court,
                        match.teamA,
                        match.teamB,
                        scoreA,
                        scoreB
                      )
                    }
                  />
                );
              })}

              {round.restingPlayerIds.length > 0 ? (
                <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                  Nghỉ vòng này:{" "}
                  {round.restingPlayerIds.map((id) => playerMap.get(id) ?? id).join(", ")}
                </div>
              ) : null}
            </div>
          </SectionCard>
        ))}
      </div>
    </AppShell>
  );
}

function MatchScoreCard({
  round,
  court,
  teamA,
  teamB,
  initialScoreA,
  initialScoreB,
  onSave,
}: {
  round: number;
  court: number;
  teamA: string[];
  teamB: string[];
  initialScoreA: number;
  initialScoreB: number;
  onSave: (scoreA: number, scoreB: number) => void;
}) {
  const [scoreA, setScoreA] = useState(initialScoreA);
  const [scoreB, setScoreB] = useState(initialScoreB);

  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="mb-3 text-sm font-semibold text-slate-700">
        Court {court}
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto] md:items-center">
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="text-xs uppercase tracking-wide text-slate-500">Team A</div>
          <div className="mt-2 font-semibold text-slate-900">{teamA.join(" / ")}</div>
        </div>

        <input
          type="number"
          min={0}
          value={scoreA}
          onChange={(e) => setScoreA(Number(e.target.value) || 0)}
          className="w-24 rounded-2xl border border-slate-200 px-4 py-3 text-center text-lg font-bold"
        />

        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="text-xs uppercase tracking-wide text-slate-500">Team B</div>
          <div className="mt-2 font-semibold text-slate-900">{teamB.join(" / ")}</div>
        </div>

        <input
          type="number"
          min={0}
          value={scoreB}
          onChange={(e) => setScoreB(Number(e.target.value) || 0)}
          className="w-24 rounded-2xl border border-slate-200 px-4 py-3 text-center text-lg font-bold"
        />
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={() => onSave(scoreA, scoreB)}
          className="rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white"
        >
          Lưu tỉ số
        </button>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function sameIds(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const aa = [...a].sort();
  const bb = [...b].sort();
  return aa.every((id, idx) => id === bb[idx]);
}