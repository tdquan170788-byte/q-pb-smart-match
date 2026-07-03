"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronRight, Clock3, History, Users } from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import type { Player, SessionRecord } from "@/types";
import { getPlayers, getSessions, getMatchesBySessionId } from "@/lib/storage";

type SessionView = SessionRecord & {
  participantNames: string[];
  totalMatches: number;
};

export default function SessionsHistoryPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSessions(getSessions());
    setPlayers(getPlayers());
    setLoaded(true);
  }, []);

  const sessionViews = useMemo<SessionView[]>(() => {
    const playerMap = new Map(players.map((p) => [p.id, p]));

    return [...sessions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((session) => {
        const participantNames = session.participantIds.map(
          (id) => playerMap.get(id)?.name ?? "Unknown"
        );

        const totalMatches = getMatchesBySessionId(session.id).length;

        return {
          ...session,
          participantNames,
          totalMatches,
        };
      });
  }, [sessions, players]);

  return (
    <AppShell
      title="Lịch sử buổi chơi"
      subtitle="Xem lại các session đã tạo và số trận đã nhập"
    >
      <div className="space-y-4">
        <SectionCard title="Tổng quan">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Số buổi chơi</div>
              <div className="mt-2 text-3xl font-bold">{sessions.length}</div>
              <div className="mt-1 text-xs text-slate-400">
                Tổng số session đã lưu
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Trạng thái dữ liệu</div>
              <div className="mt-2 text-lg font-bold">
                {loaded ? "Đã tải" : "Đang tải..."}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Lưu cục bộ trên thiết bị
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Danh sách buổi chơi">
          {sessionViews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <History className="text-slate-500" size={22} />
              </div>
              <div className="text-base font-semibold">Chưa có buổi chơi nào</div>
              <div className="mt-1 text-sm text-slate-500">
                Hãy tạo buổi chơi đầu tiên trong mục Sessions.
              </div>
              <Link
                href="/sessions"
                className="mt-4 inline-flex rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white"
              >
                Tạo buổi chơi
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sessionViews.map((session, index) => (
                <Link
                  key={session.id}
                  href={`/sessions/${session.id}`}
                  className="block rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:bg-slate-100"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                          {index + 1}
                        </div>

                        <div className="min-w-0">
                          <div className="text-base font-semibold">
                            Buổi chơi {session.date}
                          </div>
                          <div className="text-sm text-slate-500">
                            Điểm chạm: {session.pointToWin}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                        <div className="rounded-2xl bg-white px-3 py-2 text-slate-600">
                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Users size={12} />
                            Người tham gia
                          </div>
                          <div className="mt-1 font-semibold">
                            {session.participantIds.length}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-white px-3 py-2 text-slate-600">
                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Clock3 size={12} />
                            Số trận
                          </div>
                          <div className="mt-1 font-semibold">
                            {session.totalMatches}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-white px-3 py-2 text-slate-600">
                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <CalendarDays size={12} />
                            Ngày
                          </div>
                          <div className="mt-1 font-semibold">{session.date}</div>
                        </div>
                      </div>

                      <div className="mt-3 text-sm text-slate-500">
                        <span className="font-medium text-slate-700">Thành viên:</span>{" "}
                        {session.participantNames.length > 0
                          ? session.participantNames.join(", ")
                          : "Chưa có"}
                      </div>
                    </div>

                    <div className="shrink-0 rounded-xl bg-white p-2 text-slate-500">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}