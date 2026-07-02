"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import { ensureSeedData, getPlayers } from "@/lib/storage";
import type { Player } from "@/types";

export default function MembersPage() {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    ensureSeedData();
    setPlayers(getPlayers());
  }, []);

  return (
    <AppShell title="Thành viên" subtitle="Danh sách người chơi">
      <div className="space-y-4">
        <SectionCard
          title="Danh sách thành viên"
          action={
            <button className="rounded-full bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white">
              + Thêm
            </button>
          }
        >
          <div className="space-y-3">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div>
                  <div className="font-semibold">{player.name}</div>
                  <div className="text-sm text-slate-500">
                    Rating {player.rating} • {player.matches} trận
                  </div>
                </div>
                <div className="text-sm text-slate-400">›</div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Sprint tiếp theo">
          <p className="text-sm text-slate-600">
            Mình sẽ thêm form tạo/sửa/xóa thành viên thật trong Sprint Code #2.
          </p>
        </SectionCard>
      </div>
    </AppShell>
  );
}