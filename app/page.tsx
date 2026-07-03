"use client";

import { useEffect, useState } from "react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import StatCard from "@/components/stat-card";
import {
  ensureSeedData,
  getMatches,
  getPlayers,
  getSessions,
} from "@/lib/storage";

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

  return (
    <AppShell
      title="Q-PB Smart Match"
      subtitle={new Date().toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            title="Thành viên"
            value={playersCount}
            note={`Đã seed sẵn ${playersCount} người`}
          />
          <StatCard
            title="Buổi chơi"
            value={sessionsCount}
            note="Sẽ tạo ở Sprint kế tiếp"
          />
          <StatCard
            title="Trận đã lưu"
            value={matchesCount}
            note="MVP đang xây dựng"
          />
          <StatCard title="Chế độ" value="MVP v0.2" note="Local storage" />
        </div>

        <SectionCard title="Trạng thái dự án">
          <div className="space-y-2 text-sm text-slate-600">
            <div>✅ Bộ khung app đã sẵn sàng.</div>
            <div>✅ Sprint 2: CRUD thành viên + localStorage đã hoạt động.</div>
            <div>➡ Sprint tiếp theo: tạo buổi chơi + chọn người tham gia.</div>
            <div>🎯 Mục tiêu: sớm có bản dùng ổn định trên iPhone.</div>
          </div>
        </SectionCard>

        <SectionCard title="Dữ liệu mẫu">
          <div className="flex flex-wrap gap-2">
            {getPlayers().map((player) => (
              <span
                key={player.id}
                className="rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-700"
              >
                {player.name}
              </span>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}