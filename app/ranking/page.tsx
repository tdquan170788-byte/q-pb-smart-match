"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Trophy, Medal } from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import { getRanking } from "@/lib/ranking";
import { ensureSeedPlayers } from "@/lib/storage";

export default function RankingPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    ensureSeedPlayers();
    setRefreshKey((v) => v + 1);
  }, []);

  const ranking = useMemo(() => getRanking(), [refreshKey]);

  return (
    <AppShell title="Bảng xếp hạng" subtitle="Thống kê thành tích người chơi">
      <div className="space-y-4">
        <SectionCard title="BXH hiện tại">
          {ranking.length === 0 ? (
            <div className="text-sm text-slate-500">Chưa có dữ liệu xếp hạng.</div>
          ) : (
            <div className="space-y-3">
              {ranking.map((row, index) => {
                const isTop3 = index < 3;

                return (
                  <Link
                    key={row.playerId}
                    href={`/members/${row.playerId}`}
                    className="block rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-2xl font-bold ${
                            isTop3
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {isTop3 ? <Medal size={18} /> : index + 1}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-slate-900">
                              {row.name}
                            </div>
                            {row.nickname ? (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                                {row.nickname}
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-1 text-sm text-slate-500">
                            {row.wins} thắng · {row.losses} thua · {row.matches} trận
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1 text-amber-600">
                          <Trophy size={16} />
                          <span className="font-bold">{row.rating}</span>
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          Win rate {row.winRate}%
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="text-slate-500">Điểm ghi</div>
                        <div className="mt-1 font-semibold">{row.pointsFor}</div>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="text-slate-500">Điểm thủng</div>
                        <div className="mt-1 font-semibold">
                          {row.pointsAgainst}
                        </div>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="text-slate-500">Hiệu số</div>
                        <div className="mt-1 font-semibold">{row.pointDiff}</div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}