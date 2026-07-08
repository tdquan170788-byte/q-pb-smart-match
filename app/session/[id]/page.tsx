"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Save, CalendarDays, Users } from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";

import type { MatchRecord, ScheduledMatch } from "@/types";
import { buildSessionSchedule } from "@/lib/match-generator";
import {
  ensureSeedData,
  getMatches,
  getPlayers,
  getSessions,
  upsertMatchResult,
} from "@/lib/storage";

function getPlayerName(playerId: string) {
  const players = getPlayers();
  return players.find((p) => p.id === playerId)?.name ?? "Ẩn danh";
}

function getExistingMatch(
  matches: MatchRecord[],
  sessionId: string,
  round: number,
  court: number
) {
  return matches.find(
    (m) =>
      m.sessionId === sessionId &&
      m.round === round &&
      (m.court ?? 1) === court
  );
}

export default function SessionDetailPage() {
  ensureSeedData();

  const params = useParams<{ id: string }>();
  const sessionId = params?.id ?? "";

  const [refreshKey, setRefreshKey] = useState(0);

  const session = useMemo(() => {
    const sessions = getSessions();
    return sessions.find((s) => s.id === sessionId) ?? null;
  }, [sessionId, refreshKey]);

  const matches = useMemo(() => getMatches(), [refreshKey]);

  const schedule = useMemo(() => {
    if (!session) return { rounds: [] };
    return buildSessionSchedule(session.participantIds ?? []);
  }, [session, refreshKey]);

  const [scoreMap, setScoreMap] = useState<Record<string, { scoreA: string; scoreB: string }>>({});

  if (!session) {
    return (
      <AppShell title="Chi tiết session" subtitle="Không tìm thấy session">
        <div className="space-y-4">
          <Link
            href="/session"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600"
          >
            <ArrowLeft size={16} />
            Quay lại Session
          </Link>

          <SectionCard title="Thông báo">
            <div className="text-sm text-slate-600">Session không tồn tại.</div>
          </SectionCard>
        </div>
      </AppShell>
    );
  }

  const participants = session.participantIds ?? [];

  return (
    <AppShell
      title={`Session ${session.date || ""}`}
      subtitle={`Đánh tới ${session.pointToWin} điểm`}
    >
      <div className="space-y-4">
        <Link
          href="/session"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600"
        >
          <ArrowLeft size={16} />
          Quay lại Session
        </Link>

        <SectionCard title="Thông tin buổi chơi">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <CalendarDays size={16} />
                Ngày chơi
              </div>
              <div className="mt-2 text-xl font-bold">{session.date}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Users size={16} />
                Người tham gia
              </div>
              <div className="mt-2 text-xl font-bold">{participants.length}</div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <div className="text-sm font-medium text-slate-700">Danh sách người chơi</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {participants.map((id) => (
                <span
                  key={id}
                  className="rounded-full bg-white px-3 py-1 text-sm text-slate-700 shadow-sm"
                >
                  {getPlayerName(id)}
                </span>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Schedule theo round">
          {schedule.rounds.length === 0 ? (
            <div className="text-sm text-slate-500">
              Session này chưa đủ 4 người để tạo lịch.
            </div>
          ) : (
            <div className="space-y-4">
              {schedule.rounds.map((round) => (
                <div
                  key={round.round}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="text-base font-bold text-slate-900">
                    Round {round.round}
                  </div>

                  <div className="mt-3 space-y-3">
                    {round.matches.map((match: ScheduledMatch) => {
                      const existing = getExistingMatch(
                        matches,
                        session.id,
                        match.round,
                        match.court
                      );

                      const inputKey = `${match.round}_${match.court}`;
                      const scoreA =
                        scoreMap[inputKey]?.scoreA ??
                        (existing ? String(existing.scoreA) : "");
                      const scoreB =
                        scoreMap[inputKey]?.scoreB ??
                        (existing ? String(existing.scoreB) : "");

                      return (
                        <div
                          key={`${match.round}_${match.court}`}
                          className="rounded-2xl border border-slate-200 bg-white p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold text-slate-900">
                              Sân {match.court}
                            </div>

                            {existing ? (
                              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                Đã lưu
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                Chưa nhập điểm
                              </span>
                            )}
                          </div>

                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <div className="rounded-2xl bg-slate-50 p-3">
                              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Team A
                              </div>
                              <div className="mt-2 text-sm font-medium text-slate-900">
                                {match.teamA.map(getPlayerName).join(" / ")}
                              </div>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-3">
                              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Team B
                              </div>
                              <div className="mt-2 text-sm font-medium text-slate-900">
                                {match.teamB.map(getPlayerName).join(" / ")}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center gap-3">
                            <input
                              inputMode="numeric"
                              value={scoreA}
                              onChange={(e) =>
                                setScoreMap((prev) => ({
                                  ...prev,
                                  [inputKey]: {
                                    scoreA: e.target.value,
                                    scoreB: prev[inputKey]?.scoreB ?? scoreB,
                                  },
                                }))
                              }
                              className="w-20 rounded-xl border border-slate-300 px-3 py-2 text-center text-lg font-bold outline-none"
                              placeholder="0"
                            />

                            <div className="text-lg font-bold text-slate-500">-</div>

                            <input
                              inputMode="numeric"
                              value={scoreB}
                              onChange={(e) =>
                                setScoreMap((prev) => ({
                                  ...prev,
                                  [inputKey]: {
                                    scoreA: prev[inputKey]?.scoreA ?? scoreA,
                                    scoreB: e.target.value,
                                  },
                                }))
                              }
                              className="w-20 rounded-xl border border-slate-300 px-3 py-2 text-center text-lg font-bold outline-none"
                              placeholder="0"
                            />

                            <button
                              type="button"
                              onClick={() => {
                                const nextA = Number(scoreA || 0);
                                const nextB = Number(scoreB || 0);

                                upsertMatchResult({
                                  sessionId: session.id,
                                  round: match.round,
                                  court: match.court,
                                  teamA: match.teamA,
                                  teamB: match.teamB,
                                  scoreA: nextA,
                                  scoreB: nextB,
                                });

                                setRefreshKey((v) => v + 1);
                              }}
                              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                            >
                              <Save size={16} />
                              Lưu điểm
                            </button>
                          </div>
                        </div>
                      );
                    })}
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