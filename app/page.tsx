"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/app-shell";
import StatCard from "@/components/stat-card";
import SectionCard from "@/components/section-card";
import { ensureSeedData, getMatches, getPlayers, getSessions } from "@/lib/storage";

export default function HomePage() {
  const [playersCount, setPlayersCount] = useState(0);
  const [sessionsCount, setSessionsCount] = useState(0);
  const [matchesCount, setMatchesCount] = useState(0);

  useEffect(() => {
    ensureSeedData();
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

  return (
    <AppShell title="Q-PB Smart Match" subtitle={today}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Thành viên" value={playersCount} hint="Đã seed sẵn 8 người" />
          <StatCard label="Buổi chơi" value={sessionsCount} hint="Sẽ tạo ở Sprint kế tiếp" />
          <StatCard label="Trận đã lưu" value={matchesCount} hint="MVP đang xây dựng" />
          <StatCard label="Chế độ" value="MVP v0.1" hint="Local storage" />
        </div>

        <SectionCard title="Trạng thái dự án">
          <div className="space-y-2 text-sm text-slate-600">
            <p>✅ Bộ khung app đã sẵn sàng.</p>
            <p>🔜 Sprint tiếp theo: CRUD thành viên + tạo buổi chơi.</p>
            <p>🎯 Mục tiêu: sớm có bản dùng được trên iPhone.</p>
          </div>
        </SectionCard>

        <SectionCard title="Dữ liệu mẫu">
          <div className="flex flex-wrap gap-2">
            {["Thuỵ", "Sơn", "Đức", "Cường", "Tùng", "Quân", "Kon", "Vũ"].map((name) => (
              <span
                key={name}
                className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700"
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