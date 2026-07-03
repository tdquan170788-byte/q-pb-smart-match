"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import { ensureSeedData, getPlayers } from "@/lib/storage";
import type { Player } from "@/types";

export default function SessionPage() {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    ensureSeedData();
    setPlayers(getPlayers());
  }, []);

  return (
    <AppShell title="Buổi chơi" subtitle="Khởi tạo session">
      <div className="space-y-4">
        <SectionCard title="Tạo buổi mới">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                Điểm thắng
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[11, 15, 21].map((point) => (
                  <button
                    key={point}
                    className={`rounded-2xl border px-3 py-3 text-sm font-semibold ${
                      point === 15
                        ? "border-brand-600 bg-brand-50 text-brand-700"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {point} điểm
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-medium text-slate-600">
                Chọn người tham gia
              </div>
              <div className="space-y-2">
                {players.map((player) => (
                  <label
                    key={player.id}
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <input type="checkbox" className="h-4 w-4" />
                    <span className="font-medium">{player.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <button className="w-full rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white">
              Bắt đầu buổi chơi
            </button>
          </div>
        </SectionCard>

        <SectionCard title="Ghi chú">
          <p className="text-sm text-slate-600">
            Ở Sprint tiếp theo, nút này sẽ tạo session thật và chuyển sang màn hình trận đấu.
          </p>
        </SectionCard>
      </div>
    </AppShell>
  );
}