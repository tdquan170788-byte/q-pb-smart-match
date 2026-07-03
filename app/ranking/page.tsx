"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Medal, Trophy, TrendingUp, Users } from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import type { MatchRecord, Player, RankingRow } from "@/types";
import { getMatches, getPlayers } from "@/lib/storage";
import { buildRanking } from "@/lib/ranking";

export default function RankingPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setPlayers(getPlayers());
    setMatches(getMatches());
    setLoaded(true);
  }, []);

  const ranking = useMemo<RankingRow[]>(() => {
    return buildRanking(players, matches);
  }, [players, matches]);

  const totalPlayers = players.length;
  const totalMatches = matches.length;
  const activePlayers = ranking.filter((row) => row.matches > 0).length;

  const top3 = ranking.slice(0, 3);

  return (
    <AppShell
      title="Bảng xếp hạng"
      subtitle="Xếp hạng thành viên theo kết quả thi đấu"
    >
      <div className="space-y-4">
        {/* TỔNG QUAN */}
        <SectionCard title="Tổng quan BXH">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Tổng thành viên</div>
              <div className="mt-2 text-3xl font-bold">{totalPlayers}</div>
              <div className="mt-1 text-xs text-slate-400">
                Có trong danh sách nhóm
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Tổng trận đã lưu</div>
              <div className="mt-2 text-3xl font-bold">{totalMatches}</div>
              <div className="mt-1 text-xs text-slate-400">
                Tính từ các buổi chơi
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Đã có thành tích</div>
              <div className="mt-2 text-3xl font-bold">{activePlayers}</div>
              <div className="mt-1 text-xs text-slate-400">
                Thành viên đã phát sinh trận
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Dữ liệu</div>
              <div className="mt-2 text-lg font-bold">
                {loaded ? "Đã tải" : "Đang tải..."}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Lưu cục bộ trên iPhone
              </div>
            </div>
          </div>
        </SectionCard>

        {/* TOP 3 */}
        <SectionCard title="Top 3 hiện tại">
          {top3.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Trophy className="text-slate-500" size={22} />
              </div>
              <div className="text-base font-semibold">Chưa có dữ liệu xếp hạng</div>
              <div className="mt-1 text-sm text-slate-500">
                Hãy tạo buổi chơi và nhập kết quả để bắt đầu tính BXH.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {top3.map((row, index) => (
                <div
                  key={row.playerId}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                            index === 0
                              ? "bg-yellow-100 text-yellow-700"
                              : index === 1
                              ? "bg-slate-200 text-slate-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                        </div>

                        <div className="min-w-0">
                          <Link href={`/members/${row.playerId}`} className="block">
                            <div className="truncate text-base font-semibold text-slate-900">
                              {row.name}
                            </div>
                            <div className="text-xs text-brand-700">
                              Xem hồ sơ thành tích →
                            </div>
                          </Link>

                          <div className="mt-1 text-sm text-slate-500">
                            {row.nickname?.trim()
                              ? `Biệt danh: ${row.nickname}`
                              : "Chưa có biệt danh"}
                          </div>
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
                          WR: {row.winRate}%
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="text-sm text-slate-500">Hiệu số</div>
                      <div className="text-xl font-bold">{row.pointDiff}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* BXH ĐẦY ĐỦ */}
        <SectionCard title="Bảng xếp hạng đầy đủ">
          {ranking.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Users className="text-slate-500" size={22} />
              </div>
              <div className="text-base font-semibold">Chưa có dữ liệu BXH</div>
              <div className="mt-1 text-sm text-slate-500">
                Khi nhập kết quả các trận, bảng xếp hạng sẽ tự cập nhật tại đây.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {ranking.map((row, index) => (
                <div
                  key={row.playerId}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                          {index + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                          <Link href={`/members/${row.playerId}`} className="block">
                            <div className="truncate text-base font-semibold text-slate-900">
                              {row.name}
                            </div>
                            <div className="text-xs text-brand-700">
                              Xem hồ sơ thành tích →
                            </div>
                          </Link>

                          <div className="text-sm text-slate-500">
                            {row.nickname?.trim()
                              ? `Biệt danh: ${row.nickname}`
                              : "Chưa có biệt danh"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                        <div className="rounded-2xl bg-white px-3 py-2 text-slate-600">
                          <div className="text-[11px] text-slate-400">Thắng / Thua</div>
                          <div className="mt-1 font-semibold">
                            {row.wins} / {row.losses}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-white px-3 py-2 text-slate-600">
                          <div className="text-[11px] text-slate-400">Số trận</div>
                          <div className="mt-1 font-semibold">{row.matches}</div>
                        </div>

                        <div className="rounded-2xl bg-white px-3 py-2 text-slate-600">
                          <div className="text-[11px] text-slate-400">Win rate</div>
                          <div className="mt-1 font-semibold">{row.winRate}%</div>
                        </div>

                        <div className="rounded-2xl bg-white px-3 py-2 text-slate-600">
                          <div className="text-[11px] text-slate-400">Hiệu số</div>
                          <div className="mt-1 font-semibold">{row.pointDiff}</div>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-white px-3 py-1 text-slate-600">
                          PF: {row.pointsFor}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-slate-600">
                          PA: {row.pointsAgainst}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 rounded-2xl bg-white px-3 py-2 text-center">
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">
                        Hạng
                      </div>
                      <div className="text-lg font-bold text-brand-700">
                        #{index + 1}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* GHI CHÚ */}
        <SectionCard title="Nguyên tắc xếp hạng hiện tại">
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex items-start gap-2">
              <Medal size={16} className="mt-0.5 text-brand-600" />
              <span>Ưu tiên số trận thắng cao hơn.</span>
            </div>
            <div className="flex items-start gap-2">
              <TrendingUp size={16} className="mt-0.5 text-brand-600" />
              <span>Nếu bằng số trận thắng, so tiếp theo hiệu số điểm.</span>
            </div>
            <div className="flex items-start gap-2">
              <Trophy size={16} className="mt-0.5 text-brand-600" />
              <span>Nếu vẫn bằng nhau, so tiếp tổng điểm ghi được.</span>
            </div>
            <div className="text-xs text-slate-400">
              Công thức này có thể nâng cấp ở Sprint sau nếu anh muốn dùng ELO / rating động.
            </div>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}