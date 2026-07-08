"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Trophy,
  Users,
  Swords,
  CircleDot,
} from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
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
} from "@/types";

type ScoreDraftMap = Record<string, { scoreA: string; scoreB: string }>;

function matchKey(match: ScheduledMatch) {
  return `${match.round}_${match.court}_${match.teamA.join("-")}_${match.teamB.join("-")}`;
}

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params?.id ?? "";

  const [players, setPlayers] = useState<Player[]>([]);
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [drafts, setDrafts] = useState<ScoreDraftMap>({});

  useEffect(() => {
    ensureSeedData();

    const allPlayers = getPlayers();
    const allSessions = getSessions();
    const allMatches = getMatches();

    setPlayers(allPlayers);
    setSession(allSessions.find((s) => s.id === sessionId) ?? null);
    setMatches(allMatches.filter((m) => m.sessionId === sessionId));
  }, [sessionId]);

  const playerMap = useMemo(() => {
    return new Map(players.map((p) => [p.id, p]));
  }, [players]);

  const schedule: GeneratedSchedule | null = useMemo(() => {
    if (!session) return null;

    return buildSessionSchedule({
      sessionId: session.id,
      participantIds: session.participantIds ?? [],
      mode: session.mode ?? "normal",
      courtCount: session.courtCount ?? 1,
      teamAPlayerIds: session.teamAPlayerIds ?? [],
      teamBPlayerIds: session.teamBPlayerIds ?? [],
    });
  }, [session]);

  const persistedMatchMap = useMemo(() => {
    const map = new Map<string, MatchRecord>();

    for (const m of matches) {
      const key = `${m.round}_${m.court ?? 1}_${m.teamA.playerIds.join("-")}_${m.teamB.playerIds.join("-")}`;
      map.set(key, m);
    }

    return map;
  }, [matches]);

  const rounds = useMemo(() => {
    if (!schedule) return [];

    return schedule.rounds.map((round) => {
      const nextMatches = round.matches.map((match) => {
        const key = matchKey(match);
        const persisted = persistedMatchMap.get(key);

        if (!persisted) {
          return {
            ...match,
            completed: false,
          };
        }

        return {
          ...match,
          scoreA: persisted.scoreA,
          scoreB: persisted.scoreB,
          completed: true,
        };
      });

      return {
        ...round,
        matches: nextMatches,
        completed:
          nextMatches.length > 0 && nextMatches.every((m) => m.completed === true),
      };
    });
  }, [schedule, persistedMatchMap]);

  const firstIncompleteRound = useMemo(() => {
    const found = rounds.find((r) => !r.completed);
    return found?.round ?? null;
  }, [rounds]);

  const teamSummary = useMemo(() => {
    if (!session || session.mode !== "team") return null;

    let totalScoreA = 0;
    let totalScoreB = 0;

    for (const match of matches) {
      totalScoreA += match.scoreA;
      totalScoreB += match.scoreB;
    }

    return {
      totalScoreA,
      totalScoreB,
      labelA: "Team A",
      labelB: "Team B",
    };
  }, [session, matches]);

  function getPlayerName(id: string) {
    return playerMap.get(id)?.name ?? id;
  }

  function setDraftValue(
    match: ScheduledMatch,
    side: "A" | "B",
    value: string
  ) {
    const key = matchKey(match);
    setDrafts((prev) => ({
      ...prev,
      [key]: {
        scoreA: side === "A" ? value : prev[key]?.scoreA ?? "",
        scoreB: side === "B" ? value : prev[key]?.scoreB ?? "",
      },
    }));
  }

  function getDraftValue(match: ScheduledMatch, side: "A" | "B") {
    const key = matchKey(match);
    const draft = drafts[key];
    if (draft) {
      return side === "A" ? draft.scoreA : draft.scoreB;
    }

    return side === "A"
      ? match.scoreA?.toString() ?? ""
      : match.scoreB?.toString() ?? "";
  }

  function refreshMatches() {
    setMatches(getMatches().filter((m) => m.sessionId === sessionId));
  }

  function saveMatchScore(roundNo: number, match: ScheduledMatch) {
    if (!session) return;

    const key = matchKey(match);
    const scoreA = Number(drafts[key]?.scoreA ?? match.scoreA ?? "");
    const scoreB = Number(drafts[key]?.scoreB ?? match.scoreB ?? "");

    if (Number.isNaN(scoreA) || Number.isNaN(scoreB)) {
      alert("Vui lòng nhập đầy đủ điểm cho 2 đội.");
      return;
    }

    if (scoreA < 0 || scoreB < 0) {
      alert("Điểm không được âm.");
      return;
    }

    upsertMatch({
      sessionId: session.id,
      round: roundNo,
      court: match.court,
      teamA: { playerIds: match.teamA },
      teamB: { playerIds: match.teamB },
      scoreA,
      scoreB,
    });

    refreshMatches();
  }

  if (!session) {
    return (
      <AppShell title="Chi tiết session" subtitle="Không tìm thấy session">
        <div className="space-y-4">
          <Link
            href="/session"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600"
          >
            <ArrowLeft size={16} />
            Quay lại danh sách session
          </Link>

          <SectionCard title="Thông báo">
            <div className="text-sm text-slate-600">Không tìm thấy session này.</div>
          </SectionCard>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Session ${session.date}`}
      subtitle={
        session.mode === "team"
          ? "Team mode – tính theo tổng điểm"
          : "Lịch thi đấu theo round"
      }
    >
      <div className="space-y-4">
        <Link
          href="/session"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách session
        </Link>

        <SectionCard title="Tổng quan">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <CalendarDays size={16} />
                Ngày chơi
              </div>
              <div className="mt-2 text-lg font-bold">{session.date}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Users size={16} />
                Người chơi
              </div>
              <div className="mt-2 text-lg font-bold">
                {session.participantIds.length}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Trophy size={16} />
                Điểm chạm
              </div>
              <div className="mt-2 text-lg font-bold">{session.pointToWin}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Swords size={16} />
                Chế độ
              </div>
              <div className="mt-2 text-lg font-bold">
                {session.mode === "team" ? "Team mode" : "Đối đầu"}
              </div>
            </div>
          </div>
        </SectionCard>

        {session.mode === "team" && teamSummary ? (
          <SectionCard title="Tỷ số Team">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-blue-50 p-4">
                <div className="text-sm text-blue-700">{teamSummary.labelA}</div>
                <div className="mt-2 text-3xl font-bold text-blue-800">
                  {teamSummary.totalScoreA}
                </div>
              </div>

              <div className="rounded-2xl bg-rose-50 p-4">
                <div className="text-sm text-rose-700">{teamSummary.labelB}</div>
                <div className="mt-2 text-3xl font-bold text-rose-800">
                  {teamSummary.totalScoreB}
                </div>
              </div>
            </div>

            <div className="mt-3 text-sm text-slate-600">
              Team mode đang tính kết quả theo <b>tổng điểm của toàn bộ các trận</b>.
            </div>
          </SectionCard>
        ) : null}

        <SectionCard title="Danh sách người tham gia">
          <div className="grid gap-2 md:grid-cols-2">
            {session.participantIds.map((id) => {
              const player = playerMap.get(id);
              const inTeamA = session.teamAPlayerIds?.includes(id);
              const inTeamB = session.teamBPlayerIds?.includes(id);

              return (
                <div
                  key={id}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900">
                        {player?.name ?? id}
                      </div>
                      <div className="text-xs text-slate-500">
                        {player?.nickname || "Không có nickname"}
                      </div>
                    </div>

                    {session.mode === "team" ? (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          inTeamA
                            ? "bg-blue-100 text-blue-700"
                            : inTeamB
                            ? "bg-rose-100 text-rose-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {inTeamA ? "Team A" : inTeamB ? "Team B" : "Chưa gán team"}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="Schedule theo round">
          {!schedule || rounds.length === 0 ? (
            <div className="text-sm text-slate-500">
              Chưa tạo được lịch thi đấu cho session này.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <div>Tổng số round: <b>{schedule.totalRounds}</b></div>
                <div className="mt-1">
                  Rule hiện tại: phải nhập xong <b>toàn bộ trận của round hiện tại</b> thì
                  mới được nhập round tiếp theo.
                </div>
              </div>

              {rounds.map((round) => {
                const roundLocked =
                  firstIncompleteRound !== null && round.round > firstIncompleteRound;

                return (
                  <div
                    key={round.round}
                    className={`rounded-2xl border p-4 ${
                      roundLocked
                        ? "border-slate-200 bg-slate-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-lg font-bold text-slate-900">
                        Round {round.round}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {round.completed ? (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            Đã hoàn thành
                          </span>
                        ) : roundLocked ? (
                          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                            Bị khóa
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                            Đang chờ nhập kết quả
                          </span>
                        )}
                      </div>
                    </div>

                    {round.restingPlayerIds.length > 0 ? (
                      <div className="mb-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                        <div className="mb-1 font-medium">Người nghỉ round này:</div>
                        <div>{round.restingPlayerIds.map(getPlayerName).join(", ")}</div>
                      </div>
                    ) : null}

                    {round.matches.length === 0 ? (
                      <div className="text-sm text-slate-500">
                        Round này không tạo được trận hợp lệ.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {round.matches.map((match) => {
                          const disabled =
                            roundLocked ||
                            (firstIncompleteRound !== null &&
                              round.round > firstIncompleteRound);

                          return (
                            <div
                              key={match.id}
                              className="rounded-2xl border border-slate-200 bg-white p-4"
                            >
                              <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                  <CircleDot size={14} />
                                  Sân {match.court}
                                </div>

                                {match.completed ? (
                                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                    Đã nhập điểm
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                    Chưa nhập
                                  </span>
                                )}
                              </div>

                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-2xl bg-slate-50 p-4">
                                  <div className="text-sm font-semibold text-slate-700">
                                    Đội A
                                  </div>
                                  <div className="mt-2 text-sm text-slate-900">
                                    {match.teamA.map(getPlayerName).join(" / ")}
                                  </div>
                                </div>

                                <div className="rounded-2xl bg-slate-50 p-4">
                                  <div className="text-sm font-semibold text-slate-700">
                                    Đội B
                                  </div>
                                  <div className="mt-2 text-sm text-slate-900">
                                    {match.teamB.map(getPlayerName).join(" / ")}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 flex flex-wrap items-end gap-3">
                                <label className="space-y-1">
                                  <div className="text-sm text-slate-600">Điểm đội A</div>
                                  <input
                                    type="number"
                                    min={0}
                                    value={getDraftValue(match, "A")}
                                    disabled={disabled}
                                    onChange={(e) =>
                                      setDraftValue(match, "A", e.target.value)
                                    }
                                    className="w-24 rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
                                  />
                                </label>

                                <div className="pb-2 text-lg font-bold text-slate-500">
                                  -
                                </div>

                                <label className="space-y-1">
                                  <div className="text-sm text-slate-600">Điểm đội B</div>
                                  <input
                                    type="number"
                                    min={0}
                                    value={getDraftValue(match, "B")}
                                    disabled={disabled}
                                    onChange={(e) =>
                                      setDraftValue(match, "B", e.target.value)
                                    }
                                    className="w-24 rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
                                  />
                                </label>

                                <button
                                  onClick={() => saveMatchScore(round.round, match)}
                                  disabled={disabled}
                                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                                >
                                  Lưu điểm
                                </button>
                              </div>

                              {disabled ? (
                                <div className="mt-3 text-xs text-slate-500">
                                  Round này đang bị khóa vì round trước chưa hoàn thành.
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}