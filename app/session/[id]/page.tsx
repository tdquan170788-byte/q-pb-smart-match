"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Users,
  Target,
  Sparkles,
} from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import {
  getPlayers,
  getSessions,
  getMatches,
  addMatch,
} from "@/lib/storage";
import {
  buildSessionSchedule,
  type SessionRound,
  type ScheduledMatch,
} from "@/lib/scheduler";
import type { Player, SessionRecord } from "@/types";

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params?.id ?? "";

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setRefreshKey((v) => v + 1);
  }, [sessionId]);

  const data = useMemo(() => {
    const sessions = getSessions();
    const players = getPlayers();
    const matches = getMatches();

    const session = sessions.find((item) => item.id === sessionId) ?? null;
    const playerMap = new Map(players.map((p) => [p.id, p]));

    if (!session) {
      return {
        session: null as SessionRecord | null,
        participantPlayers: [] as Player[],
        schedule: {
          rounds: [] as SessionRound[],
          restingPlayerIdsByRound: {} as Record<number, string[]>,
          totalRounds: 0,
        },
        existingMatchCount: 0,
      };
    }

    const participantPlayers = (session.participantIds ?? [])
      .map((id) => playerMap.get(id))
      .filter(Boolean) as Player[];

    const schedule = buildSessionSchedule(session.participantIds ?? []);

    const existingMatchCount = matches.filter(
      (m) => m.sessionId === session.id
    ).length;

    return {
      session,
      participantPlayers,
      schedule,
      existingMatchCount,
    };
  }, [sessionId, refreshKey]);

  const handleGenerateMatches = () => {
    if (!data.session) return;

    const session = data.session;
    const rounds = data.schedule.rounds;

    if (rounds.length === 0) {
      alert("Không có lịch để tạo trận.");
      return;
    }

    const currentMatches = getMatches().filter((m) => m.sessionId === session.id);
    if (currentMatches.length > 0) {
      const confirmed = window.confirm(
        "Session này đã có trận đấu. Bạn vẫn muốn thêm toàn bộ lịch mới?"
      );
      if (!confirmed) return;
    }

    for (const round of rounds) {
      for (const match of round.matches) {
        addMatch({
          sessionId: session.id,
          round: round.round,
          teamA: {
            playerIds: match.teamA,
          },
          teamB: {
            playerIds: match.teamB,
          },
          scoreA: 0,
          scoreB: 0,
          createdAt: new Date().toISOString(),
        });
      }
    }

    alert("Đã tạo trận từ lịch thi đấu.");
    setRefreshKey((v) => v + 1);
  };

  if (!data.session) {
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
              Session không tồn tại hoặc đã bị xóa.
            </div>
          </SectionCard>
        </div>
      </AppShell>
    );
  }

  const session = data.session;
  const participantCount = data.participantPlayers.length;

  return (
    <AppShell
      title={`Session ${session.date || ""}`}
      subtitle="Chi tiết buổi chơi & lịch thi đấu"
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
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <CalendarDays size={16} />
                Ngày chơi
              </div>
              <div className="mt-2 text-lg font-bold">
                {session.date || "--"}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Target size={16} />
                Điểm thắng
              </div>
              <div className="mt-2 text-lg font-bold">
                {session.pointToWin} điểm
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Users size={16} />
                Số người
              </div>
              <div className="mt-2 text-lg font-bold">{participantCount}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Sparkles size={16} />
                Trận đã tạo
              </div>
              <div className="mt-2 text-lg font-bold">
                {data.existingMatchCount}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Danh sách người chơi">
          {data.participantPlayers.length === 0 ? (
            <div className="text-sm text-slate-500">Chưa có người chơi.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data.participantPlayers.map((player) => (
                <span
                  key={player.id}
                  className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700"
                >
                  {player.name}
                  {player.nickname ? ` (${player.nickname})` : ""}
                </span>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Lịch thi đấu đề xuất"
          action={
            <button
              type="button"
              onClick={handleGenerateMatches}
              className="rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white"
            >
              Tạo trận từ lịch
            </button>
          }
        >
          {data.schedule.rounds.length === 0 ? (
            <div className="text-sm text-slate-500">
              Chưa tạo được lịch thi đấu cho session này.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl bg-brand-50 p-4 text-sm text-brand-700">
                Tổng số round đề xuất:{" "}
                <span className="font-bold">{data.schedule.totalRounds}</span>
              </div>

              {data.schedule.rounds.map((round: SessionRound) => {
                const restingIds =
                  data.schedule.restingPlayerIdsByRound?.[round.round] ?? [];

                return (
                  <div
                    key={round.round}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-base font-semibold">
                        Round {round.round}
                      </div>

                      <div className="text-sm text-slate-500">
                        {round.matches.length} sân
                      </div>
                    </div>

                    {restingIds.length > 0 ? (
                      <div className="mt-2 text-sm text-amber-700">
                        Nghỉ lượt:{" "}
                        {restingIds
                          .map((id) => {
                            const p = data.participantPlayers.find(
                              (player) => player.id === id
                            );
                            return p?.name ?? "Ẩn danh";
                          })
                          .join(", ")}
                      </div>
                    ) : null}

                    <div className="mt-4 space-y-3">
                      {round.matches.map(
                        (match: ScheduledMatch, matchIndex: number) => {
                          const teamAName = match.teamA
                            .map((id) => {
                              const p = data.participantPlayers.find(
                                (player) => player.id === id
                              );
                              return p?.name ?? "Ẩn danh";
                            })
                            .join(" / ");

                          const teamBName = match.teamB
                            .map((id) => {
                              const p = data.participantPlayers.find(
                                (player) => player.id === id
                              );
                              return p?.name ?? "Ẩn danh";
                            })
                            .join(" / ");

                          return (
                            <div
                              key={`${round.round}-${matchIndex}`}
                              className="rounded-2xl bg-slate-50 p-4"
                            >
                              <div className="mb-2 text-sm font-medium text-slate-500">
                                Sân {match.court}
                              </div>

                              <div className="text-base font-semibold text-slate-900">
                                {teamAName}
                              </div>

                              <div className="my-2 text-center text-sm font-bold text-brand-600">
                                VS
                              </div>

                              <div className="text-base font-semibold text-slate-900">
                                {teamBName}
                              </div>
                            </div>
                          );
                        }
                      )}
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