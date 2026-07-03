"use client";

import { useEffect, useMemo, useState } from "react";
import { Trophy } from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import type { Player } from "@/types";
import { buildRanking } from "@/lib/ranking";
import { ensureSeedPlayers, getPlayers } from "@/lib/storage";

export default function RankingPage() {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    ensureSeedPlayers();
    setPlayers(getPlayers());
  }, []);

  const rows = useMemo(() => buildRanking(players), [players]);

  return (
    <AppShell title="Ranking" subtitle="Bảng xếp hạng nội bộ">
      <div className="space-y-4">
        <SectionCard title="BXH hiện tại">
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Trophy className="text-slate-500" size={22} />
              </div>
              <div className="text-base font-semibold">Chưa có dữ liệu xếp hạng</div>
              <div className="mt-1 text-sm text-slate-500">
                Hãy thêm thành viên hoặc tạo trận đấu để bắt đầu thống kê.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((row, index) => (
                <div
                  key={row.playerId}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700">
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-base font-semibold">{row.name}</div>
                          <div className="text-sm text-slate-500">
                            {row.nickname?.trim()
                              ? `Biệt danh: ${row.nickname}`
                              : "Chưa có biệt danh"}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-bold">{row.rating}</div>
                          <div className="text-xs text-slate-500">rating</div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-white px-3 py-1 text-slate-600">
                          W: {row.wins}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-slate-600">
                          L: {row.losses}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-slate-600">
                          M: {row.matches}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-slate-600">
                          Win rate: {row.winRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Ghi chú">
          <div className="space-y-2 text-sm text-slate-600">
            <div>• BXH hiện tại đang lấy trực tiếp từ dữ liệu người chơi.</div>
            <div>• Khi Sprint tiếp theo có lưu kết quả trận, wins/losses/rating sẽ cập nhật tự động.</div>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}