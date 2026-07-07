"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Users,
  Trophy,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import { getPlayers, getSessions } from "@/lib/storage";
import { generateSessionSchedule } from "@/lib/match-generator";
import type { Player, SessionRecord } from "@/types";

function formatDate(value?: string) {
  if (!value) return "Không có ngày";

  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("vi-VN");
  } catch {
    return value;
  }
}

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params?.id ?? "";

  const [refreshSeed, setRefreshSeed] = useState(0);

  const players = useMemo(() => getPlayers(), []);
  const sessions = useMemo(() => getSessions(), []);

  const session: SessionRecord | null =
    sessions.find((item) => item.id === sessionId) ?? null;

  const playerMap = useMemo(() => {
    return new Map(players.map((p) => [p.id, p]));
  }, [players]);

  const participantPlayers: Player[] = useMemo(() => {
    if (!session) return [];
    return (session.participantIds ?? [])
      .map((id) => playerMap.get(id))
      .filter(Boolean) as Player[];
  }, [session, playerMap]);

  const schedule = useMemo(() => {
    if (!session) return null;

    /**
     * refreshSeed dùng để bấm "Tạo lại lịch"
     * => đổi thứ tự participant trước khi generate
     */
    const ids = [...(session.participantIds ?? [])];

    if (ids.length > 1 && refreshSeed > 0) {
      const offset = refreshSeed % ids.length;
      const rotated = [...ids.slice(offset), ...ids.slice(0, offset)];
      return generateSessionSchedule(rotated);
    }

    return generateSessionSchedule(ids);
  }, [session, refreshSeed]);

  if (!session) {
    return (
      <AppShell title="Chi tiết buổi chơi" subtitle="Không tìm thấy session">
        <div className="space-y-4">
          <Link
            href="/session"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600"
          >
            <ArrowLeft size={16} />
            Quay lại danh sách buổi chơi
          </Link>

          <SectionCard title="Thông báo">
            <div className="text-sm text-slate-600">
              Không tìm thấy buổi chơi này.
            </div>
          </SectionCard>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Buổi chơi ${formatDate(session.date)}`}
      subtitle={`Mục tiêu ${session.pointToWin} điểm`}
    >
      <div className="space-y-4">
        <Link
          href="/session"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách buổi chơi
        </Link>

        {/* Tổng quan session */}
        <SectionCard title="Tổng quan buổi chơi">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <CalendarDays size={16} />
                Ngày chơi
              </div>
              <div className="mt-2 text-lg font-bold">
                {formatDate(session.date)}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Trophy size={16} />
                Chạm điểm
              </div>
              <div className="mt-2 text-2xl font-bold">
                {session.pointToWin}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 col-span-2">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Users size={16} />
                Số người tham gia
              </div>
              <div className="mt-2 text-2xl font-bold">
                {participantPlayers.length}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Danh sách người chơi */}
        <SectionCard title="Người tham gia">
          {participantPlayers.length === 0 ? (
            <div className="text-sm text-slate-500">Chưa có người tham gia.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {participantPlayers.map((player) => (
                <div
                  key={player.id}
                  className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700"
                >
                  {player.name}
                  {player.nickname?.trim() ? ` (${player.nickname})` : ""}
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Lịch đấu đề xuất */}
        <SectionCard
          title="Lịch đấu đề xuất"
          action={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRefreshSeed((prev) => prev + 1)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
              >
                <RefreshCw size={16} />
                Tạo lại lịch
              </button>
            </div>
          }
        >
          {!schedule || schedule.totalPlayers < 4 ? (
            <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-700">
              Cần ít nhất 4 người để tạo lịch đấu.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl bg-indigo-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-indigo-700">
                  <Sparkles size={16} />
                  Tóm tắt lịch đấu
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-xl bg-white p-3">
                    <div className="text-slate-500">Số người</div>
                    <div className="mt-1 text-xl font-bold text-slate-900">
                      {schedule.totalPlayers}
                    </div>
                  </div>

                  <div className="rounded-xl bg-white p-3">
                    <div className="text-slate-500">Số round</div>
                    <div className="mt-1 text-xl font-bold text-slate-900">
                      {schedule.totalRounds}
                    </div>
                  </div>

                  <div className="rounded-xl bg-white p-3">
                    <div className="text-slate-500">Chạm điểm</div>
                    <div className="mt-1 text-xl font-bold text-slate-900">
                      {session.pointToWin}
                    </div>
                  </div>
                </div>
              </div>

              {schedule.rounds.map((round) => (
                <div
                  key={round.round}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-base font-bold text-slate-900">
                      Round {round.round}
                    </div>

                    <div className="text-xs text-slate-500">
                      {round.matches.length} trận
                    </div>
                  </div>

                  {round.byePlayerIds.length > 0 && (
                    <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
                      <span className="font-semibold">Nghỉ vòng này:</span>{" "}
                      {round.byePlayerIds
                        .map((id) => playerMap.get(id)?.name ?? "Ẩn danh")
                        .join(", ")}
                    </div>
                  )}

                  <div className="mt-4 space-y-3">
                    {round.matches.map((match) => {
                      const teamAName = match.teamA
                        .map((id) => playerMap.get(id)?.name ?? "Ẩn danh")
                        .join(" + ");

                      const teamBName = match.teamB
                        .map((id) => playerMap.get(id)?.name ?? "Ẩn danh")
                        .join(" + ");

                      return (
                        <div
                          key={`${round.round}-${match.court}`}
                          className="rounded-2xl bg-slate-50 p-4"
                        >
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Sân {match.court}
                          </div>

                          <div className="mt-2 text-base font-semibold text-slate-900">
                            {teamAName}
                          </div>

                          <div className="my-2 text-sm font-medium text-slate-500">
                            VS
                          </div>

                          <div className="text-base font-semibold text-slate-900">
                            {teamBName}
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