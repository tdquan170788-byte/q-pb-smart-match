"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Clock3, Trophy, Users } from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import type { MatchRecord, Player, SessionRecord } from "@/types";
import {
  getMatchesBySessionId,
  getPlayers,
  getSessionById,
} from "@/lib/storage";

type Props = {
  params: {
    id: string;
  };
};

export default function SessionDetailPage({ params }: Props) {
  const sessionId = params.id;

  const [session, setSession] = useState<SessionRecord | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const currentSession = getSessionById(sessionId) ?? null;
    setSession(currentSession);
    setPlayers(getPlayers());
    setMatches(getMatchesBySessionId(sessionId));
    setLoaded(true);
  }, [sessionId]);

  const playerMap = useMemo(() => {
    return new Map(players.map((p) => [p.id, p]));
  }, [players]);

  const participantNames = useMemo(() => {
    if (!session) return [];
    return session.participantIds.map((id) => playerMap.get(id)?.name ?? "Unknown");
  }, [session, playerMap]);

  function getTeamLabel(playerIds: string[]) {
    return playerIds.map((id) => playerMap.get(id)?.name ?? "Unknown").join(" / ");
  }

  if (!loaded) {
    return (
      <AppShell title="Chi tiết buổi chơi" subtitle="Đang tải dữ liệu">
        <SectionCard title="Đang tải">
          <div className="text-sm text-slate-500">Đang tải dữ liệu buổi chơi...</div>
        </SectionCard>
      </AppShell>
    );
  }

  if (!session) {
    return (
      <AppShell title="Chi tiết buổi chơi" subtitle="Không tìm thấy session">
        <SectionCard title="Không tìm thấy buổi chơi">
          <div className="space-y-3">
            <div className="text-sm text-slate-500">
              Session này không tồn tại hoặc đã bị xoá.
            </div>
            <Link
              href="/sessions/history"
              className="inline-flex rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white"
            >
              Quay về lịch sử buổi chơi
            </Link>
          </div>
        </SectionCard>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Buổi chơi ${session.date}`}
      subtitle="Chi tiết session và các trận đã nhập"
    >
      <div className="space-y-4">
        <div>
          <Link
            href="/sessions/history"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            <ArrowLeft size={16} />
            Quay lại lịch sử
          </Link>
        </div>

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
                Điểm chạm
              </div>
              <div className="mt-2 text-xl font-bold">{session.pointToWin}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Users size={16} />
                Người tham gia
              </div>
              <div className="mt-2 text-xl font-bold">
                {session.participantIds.length}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock3 size={16} />
                Số trận
              </div>
              <div className="mt-2 text-xl font-bold">{matches.length}</div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-700">Danh sách người tham gia</div>
            <div className="mt-2 text-sm text-slate-600">
              {participantNames.length > 0
                ? participantNames.join(", ")
                : "Chưa có thành viên"}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Các trận trong buổi">
          {matches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
              <div className="text-base font-semibold">Chưa có trận nào</div>
              <div className="mt-1 text-sm text-slate-500">
                Buổi này đã tạo nhưng chưa nhập kết quả trận đấu.
              </div>
              <Link
                href="/sessions"
                className="mt-4 inline-flex rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white"
              >
                Sang màn nhập trận
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((match) => {
                const teamALabel = getTeamLabel(match.teamA.playerIds);
                const teamBLabel = getTeamLabel(match.teamB.playerIds);

                const teamAWin = match.scoreA > match.scoreB;
                const teamBWin = match.scoreB > match.scoreA;

                return (
                  <div
                    key={match.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-700">
                        Trận {match.round}
                      </div>
                      <div className="text-xs text-slate-400">
                        {session.date}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div
                        className={`rounded-2xl px-3 py-3 ${
                          teamAWin ? "bg-green-50" : "bg-white"
                        }`}
                      >
                        <div className="text-sm font-semibold text-slate-800">
                          {teamALabel}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Team A
                          {teamAWin ? " • Thắng" : ""}
                        </div>
                      </div>

                      <div className="flex items-center justify-center">
                        <div className="rounded-2xl bg-brand-600 px-4 py-2 text-lg font-bold text-white">
                          {match.scoreA} - {match.scoreB}
                        </div>
                      </div>

                      <div
                        className={`rounded-2xl px-3 py-3 ${
                          teamBWin ? "bg-green-50" : "bg-white"
                        }`}
                      >
                        <div className="text-sm font-semibold text-slate-800">
                          {teamBLabel}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Team B
                          {teamBWin ? " • Thắng" : ""}
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