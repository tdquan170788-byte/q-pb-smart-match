"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import StatCard from "@/components/stat-card";
import {
  ensureSeedPlayers,
  getMatches,
  getPlayers,
  getSessions,
} from "@/lib/storage";

export default function HomePage() {
  const [playersCount, setPlayersCount] = useState(0);
  const [sessionsCount, setSessionsCount] = useState(0);
  const [matchesCount, setMatchesCount] = useState(0);

  useEffect(() => {
    ensureSeedPlayers();
    setPlayersCount(getPlayers().length);
    setSessionsCount(getSessions().length);
    setMatchesCount(getMatches().length);
  }, []);

  const today = useMemo(() => {
    return new Date().toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, []);

  const playerNames = useMemo(() => {
    return getPlayers()
      .slice(0, 8)
      .map((p) => p.name);
  }, []);

  return (
    <AppShell title="Q-PB Smart Match" subtitle={today}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Thành viên"
            value={playersCount}
            hint="Đã seed sẵn dữ liệu mẫu"
          />
          <StatCard
            label="Buổi chơi"
            value={sessionsCount}
            hint="Session đã tạo"
          />
          <StatCard
            label="Trận đã lưu"
            value={matchesCount}
            hint="MVP đang mở rộng"
          />
          <StatCard
            label="Chế độ"
            value="Sprint 5"
            hint="Local storage"
          />
        </div>

        <SectionCard title="Trạng thái dự án">
          <div className="space-y-2 text-sm text-slate-600">
            <div>✅ Bộ khung app đã sẵn sàng.</div>
            <div>➡️ Sprint 5 Phase 1: hoàn thiện luồng thành viên + session cơ bản.</div>
            <div>🎯 Mục tiêu: app chạy ổn định trên iPhone qua Vercel.</div>
          </div>
        </SectionCard>

        <SectionCard title="Dữ liệu mẫu">
          <div className="flex flex-wrap gap-2">
            {playerNames.map((name) => (
              <span
                key={name}
                className="rounded-full bg-brand-50 px-3 py-2 text-sm text-brand-700"
              >
                {name}
              </span>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}