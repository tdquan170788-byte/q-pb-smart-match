"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Trophy,
  Users,
  Save,
  Swords,
} from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import { buildSessionSchedule } from "@/lib/match-generator";
import {
  ensureSeedData,
  getMatches,
  getPlayers,
  getSessions,
  upsertMatch,
} from "@/lib/storage";
import type {
  MatchRecord,
  Player,
  ScheduledMatch,
  SessionRecord,
  SessionRound,
} from "@/types";

type MatchFormState = Record<
  string,
  {
    scoreA: string;
    scoreB: string;
  }
>;

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params?.id ?? "";

  const [players, setPlayers] = useState<Player[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [formState, setFormState] = useState<MatchFormState>({});

  useEffect(() => {
    ensureSeedData();
    setPlayers(getPlayers());
    setSessions(getSessions());
    setMatches(getMatches());
  }, []);

  const session = useMemo(
    () => sessions.find((s) => s.id === sessionId) ?? null,
    [sessions, sessionId]
  );

  const playerMap = useMemo(() => {
    return Object.fromEntries(players.map((p) => [p.id, p]));
  }, [players]);

  const schedule = useMemo(() => {
    if (!session) {
      return {
        sessionId,
        rounds: [],
        totalRounds: 0,
      };
    }

    return buildSessionSchedule({
      id: session.id,
      participantIds: session.participantIds,
      mode: session.mode,
      courtCount: session.courtCount,
      teamConfig: session.teamConfig,
    });
  }, [session, sessionId]);

  const sessionMatches = useMemo(
    () => matches.filter((m) => m.sessionId === sessionId),
    [matches, sessionId]
  );

  function findSavedMatch(scheduledMatch: ScheduledMatch) {
    return sessionMatches.find(
      (m) =>
        m.round === scheduledMatch.round &&
        (m.court ?? 1) === scheduledMatch.court &&
        sameIds(m.teamA.playerIds, scheduledMatch.teamA) &&
        sameIds(m.teamB.playerIds, scheduledMatch.teamB)
    );
  }

  const roundsWithStatus = useMemo(() => {
    return schedule.rounds.map((round) => {
      const mappedMatches = round.matches.map((match) => {
        const saved = findSavedMatch(match);

        return {
          ...match,
          scoreA: saved?.scoreA,
          scoreB: saved?.scoreB,
          completed:
            typeof saved?.scoreA === "number" && typeof saved?.scoreB === "number",
        };
      });

      const completed =
        mappedMatches.length > 0 && mappedMatches.every((m) => m.completed);

      return {
        ...round,
        matches: mappedMatches,
        completed,
      };
    });
  }, [schedule.rounds, sessionMatches]);

  const unlockedRoundNo = useMemo(() => {
    for (const round of roundsWithStatus) {
      if (!round.completed) return round.round;
    }
    return roundsWithStatus.length > 0
      ? roundsWithStatus[roundsWithStatus.length - 1].round
      : 1;
  }, [roundsWithStatus]);

  const teamSummary = useMemo(() => {
    if (!session || session.mode !== "team" || !session.teamConfig) return null;

    const teamAIds = new Set(session.teamConfig.teamAPlayerIds);
    const teamBIds = new Set(session.teamConfig.teamBPlayerIds);

    let totalScoreA = 0;
    let totalScoreB = 0;
    let winsA = 0;
    let winsB = 0;

    for (const match of sessionMatches) {
      const isA =
        match.teamA.playerIds.every((id) => teamAIds.has(id)) &&
        match.teamB.playerIds.every((id) => teamBIds.has(id));

      const isB =
        match.teamA.playerIds.every((id) => teamBIds.has(id)) &&
        match.teamB.playerIds.every((id) => teamAIds.has(id));

      if (!isA && !isB) continue;

      if (isA) {
        totalScoreA += match.scoreA;
        totalScoreB += match.scoreB;
        if (match.scoreA > match.scoreB) winsA += 1;
        else if (match.scoreB > match.scoreA) winsB += 1;
      } else {
        totalScoreA += match.scoreB;
        totalScoreB += match.scoreA;
        if (match.scoreB > match.scoreA) winsA += 1;
        else if (match.scoreA > match.scoreB) winsB += 1;
      }
    }

    return {
      teamAName: session.teamConfig.teamAName || "Team A",
      teamBName: session.teamConfig.teamBName || "Team B",
      totalScoreA,
      totalScoreB,
      winsA,
      winsB,
    };
  }, [session, sessionMatches]);

  function getPlayerName(playerId: string) {
    return playerMap[playerId]?.name || playerId;
  }

  function getMatchKey(match: ScheduledMatch) {
    return `${match.round}_${match.court}_${match.teamA.join("-")}_${match.teamB.join("-")}`;
  }

  function getFormValue(match: ScheduledMatch) {
    const key = getMatchKey(match);
    const saved = findSavedMatch(match);

    return (
      formState[key] || {
        scoreA:
          typeof saved?.scoreA === "number" ? String(saved.scoreA) : "",
        scoreB:
          typeof saved?.scoreB === "number" ? String(saved.scoreB) : "",
      }
    );
  }

  function setMatchScore(
    match: ScheduledMatch,
    field: "scoreA" | "scoreB",
    value: string
  ) {
    const key = getMatchKey(match);
    const current = getFormValue(match);

    setFormState((prev) => ({
      ...prev,
      [key]: {
        ...current,
        [field]: value,
      },
    }));
  }

  function handleSaveMatch(match: ScheduledMatch) {
    if (!session) return;

    const currentRoundNo = match.round;
    if (currentRoundNo > unlockedRoundNo) {
      return;
    }

    const value = getFormValue(match);
    const scoreA = Number(value.scoreA);
    const scoreB = Number(value.scoreB);

    if (Number.isNaN(scoreA) || Number.isNaN(scoreB)) return;
    if (scoreA < 0 || scoreB < 0) return;

    upsertMatch({
      sessionId: session.id,
      round: match.round,
      court: match.court,
      teamA: { playerIds: match.teamA },
      teamB: { playerIds: match.teamB },
      scoreA,
      scoreB,
    });

    setMatches(getMatches());
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
            <div className="text-sm text-slate-600">
              Session không tồn tại.
            </div>
          </SectionCard>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Session ${session.id.slice(-6)}`}
      subtitle={`${session.date} · ${
        session.mode === "team" ? "Team mode" : "Normal mode"
      } · ${session.courtCount ?? 1} sân`}
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
                <CalendarDays size={14} />
                Ngày
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
                <Swords size={14} />
                Chế độ
              </div>
              <div className="mt-2 text-xl font-bold">
                {session.mode === "team" ? "Team" : "Normal"}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Trophy size={14} />
                Điểm chạm
              </div>
              <div className="mt-2 text-xl font-bold">
                {session.pointToWin}
              </div>
            </div>
          </div>
        </SectionCard>

        {session.mode === "team" && session.teamConfig && (
          <SectionCard title="Thông tin team">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-lg font-bold text-slate-900">
                  {session.teamConfig.teamAName || "Team A"}
                </div>
                <div className="mt-3 space-y-1 text-sm text-slate-600">
                  {session.teamConfig.teamAPlayerIds.map((id) => (
                    <div key={id}>• {getPlayerName(id)}</div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-lg font-bold text-slate-900">
                  {session.teamConfig.teamBName || "Team B"}
                </div>
                <div className="mt-3 space-y-1 text-sm text-slate-600">
                  {session.teamConfig.teamBPlayerIds.map((id) => (
                    <div key={id}>• {getPlayerName(id)}</div>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>
        )}

        {teamSummary && (
          <SectionCard title="Tổng điểm team">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">
                  {teamSummary.teamAName}
                </div>
                <div className="mt-2 text-3xl font-bold">
                  {teamSummary.totalScoreA}
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  Trận thắng: {teamSummary.winsA}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">
                  {teamSummary.teamBName}
                </div>
                <div className="mt-2 text-3xl font-bold">
                  {teamSummary.totalScoreB}
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  Trận thắng: {teamSummary.winsB}
                </div>
              </div>
            </div>
          </SectionCard>
        )}

        <SectionCard title="Schedule theo round">
          {roundsWithStatus.length === 0 ? (
            <div className="text-sm text-slate-500">
              Chưa tạo được lịch. Session cần ít nhất 4 người.
            </div>
          ) : (
            <div className="space-y-4">
              {roundsWithStatus.map((round: SessionRound) => {
                const locked = round.round > unlockedRoundNo;

                return (
                  <div
                    key={round.round}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-lg font-bold text-slate-900">
                          Round {round.round}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          {round.completed
                            ? "Đã hoàn thành"
                            : locked
                            ? "Bị khóa cho đến khi hoàn thành round trước"
                            : "Đang mở nhập kết quả"}
                        </div>
                      </div>

                      <div
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          round.completed
                            ? "bg-emerald-100 text-emerald-700"
                            : locked
                            ? "bg-slate-200 text-slate-600"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {round.completed
                          ? "Done"
                          : locked
                          ? "Locked"
                          : "Open"}
                      </div>
                    </div>

                    {round.restingPlayerIds.length > 0 && (
                      <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                        <span className="font-semibold">Nghỉ round này:</span>{" "}
                        {round.restingPlayerIds
                          .map((id) => getPlayerName(id))
                          .join(", ")}
                      </div>
                    )}

                    <div className="mt-4 space-y-3">
                      {round.matches.map((match) => {
                        const value = getFormValue(match);
                        const saved = findSavedMatch(match);

                        return (
                          <div
                            key={match.id}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="font-semibold text-slate-900">
                                Sân {match.court}
                              </div>

                              <div className="text-xs text-slate-500">
                                {saved ? "Đã lưu kết quả" : "Chưa lưu"}
                              </div>
                            </div>

                            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
                              <div className="rounded-2xl bg-white p-4">
                                <div className="text-xs uppercase tracking-wide text-slate-400">
                                  Team A
                                </div>
                                <div className="mt-2 font-semibold text-slate-900">
                                  {match.teamA.map(getPlayerName).join(" + ")}
                                </div>
                              </div>

                              <div className="text-center text-sm font-bold text-slate-400">
                                VS
                              </div>

                              <div className="rounded-2xl bg-white p-4">
                                <div className="text-xs uppercase tracking-wide text-slate-400">
                                  Team B
                                </div>
                                <div className="mt-2 font-semibold text-slate-900">
                                  {match.teamB.map(getPlayerName).join(" + ")}
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-end gap-3">
                              <label className="space-y-2">
                                <div className="text-sm font-medium text-slate-700">
                                  Điểm Team A
                                </div>
                                <input
                                  type="number"
                                  min={0}
                                  value={value.scoreA}
                                  disabled={locked}
                                  onChange={(e) =>
                                    setMatchScore(match, "scoreA", e.target.value)
                                  }
                                  className="w-28 rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none disabled:bg-slate-100"
                                />
                              </label>

                              <label className="space-y-2">
                                <div className="text-sm font-medium text-slate-700">
                                  Điểm Team B
                                </div>
                                <input
                                  type="number"
                                  min={0}
                                  value={value.scoreB}
                                  disabled={locked}
                                  onChange={(e) =>
                                    setMatchScore(match, "scoreB", e.target.value)
                                  }
                                  className="w-28 rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none disabled:bg-slate-100"
                                />
                              </label>

                              <button
                                type="button"
                                disabled={locked}
                                onClick={() => handleSaveMatch(match)}
                                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                              >
                                <Save size={16} />
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
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}

function sameIds(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const aa = [...a].sort();
  const bb = [...b].sort();
  return aa.every((id, idx) => id === bb[idx]);
}