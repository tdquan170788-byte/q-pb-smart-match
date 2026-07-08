"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, Save, Users } from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import type { Player } from "@/types";
import {
  ensureSeedData,
  findMatchBySessionRoundCourt,
  getPlayers,
  getSessionById,
  updateSession,
  upsertMatchResult,
} from "@/lib/storage";
import {
  buildSessionSchedule,
  type SessionRound,
  type ScheduledMatch,
} from "@/lib/scheduler";

type MatchFormState = Record<
  string,
  {
    scoreA: string;
    scoreB: string;
  }
>;

function makeMatchKey(round: number, court?: number) {
  return `${round}_${court ?? 1}`;
}

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params?.id ?? "";

  const [players, setPlayers] = useState<Player[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [matchForms, setMatchForms] = useState<MatchFormState>({});
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    ensureSeedData();
    setPlayers(getPlayers());
  }, []);

  const session = useMemo(() => getSessionById(sessionId), [sessionId, reloadKey]);

  const playerMap = useMemo(() => {
    return new Map(players.map((p) => [p.id, p]));
  }, [players]);

  const participantPlayers = useMemo(() => {
    if (!session) return [];
    return session.participantIds
      .map((id) => playerMap.get(id))
      .filter(Boolean) as Player[];
  }, [session, playerMap]);

  const schedule = useMemo(() => {
    if (!session) {
      return {
        rounds: [],
        restingPlayerIdsByRound: {},
        totalRounds: 0,
      };
    }

    return buildSessionSchedule(session.participantIds);
  }, [session]);

  useEffect(() => {
    if (!session) return;

    const nextForms: MatchFormState = {};
    const nextSavedMap: Record<string, boolean> = {};

    for (const round of schedule.rounds) {
      for (const match of round.matches) {
        const key = makeMatchKey(match.round, match.court);
        const existing = findMatchBySessionRoundCourt(
          session.id,
          match.round,
          match.court
        );

        nextForms[key] = {
          scoreA: existing ? String(existing.scoreA) : "",
          scoreB: existing ? String(existing.scoreB) : "",
        };

        nextSavedMap[key] = Boolean(existing);
      }
    }

    setMatchForms(nextForms);
    setSavedMap(nextSavedMap);
  }, [session, schedule]);

  if (!session) {
    return (
      <AppShell title="Chi tiết buổi chơi" subtitle="Không tìm thấy session">
        <div className="space-y-4">
          <Link
            href="/session"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600"
          >
            <ArrowLeft size={16} />
            Quay lại danh sách session
          </Link>

          <SectionCard title="Thông báo">
            <div className="text-sm text-slate-600">Không tìm thấy session.</div>
          </SectionCard>
        </div>
      </AppShell>
    );
  }

  const handleChangeScore = (
    round: number,
    court: number | undefined,
    side: "A" | "B",
    value: string
  ) => {
    const key = makeMatchKey(round, court);

    setMatchForms((prev) => ({
      ...prev,
      [key]: {
        scoreA: side === "A" ? value : prev[key]?.scoreA ?? "",
        scoreB: side === "B" ? value : prev[key]?.scoreB ?? "",
      },
    }));
  };

  const handleSaveMatch = (match: ScheduledMatch) => {
    const key = makeMatchKey(match.round, match.court);
    const form = matchForms[key];

    const scoreA = Number(form?.scoreA ?? "");
    const scoreB = Number(form?.scoreB ?? "");

    if (Number.isNaN(scoreA) || Number.isNaN(scoreB)) {
      alert("Vui lòng nhập điểm hợp lệ cho cả hai đội.");
      return;
    }

    upsertMatchResult({
      sessionId: session.id,
      round: match.round,
      court: match.court,
      teamAPlayerIds: match.teamA,
      teamBPlayerIds: match.teamB,
      scoreA,
      scoreB,
    });

    updateSession(session.id, {
      status: "in_progress",
    });

    setSavedMap((prev) => ({
      ...prev,
      [key]: true,
    }));

    setReloadKey((v) => v + 1);
    alert("Đã lưu kết quả trận.");
  };

  const getPlayerName = (playerId: string) => {
    return playerMap.get(playerId)?.name ?? "Ẩn danh";
  };

  const getRestingNames = (roundNumber: number) => {
    const ids = schedule.restingPlayerIdsByRound[roundNumber] ?? [];
    if (ids.length === 0) return [];
    return ids.map((id) => getPlayerName(id));
  };

  return (
    <AppShell
      title={`Session ${session.date}`}
      subtitle={`Điểm chạm: ${session.pointToWin} · ${participantPlayers.length} người`}
    >
      <div className="space-y-4">
        <Link
          href="/session"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách session
        </Link>

        <SectionCard title="Thông tin buổi chơi">
          <div className="grid grid-cols-2 gap-3">
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
                Người tham gia
              </div>
              <div className="mt-2 text-lg font-bold">
                {participantPlayers.length}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <div className="text-sm font-medium text-slate-700">
              Danh sách người chơi
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {participantPlayers.map((player) => (
                <span
                  key={player.id}
                  className="rounded-full bg-white px-3 py-1 text-sm text-slate-700 shadow-sm"
                >
                  {player.name}
                </span>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Lịch thi đấu & nhập kết quả"
          action={
            <span className="text-xs font-medium text-slate-500">
              {schedule.totalRounds} rounds
            </span>
          }
        >
          {schedule.rounds.length === 0 ? (
            <div className="text-sm text-slate-500">
              Chưa đủ người để tạo lịch thi đấu.
            </div>
          ) : (
            <div className="space-y-4">
              {schedule.rounds.map((round: SessionRound) => {
                const restingNames = getRestingNames(round.round);

                return (
                  <div
                    key={round.round}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-base font-bold text-slate-900">
                          Round {round.round}
                        </div>
                        <div className="text-sm text-slate-500">
                          {round.matches.length} trận
                        </div>
                      </div>

                      {restingNames.length > 0 && (
                        <div className="text-right text-xs text-amber-700">
                          Nghỉ: {restingNames.join(", ")}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 space-y-4">
                      {round.matches.map((match: ScheduledMatch) => {
                        const key = makeMatchKey(match.round, match.court);
                        const form = matchForms[key] ?? {
                          scoreA: "",
                          scoreB: "",
                        };
                        const isSaved = savedMap[key] ?? false;

                        return (
                          <div
                            key={`${match.round}-${match.court}`}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm font-semibold text-slate-800">
                                Sân {match.court ?? 1}
                              </div>

                              {isSaved ? (
                                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                  Đã lưu
                                </span>
                              ) : (
                                <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                                  Chưa lưu
                                </span>
                              )}
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                              <div className="rounded-2xl bg-white p-4">
                                <div className="text-sm font-semibold text-slate-700">
                                  Đội A
                                </div>
                                <div className="mt-2 text-sm text-slate-600">
                                  {match.teamA.map(getPlayerName).join(" / ")}
                                </div>

                                <div className="mt-3">
                                  <label className="text-xs text-slate-500">
                                    Điểm đội A
                                  </label>
                                  <input
                                    type="number"
                                    inputMode="numeric"
                                    value={form.scoreA}
                                    onChange={(e) =>
                                      handleChangeScore(
                                        match.round,
                                        match.court,
                                        "A",
                                        e.target.value
                                      )
                                    }
                                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                                  />
                                </div>
                              </div>

                              <div className="rounded-2xl bg-white p-4">
                                <div className="text-sm font-semibold text-slate-700">
                                  Đội B
                                </div>
                                <div className="mt-2 text-sm text-slate-600">
                                  {match.teamB.map(getPlayerName).join(" / ")}
                                </div>

                                <div className="mt-3">
                                  <label className="text-xs text-slate-500">
                                    Điểm đội B
                                  </label>
                                  <input
                                    type="number"
                                    inputMode="numeric"
                                    value={form.scoreB}
                                    onChange={(e) =>
                                      handleChangeScore(
                                        match.round,
                                        match.court,
                                        "B",
                                        e.target.value
                                      )
                                    }
                                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 flex justify-end">
                              <button
                                onClick={() => handleSaveMatch(match)}
                                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                              >
                                <Save size={16} />
                                {isSaved ? "Cập nhật kết quả" : "Lưu kết quả"}
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