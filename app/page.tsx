"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Trophy, Users } from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import StatCard from "@/components/stat-card";
import { ensureSeedData, getMatches, getPlayers, getSessions } from "@/lib/storage";

export default function HomePage() {
  const [loaded, setLoaded] = useState(false);
  const [playerCount, setPlayerCount] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [matchCount, setMatchCount] = useState(0);

  useEffect(() => {
    ensureSeedData();

    const players = getPlayers();
    const sessions = getSessions();
    const matches = getMatches();

    setPlayerCount(players.length);
    setSessionCount(sessions.length);
    setMatchCount(matches.length);
    setLoaded(true);
  }, []);

  const dashboardCards = useMemo(
    () => [
      {
        label: "Thành viên",
        value: playerCount,
        hint: "Danh sách người chơi hiện có",
      },
      {
        label: "Buổi chơi",
        value: sessionCount,
        hint: "Tổng số session đã tạo",
      },
      {
        label: "Trận đấu",
        value: matchCount,
        hint: "Tổng số trận đã lưu",
      },
    ],
    [playerCount, sessionCount, matchCount]
  );

  return (
    <AppShell
      title="Q-PB Smart Match"
      subtitle="Quản lý thành viên, session và xếp lịch pickleball"
    >
      <div className="space-y-4">
        <SectionCard title="Tổng quan">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {dashboardCards.map((item) => (
              <StatCard
                key={item.label}
                label={item.label}
                value={item.value}
                hint={item.hint}
              />
            ))}
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            {loaded
              ? "Dữ liệu đã được tải từ localStorage trên thiết bị hiện tại."
              : "Đang tải dữ liệu..."}
          </div>
        </SectionCard>

        <SectionCard title="Đi nhanh">
          <div className="grid grid-cols-1 gap-3">
            <Link
              href="/members"
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4"
            >
              <div>
                <div className="font-semibold text-slate-900">Quản lý thành viên</div>
                <div className="text-sm text-slate-500">
                  Thêm / sửa / xoá người chơi
                </div>
              </div>
              <Users className="text-slate-500" size={20} />
            </Link>

            <Link
              href="/session"
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4"
            >
              <div>
                <div className="font-semibold text-slate-900">Buổi chơi</div>
                <div className="text-sm text-slate-500">
                  Tạo session và xếp lịch thi đấu
                </div>
              </div>
              <CalendarDays className="text-slate-500" size={20} />
            </Link>

            <Link
              href="/ranking"
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4"
            >
              <div>
                <div className="font-semibold text-slate-900">Bảng xếp hạng</div>
                <div className="text-sm text-slate-500">
                  Xem thành tích và thống kê
                </div>
              </div>
              <Trophy className="text-slate-500" size={20} />
            </Link>
          </div>
        </SectionCard>

        <SectionCard title="Ghi chú">
          <div className="space-y-2 text-sm text-slate-600">
            <div>• Dữ liệu hiện đang lưu cục bộ bằng localStorage.</div>
            <div>• Có thể tạo session, sinh lịch và lưu kết quả trận.</div>
            <div>• Ranking và chi tiết thành viên lấy dữ liệu từ match history.</div>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}