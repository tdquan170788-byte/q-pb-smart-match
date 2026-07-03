"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import { ensureSeedData, getPlayers } from "@/lib/storage";
import type { Player } from "@/types";

export default function RankingPage() {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    ensureSeedData();
    const data = getPlayers().sort((a, b) => b.rating - a.rating);
    setPlayers(data);
  }, []);

  return (
    <AppShell title="Xếp hạng" subtitle="QD Score tạm thời">
      <div className="space-y-4">
        <SectionCard title="Bảng xếp hạng">
          <div className="space-y-3">
            {players.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold">{player.name}</div>
                    <div className="text-sm text-slate-500">
                      {player.wins}W - {player.losses}L
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{player.rating}</div>
                  <div className="text-xs text-slate-400">QD Score</div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}