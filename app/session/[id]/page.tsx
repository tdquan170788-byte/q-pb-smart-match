"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, Trophy, Users } from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import {
  getMatchesBySession,
  getPlayers,
  getSessionById,
} from "@/lib/storage";

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params?.id ?? "";

  const session = useMemo(() => getSessionById(sessionId), [sessionId]);
  const matches = useMemo(() => getMatchesBySession(sessionId), [sessionId]);
  const players = useMemo(() => getPlayers(), []);

  const playerMap = useMemo(() => {
    return new Map(players.map((player) => [player.id, player]));
  }, [players]);

  if (!session) {
    return (
      <AppShell title="Chi tiết buổi chơi" subtitle="Không tìm thấy buổi chơi">
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

  const participantNames = session.participantIds.map(
    (id) => playerMap.get(id)?.name ?? "Ẩn danh"
  );

  return (
    <AppShell
      title={`Buổi ${session.date}`}
      subtitle={`Điểm chạm đích: ${session.pointToWin}`}
    >
      <div className="space-y-4">
        <Link
          href="/session"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách buổi chơi
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
                <Trophy size={16} />
                Điểm thắng
              </div>
              <div className="mt-2 text-xl font-bold">{session.pointToWin}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 col-span-2">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Users size={16} />
                Số người tham gia
              </div>
              <div className="mt-2 text-2xl font-bold">
                {session.participantIds.length}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Danh sách người tham gia">
          {participantNames.length === 0 ? (
            <div className="text-sm text-slate-500">Chưa có người tham gia.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {participantNames.map((name, index) => (
                <span
                  key={`${name}-${index}`}
                  className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700"
                >
                  {name}
                </span>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Danh sách trận đấu">
          {matches.length === 0 ? (
            <div className="text-sm text-slate-500">
              Buổi này chưa có trận nào được ghi.
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((match) => {
                const teamA = match.teamA.playerIds.map(
                  (id) => playerMap.get(id)?.name ?? "Ẩn danh"
                );
                const teamB = match.teamB.playerIds.map(
                  (id) => playerMap.get(id)?.name ?? "Ẩn danh"
                );

                return (
                  <div
                    key={match.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold">
                        Round {match.round}
                      </div>
                      <div className="text-lg font-bold">
                        {match.scoreA} - {match.scoreB}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-sm">
                      <div className="rounded-2xl bg-slate-50 p-3 text-center">
                        <div className="font-semibold">Đội A</div>
                        <div className="mt-1 text-slate-600">
                          {teamA.join(" / ")}
                        </div>
                      </div>

                      <div className="text-slate-400 font-semibold">VS</div>

                      <div className="rounded-2xl bg-slate-50 p-3 text-center">
                        <div className="font-semibold">Đội B</div>
                        <div className="mt-1 text-slate-600">
                          {teamB.join(" / ")}
                        </div>
                      </div>
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