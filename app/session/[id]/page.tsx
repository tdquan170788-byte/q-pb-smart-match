"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ensureSeedData,
  getMatches,
  getPlayers,
  getSessions,
  upsertMatch,
} from "@/lib/storage";
import { buildSessionSchedule } from "@/lib/match-generator";
import type {
  GeneratedSchedule,
  MatchRecord,
  Player,
  ScheduledMatch,
  SessionRecord,
  SessionRound,
} from "@/types";

function sameIds(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const aa = [...a].sort();
  const bb = [...b].sort();
  return aa.every((id, idx) => id === bb[idx]);
}

function findSavedMatch(
  savedMatches: MatchRecord[],
  sessionId: string,
  round: number,
  teamA: string[],
  teamB: string[]
) {
  return savedMatches.find(
    (m) =>
      m.sessionId === sessionId &&
      m.round === round &&
      sameIds(m.teamA.playerIds, teamA) &&
      sameIds(m.teamB.playerIds, teamB)
  );
}

function getPlayerName(players: Player[], id: string) {
  return players.find((p) => p.id === id)?.name ?? id;
}

type TeamSummary = {
  score: number;
  wins: number;
};

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params?.id;

  const [players, setPlayers] = useState<Player[]>([]);
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [savedMatches, setSavedMatches] = useState<MatchRecord[]>([]);
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, { scoreA: string; scoreB: string }>>({});

  useEffect(() => {
    ensureSeedData();
    const allPlayers = getPlayers();
    const allSessions = getSessions();
    const allMatches = getMatches();

    setPlayers(allPlayers);
    setSavedMatches(allMatches);

    const foundSession = allSessions.find((s) => s.id === sessionId) ?? null;
    setSession(foundSession);
  }, [sessionId]);

  const schedule = useMemo<GeneratedSchedule>(() => {
    if (!session) {
      return {
        sessionId: sessionId || "",
        rounds: [],
        totalRounds: 0,
      };
    }

    const generated = buildSessionSchedule(session);

    const hydratedRounds: SessionRound[] = generated.rounds.map((round) => {
      const hydratedMatches: ScheduledMatch[] = round.matches.map((match) => {
        const saved = findSavedMatch(
          savedMatches,
          session.id,
          round.round,
          match.teamA,
          match.teamB
        );

        if (!saved) {
          return {
            ...match,
            completed: false,
          };
        }

        return {
          ...match,
          scoreA: saved.scoreA,
          scoreB: saved.scoreB,
          completed: true,
        };
      });

      return {
        ...round,
        matches: hydratedMatches,
        completed:
          hydratedMatches.length > 0 &&
          hydratedMatches.every((m) => m.completed === true),
      };
    });

    return {
      ...generated,
      rounds: hydratedRounds,
      totalRounds: hydratedRounds.length,
    };
  }, [session, savedMatches, sessionId]);

  const currentRound = useMemo(() => {
    return schedule.rounds.find((r) => !r.completed) ?? null;
  }, [schedule]);

  const currentRoundNo = currentRound?.round ?? null;

  const teamSummary = useMemo(() => {
    if (!session || session.mode !== "team") return null;

    const summary: { teamA: TeamSummary; teamB: TeamSummary } = {
      teamA: { score: 0, wins: 0 },
      teamB: { score: 0, wins: 0 },
    };

    for (const round of schedule.rounds) {
      for (const match of round.matches) {
        if (typeof match.scoreA !== "number" || typeof match.scoreB !== "number") {
          continue;
        }

        summary.teamA.score += match.scoreA;
        summary.teamB.score += match.scoreB;

        if (match.scoreA > match.scoreB) summary.teamA.wins += 1;
        if (match.scoreB > match.scoreA) summary.teamB.wins += 1;
      }
    }

    return summary;
  }, [session, schedule]);

  function getDraftKey(match: ScheduledMatch) {
    return `${match.round}_${match.court}_${match.teamA.join("-")}_${match.teamB.join("-")}`;
  }

  function getScoreValue(match: ScheduledMatch, side: "A" | "B") {
    const key = getDraftKey(match);
    const draft = scoreDrafts[key];

    if (draft) {
      return side === "A" ? draft.scoreA : draft.scoreB;
    }

    if (side === "A") return match.scoreA?.toString() ?? "";
    return match.scoreB?.toString() ?? "";
  }

  function updateScoreDraft(
    match: ScheduledMatch,
    side: "A" | "B",
    value: string
  ) {
    const key = getDraftKey(match);
    setScoreDrafts((prev) => ({
      ...prev,
      [key]: {
        scoreA: side === "A" ? value : prev[key]?.scoreA ?? getScoreValue(match, "A"),
        scoreB: side === "B" ? value : prev[key]?.scoreB ?? getScoreValue(match, "B"),
      },
    }));
  }

  function saveMatchScore(match: ScheduledMatch) {
    if (!session) return;

    const key = getDraftKey(match);
    const draft = scoreDrafts[key];

    const scoreA = Number(draft?.scoreA ?? match.scoreA ?? 0);
    const scoreB = Number(draft?.scoreB ?? match.scoreB ?? 0);

    if (Number.isNaN(scoreA) || Number.isNaN(scoreB)) return;
    if (scoreA < 0 || scoreB < 0) return;

    upsertMatch({
      sessionId: session.id,
      round: match.round,
      teamA: { playerIds: match.teamA },
      teamB: { playerIds: match.teamB },
      scoreA,
      scoreB,
    });

    setSavedMatches(getMatches());
  }

  if (!session) {
    return (
      <main className="mx-auto max-w-5xl p-4 md:p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Session không tồn tại</h1>
          <p className="mt-2 text-sm text-slate-500">
            Không tìm thấy session này trong local storage.
          </p>
          <Link
            href="/session"
            className="mt-4 inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Quay lại trang session
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Session {session.date}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Mode: {session.mode ?? "normal"} · Điểm chạm: {session.pointToWin} · Số sân:{" "}
            {session.courtCount ?? 1}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/session"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Tạo session mới
          </Link>
          <Link
            href="/session/history"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Lịch sử session
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <section className="space-y-4">
          {schedule.rounds.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-slate-900 font-semibold">
                Chưa tạo được lịch thi đấu
              </div>
              <div className="mt-2 text-sm text-slate-500">
                Session này chưa đủ điều kiện để tạo schedule.
              </div>
            </div>
          ) : (
            schedule.rounds.map((round) => {
              const isCurrent = currentRoundNo === round.round;
              const isLocked = currentRoundNo !== null && round.round > currentRoundNo;
              const isDone = round.completed;

              return (
                <div
                  key={round.round}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        Round {round.round}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {round.matches.length} trận · {round.restingPlayerIds.length} người nghỉ
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {isDone && (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Done
                        </span>
                      )}
                      {isCurrent && !isDone && (
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                          Current
                        </span>
                      )}
                      {isLocked && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          Locked
                        </span>
                      )}
                    </div>
                  </div>

                  {round.restingPlayerIds.length > 0 && (
                    <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      <span className="font-semibold">Nghỉ round này:</span>{" "}
                      {round.restingPlayerIds
                        .map((id) => getPlayerName(players, id))
                        .join(", ")}
                    </div>
                  )}

                  <div className="space-y-4">
                    {round.matches.map((match) => {
                      const disabled = isLocked;
                      const teamAName = match.teamA
                        .map((id) => getPlayerName(players, id))
                        .join(" / ");
                      const teamBName = match.teamB
                        .map((id) => getPlayerName(players, id))
                        .join(" / ");

                      return (
                        <div
                          key={match.id}
                          className="rounded-2xl border border-slate-200 p-4"
                        >
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="font-semibold text-slate-900">
                                Sân {match.court}
                              </div>
                              <div className="text-sm text-slate-500">
                                {teamAName} vs {teamBName}
                              </div>
                            </div>

                            {match.completed && (
                              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                Đã nhập điểm
                              </span>
                            )}
                          </div>

                          <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto] md:items-end">
                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                {teamAName}
                              </label>
                              <input
                                type="number"
                                min={0}
                                disabled={disabled}
                                value={getScoreValue(match, "A")}
                                onChange={(e) =>
                                  updateScoreDraft(match, "A", e.target.value)
                                }
                                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-500 disabled:bg-slate-100"
                              />
                            </div>

                            <div className="pb-2 text-center text-sm font-semibold text-slate-400">
                              -
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                {teamBName}
                              </label>
                              <input
                                type="number"
                                min={0}
                                disabled={disabled}
                                value={getScoreValue(match, "B")}
                                onChange={(e) =>
                                  updateScoreDraft(match, "B", e.target.value)
                                }
                                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-500 disabled:bg-slate-100"
                              />
                            </div>

                            <button
                              disabled={disabled}
                              onClick={() => saveMatchScore(match)}
                              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                              Lưu
                            </button>
                          </div>

                          {disabled && (
                            <p className="mt-3 text-xs text-slate-500">
                              Round này đang bị khóa. Cần hoàn tất round trước đó.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Tổng quan session</h2>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-slate-500">Người chơi</span>
                <span className="font-semibold text-slate-900">
                  {session.participantIds.length}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-slate-500">Tổng round</span>
                <span className="font-semibold text-slate-900">
                  {schedule.totalRounds}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-slate-500">Round hiện tại</span>
                <span className="font-semibold text-slate-900">
                  {currentRoundNo ?? "Hoàn tất"}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-slate-500">Mode</span>
                <span className="font-semibold text-slate-900">
                  {session.mode ?? "normal"}
                </span>
              </div>
            </div>
          </div>

          {session.mode === "team" && session.teamConfig && (
            <>
              <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-blue-700">Team A</h3>
                <div className="mt-3 space-y-2">
                  {session.teamConfig.teamAPlayerIds.map((id) => (
                    <div
                      key={id}
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800"
                    >
                      {getPlayerName(players, id)}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-rose-700">Team B</h3>
                <div className="mt-3 space-y-2">
                  {session.teamConfig.teamBPlayerIds.map((id) => (
                    <div
                      key={id}
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800"
                    >
                      {getPlayerName(players, id)}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">
                  Tổng kết team
                </h3>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-xl bg-blue-50 px-4 py-3">
                    <div className="text-sm text-blue-700 font-semibold">Team A</div>
                    <div className="mt-1 text-sm text-slate-700">
                      Tổng điểm: <span className="font-semibold">{teamSummary?.teamA.score ?? 0}</span>
                    </div>
                    <div className="text-sm text-slate-700">
                      Số trận thắng: <span className="font-semibold">{teamSummary?.teamA.wins ?? 0}</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-rose-50 px-4 py-3">
                    <div className="text-sm text-rose-700 font-semibold">Team B</div>
                    <div className="mt-1 text-sm text-slate-700">
                      Tổng điểm: <span className="font-semibold">{teamSummary?.teamB.score ?? 0}</span>
                    </div>
                    <div className="text-sm text-slate-700">
                      Số trận thắng: <span className="font-semibold">{teamSummary?.teamB.wins ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </main>
  );
}