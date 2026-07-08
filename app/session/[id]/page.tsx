"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Trophy,
  Lock,
  CheckCircle2,
  Users,
} from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import type {
  GeneratedSchedule,
  MatchRecord,
  Player,
  ScheduledMatch,
  SessionRecord,
  SessionRound,
} from "@/types";
import {
  ensureSeedData,
  getMatches,
  getPlayers,
  getSessions,
  upsertMatch,
} from "@/lib/storage";
import { buildSessionSchedule } from "@/lib/match-generator";

type ScoreDraft = Record<
  string,
  {
    scoreA: string;
    scoreB: string;
  }
>;

function getPlayerName(players: Player[], playerId: string) {
  return players.find((p) => p.id === playerId)?.name ?? playerId;
}

function matchKey(match: {
  sessionId: string;
  round: number;
  teamA: string[];
  teamB: string[];
}) {
  const teamA = [...match.teamA].sort().join(",");
  const teamB = [...match.teamB].sort().join(",");
  return `${match.sessionId}__${match.round}__${teamA}__${teamB}`;
}

function existingMatchKey(match: MatchRecord) {
  const teamA = [...match.teamA.playerIds].sort().join(",");
  const teamB = [...match.teamB.playerIds].sort().join(",");
  return `${match.sessionId}__${match.round}__${teamA}__${teamB}`;
}

function hydrateSchedule(
  baseSchedule: GeneratedSchedule,
  sessionId: string,
  existingMatches: MatchRecord[]
): GeneratedSchedule {
  const matchMap = new Map(existingMatches.map((m) => [existingMatchKey(m), m]));

  const rounds = baseSchedule.rounds.map((round) => {
    const matches = round.matches.map((m) => {
      const key = matchKey({
        sessionId,
        round: m.round,
        teamA: m.teamA,
        teamB: m.teamB,
      });

      const existing = matchMap.get(key);
      if (!existing) return m;

      return {
        ...m,
        scoreA: existing.scoreA,
        scoreB: existing.scoreB,
        completed: true,
      };
    });

    return {
      ...round,
      matches,
      completed: matches.every((m) => m.completed),
    };
  });

  return {
    ...baseSchedule,
    rounds,
  };
}

function getUnlockedRound(rounds: SessionRound[]) {
  for (let i = 0; i < rounds.length; i += 1) {
    if (!rounds[i].completed) return rounds[i].round;
  }
  return rounds.length;
}

function isRoundUnlocked(roundNo: number, unlockedRound: number) {
  return roundNo <= unlockedRound;
}

function getCompletedMatchCount(rounds: SessionRound[]) {
  return rounds.reduce(
    (sum, round) => sum + round.matches.filter((m) => m.completed).length,
    0
  );
}

function getTotalMatchCount(rounds: SessionRound[]) {
  return rounds.reduce((sum, round) => sum + round.matches.length, 0);
}

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params?.id ?? "";

  const [players, setPlayers] = useState<Player[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [scoreDraft, setScoreDraft] = useState<ScoreDraft>({});

  useEffect(() => {
    ensureSeedData();
    setPlayers(getPlayers());
    setSessions(getSessions());
    setMatches(getMatches());
  }, []);

  const session = useMemo(() => {
    return sessions.find((s) => s.id === sessionId) ?? null;
  }, [sessions, sessionId]);

  const schedule = useMemo<GeneratedSchedule | null>(() => {
    if (!session) return null;

    const base = buildSessionSchedule(session.id, session.participantIds);
    return hydrateSchedule(
      base,
      session.id,
      matches.filter((m) => m.sessionId === session.id)
    );
  }, [session, matches]);

  const unlockedRound = useMemo(() => {
    if (!schedule) return 1;
    return getUnlockedRound(schedule.rounds);
  }, [schedule]);

  const totalMatches = schedule ? getTotalMatchCount(schedule.rounds) : 0;
  const completedMatches = schedule ? getCompletedMatchCount(schedule.rounds) : 0;
  const progress =
    totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;

  function setDraft(matchId: string, field: "scoreA" | "scoreB", value: string) {
    setScoreDraft((prev) => ({
      ...prev,
      [matchId]: {
        scoreA: prev[matchId]?.scoreA ?? "",
        scoreB: prev[matchId]?.scoreB ?? "",
        [field]: value,
      },
    }));
  }

  function getDraftValue(match: ScheduledMatch, field: "scoreA" | "scoreB") {
    const draft = scoreDraft[match.id]?.[field];
    if (draft !== undefined) return draft;
    if (field === "scoreA") return match.scoreA?.toString() ?? "";
    return match.scoreB?.toString() ?? "";
  }

  function handleSaveMatch(round: SessionRound, match: ScheduledMatch) {
    if (!session || !schedule) return;

    // khóa round sau: chỉ round đang mở mới được nhập
    if (!isRoundUnlocked(round.round, unlockedRound)) return;
    if (round.round !== unlockedRound && !round.completed) return;

    const scoreAValue = getDraftValue(match, "scoreA");
    const scoreBValue = getDraftValue(match, "scoreB");

    const scoreA = Number(scoreAValue);
    const scoreB = Number(scoreBValue);

    if (Number.isNaN(scoreA) || Number.isNaN(scoreB)) {
      alert("Điểm không hợp lệ.");
      return;
    }

    if (scoreA < 0 || scoreB < 0) {
      alert("Điểm không được âm.");
      return;
    }

    const pointToWin = session.pointToWin ?? 11;
    if (scoreA !== pointToWin && scoreB !== pointToWin) {
      alert(`Một trong hai đội phải chạm ${pointToWin} điểm.`);
      return;
    }

    if (scoreA === scoreB) {
      alert("Không thể hòa.");
      return;
    }

    upsertMatch({
      sessionId: session.id,
      round: round.round,
      teamA: { playerIds: match.teamA },
      teamB: { playerIds: match.teamB },
      scoreA,
      scoreB,
    });

    setMatches(getMatches());
  }

  if (!session) {
    return (
      <AppShell title="Session detail" subtitle="Không tìm thấy session">
        <div className="space-y-4">
          <Link
            href="/session"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600"
          >
            <ArrowLeft size={16} />
            Quay lại danh sách session
          </Link>

          <SectionCard title="Thông báo">
            <div className="text-sm text-slate-500">Session không tồn tại.</div>
          </SectionCard>
        </div>
      </AppShell>
    );
  }

  const participantPlayers = players.filter((p) =>
    session.participantIds.includes(p.id)
  );

  return (
    <AppShell
      title={`Session ${session.id.slice(-6)}`}
      subtitle={`Ngày ${session.date} · Điểm chạm ${session.pointToWin}`}
    >
      <div className="space-y-4">
        <Link
          href="/session"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách session
        </Link>

        <SectionCard title="Tổng quan session">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <CalendarDays size={14} />
                Ngày chơi
              </div>
              <div className="mt-2 text-xl font-bold">{session.date}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Users size={14} />
                Người chơi
              </div>
              <div className="mt-2 text-xl font-bold">
                {session.participantIds.length}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Trophy size={14} />
                Điểm chạm
              </div>
              <div className="mt-2 text-xl font-bold">{session.pointToWin}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Tiến độ</div>
              <div className="mt-2 text-xl font-bold">
                {completedMatches}/{totalMatches} ({progress}%)
              </div>
            </div>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-900 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </SectionCard>

        <SectionCard title="Danh sách người chơi">
          <div className="flex flex-wrap gap-2">
            {participantPlayers.map((player) => (
              <div
                key={player.id}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700"
              >
                {player.name}
              </div>
            ))}
          </div>
        </SectionCard>

        {!schedule || schedule.rounds.length === 0 ? (
          <SectionCard title="Schedule">
            <div className="text-sm text-slate-500">
              Không thể tạo lịch cho session này. Session cần từ 4 người trở lên.
            </div>
          </SectionCard>
        ) : (
          <SectionCard title="Schedule theo round">
            <div className="space-y-4">
              {schedule.rounds.map((round: SessionRound) => {
                const unlocked = isRoundUnlocked(round.round, unlockedRound);
                const locked = !unlocked;

                return (
                  <div
                    key={round.round}
                    className={`rounded-2xl border p-4 ${
                      round.completed
                        ? "border-emerald-200 bg-emerald-50/40"
                        : locked
                        ? "border-slate-200 bg-slate-50/70"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-lg font-bold text-slate-900">
                            Round {round.round}
                          </div>

                          {round.completed ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                              <CheckCircle2 size={12} />
                              Completed
                            </span>
                          ) : locked ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                              <Lock size={12} />
                              Locked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                              Đang mở
                            </span>
                          )}
                        </div>

                        <div className="mt-1 text-sm text-slate-500">
                          {round.restingPlayerIds.length > 0 ? (
                            <>
                              Nghỉ:{" "}
                              <span className="font-medium text-slate-700">
                                {round.restingPlayerIds
                                  .map((id) => getPlayerName(players, id))
                                  .join(", ")}
                              </span>
                            </>
                          ) : (
                            "Không có người nghỉ"
                          )}
                        </div>
                      </div>

                      {!round.completed && unlocked && (
                        <div className="text-sm text-slate-500">
                          Cần nhập xong round này trước khi sang round tiếp theo
                        </div>
                      )}
                    </div>

                    <div className="mt-4 space-y-4">
                      {round.matches.map((match: ScheduledMatch) => {
                        const scoreAValue = getDraftValue(match, "scoreA");
                        const scoreBValue = getDraftValue(match, "scoreB");

                        return (
                          <div
                            key={match.id}
                            className="rounded-2xl border border-slate-200 bg-white p-4"
                          >
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <div className="text-sm font-semibold text-slate-900">
                                Sân {match.court}
                              </div>

                              {match.completed && (
                                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                  Đã nhập điểm
                                </span>
                              )}
                            </div>

                            <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
                              <div className="rounded-2xl bg-slate-50 p-4">
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  Team A
                                </div>
                                <div className="mt-2 space-y-1">
                                  {match.teamA.map((playerId) => (
                                    <div
                                      key={playerId}
                                      className="font-medium text-slate-900"
                                    >
                                      {getPlayerName(players, playerId)}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="text-center text-sm font-semibold text-slate-400">
                                VS
                              </div>

                              <div className="rounded-2xl bg-slate-50 p-4">
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  Team B
                                </div>
                                <div className="mt-2 space-y-1">
                                  {match.teamB.map((playerId) => (
                                    <div
                                      key={playerId}
                                      className="font-medium text-slate-900"
                                    >
                                      {getPlayerName(players, playerId)}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="mb-1 block text-sm font-medium text-slate-600">
                                    Điểm Team A
                                  </label>
                                  <input
                                    type="number"
                                    min={0}
                                    disabled={locked}
                                    value={scoreAValue}
                                    onChange={(e) =>
                                      setDraft(match.id, "scoreA", e.target.value)
                                    }
                                    className="w-24 rounded-xl border border-slate-300 px-3 py-2 outline-none disabled:bg-slate-100"
                                  />
                                </div>

                                <div>
                                  <label className="mb-1 block text-sm font-medium text-slate-600">
                                    Điểm Team B
                                  </label>
                                  <input
                                    type="number"
                                    min={0}
                                    disabled={locked}
                                    value={scoreBValue}
                                    onChange={(e) =>
                                      setDraft(match.id, "scoreB", e.target.value)
                                    }
                                    className="w-24 rounded-xl border border-slate-300 px-3 py-2 outline-none disabled:bg-slate-100"
                                  />
                                </div>
                              </div>

                              <button
                                onClick={() => handleSaveMatch(round, match)}
                                disabled={locked}
                                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Lưu kết quả
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}
      </div>
    </AppShell>
  );
}