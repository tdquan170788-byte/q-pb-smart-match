"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, ChevronRight, Trophy } from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import { ensureSeedData } from "@/lib/storage";
import { getRanking, type RankingRow } from "@/lib/ranking";

export default function RankingPage() {
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    ensureSeedData();
    setRows(getRanking());
    setLoaded(true);
  }, []);

  const top3 = useMemo(() => rows.slice(0, 3), [rows]);

  return (
    <AppShell
      title="Bảng xếp hạng"
      subtitle="Thống kê thành tích người chơi"
    >
      <div className="space-y-4">
        <SectionCard title="Top 3 hiện tại">
          {top3.length === 0 ? (
            <div className="text-sm text-slate-500">
              Chưa có dữ liệu xếp hạng.
            </div>
          ) : (
            <div className="space-y-3">
              {top3.map((row, index) => (
                <div
                  key={row.playerId}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">
                        {row.name}
                      </div>
                      <div className="text-sm text-slate-500">
                        {row.nickname?.trim()
                          ? `Biệt danh: ${row.nickname}`
                          : "Chưa có biệt danh"}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold">{row.rating}</div>
                    <div className="text-xs text-slate-500">rating</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="BXH đầy đủ">
          {!loaded ? (
            <div className="text-sm text-slate-500">Đang tải...</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-slate-500">
              Chưa có dữ liệu trận đấu để xếp hạng.
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((row, index) => (
                <Link
                  key={row.playerId}
                  href={`/members/${row.playerId}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                          {index + 1}
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-base font-semibold text-slate-900">
                            {row.name}
                          </div>
                          <div className="text-sm text-slate-500">
                            {row.nickname?.trim()
                              ? `Biệt danh: ${row.nickname}`
                              : "Chưa có biệt danh"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-slate-50 px-3 py-1 text-slate-600">
                          Rating: {row.rating}
                        </span>
                        <span className="rounded-full bg-slate-50 px-3 py-1 text-slate-600">
                          W: {row.wins}
                        </span>
                        <span className="rounded-full bg-slate-50 px-3 py-1 text-slate-600">
                          L: {row.losses}
                        </span>
                        <span className="rounded-full bg-slate-50 px-3 py-1 text-slate-600">
                          M: {row.matches}
                        </span>
                        <span className="rounded-full bg-slate-50 px-3 py-1 text-slate-600">
                          WR: {row.winRate}%
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <div className="text-slate-500">Điểm ghi</div>
                          <div className="mt-1 font-bold">{row.pointsFor}</div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-3">
                          <div className="text-slate-500">Điểm thủng</div>
                          <div className="mt-1 font-bold">
                            {row.pointsAgainst}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-3">
                          <div className="flex items-center gap-1 text-slate-500">
                            <BarChart3 size={14} />
                            Hiệu số
                          </div>
                          <div className="mt-1 font-bold">{row.pointDiff}</div>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-slate-400">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Cách tính">
          <div className="space-y-2 text-sm text-slate-600">
            <div>• Mỗi trận sẽ cộng vào tổng số trận của tất cả người chơi tham gia.</div>
            <div>• Thắng / thua được tính theo điểm số team A và team B.</div>
            <div>• Hiệu số = Điểm ghi - Điểm thủng.</div>
            <div>• Tỷ lệ thắng = số trận thắng / tổng số trận.</div>
            <div>• Khi bằng nhau, bảng xếp hạng ưu tiên: số trận thắng → hiệu số → điểm ghi.</div>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}