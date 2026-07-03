"use client";

import { useEffect, useMemo, useState } from "react";
import { Medal, Trophy, Users } from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import type { MatchRecord, Player, RankingRow } from "@/types";
import { getMatches, getPlayers } from "@/lib/storage";
import { buildRanking } from "@/lib/ranking";

export default function RankingPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);

  useEffect(() => {
    setPlayers(getPlayers());
    setMatches(getMatches());
  }, []);

  const ranking = useMemo<RankingRow[]>(() => {
    return buildRanking(players, matches);
  }, [players, matches]);

  const totalPlayers = ranking.length;
  const totalMatches = matches.length;
  const activePlayers = ranking.filter((r) => r.matches > 0).length;

  const top3 = ranking.slice(0, 3);

  return (
    <AppShell
      title="Bảng xếp hạng"
      subtitle="Tự động tổng hợp từ kết quả các trận đã lưu"
    >
      <div className="space-y-4">
        <SectionCard title="Tổng quan BXH">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs text-slate-500">Thành viên</div>
              <div className="mt-2 text-2xl font-bold">{totalPlayers}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs text-slate-500">Đã thi đấu</div>
              <div className="mt-2 text-2xl font-bold">{activePlayers}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs text-slate-500">Tổng trận</div>
              <div className="mt-2 text-2xl font-bold">{totalMatches}</div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Top 3 nổi bật">
          {top3.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              Chưa có dữ liệu trận đấu để xếp hạng.
            </div>
          ) : (
            <div className="space-y-3">
              {top3.map((row, index) => (
                <div
                  key={row.playerId}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700">
                        {index + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-base font-semibold">
                          {row.name}
                        </div>
                        <div className="text-sm text-slate-500">
                          {row.nickname?.trim()
                            ? row.nickname
                            : "Chưa có biệt danh"}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
                      {row.wins}W - {row.losses}L
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-4 gap-2 text-center text-sm">
                    <div className="rounded-xl bg-white p-2">
                      <div className="text-slate-400">Trận</div>
                      <div className="mt-1 font-bold">{row.matches}</div>
                    </div>
                    <div className="rounded-xl bg-white p-2">
                      <div className="text-slate-400">Thắng</div>
                      <div className="mt-1 font-bold">{row.wins}</div>
                    </div>
                    <div className="rounded-xl bg-white p-2">
                      <div className="text-slate-400">Hiệu số</div>
                      <div className="mt-1 font-bold">{row.pointDiff}</div>
                    </div>
                    <div className="rounded-xl bg-white p-2">
                      <div className="text-slate-400">Win %</div>
                      <div className="mt-1 font-bold">{row.winRate}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="BXH đầy đủ">
          {ranking.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Trophy className="text-slate-500" size={22} />
              </div>
              <div className="text-base font-semibold">Chưa có dữ liệu xếp hạng</div>
              <div className="mt-1 text-sm text-slate-500">
                Hãy vào Buổi chơi và nhập kết quả các trận trước.
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
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-700">
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-base font-semibold">
                            {row.name}
                          </div>
                          <div className="text-sm text-slate-500">
                            {row.nickname?.trim()
                              ? row.nickname
                              : "Chưa có biệt danh"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs sm:grid-cols-6">
                        <div className="rounded-full bg-white px-3 py-1 text-slate-600">
                          M: {row.matches}
                        </div>
                        <div className="rounded-full bg-white px-3 py-1 text-slate-600">
                          W: {row.wins}
                        </div>
                        <div className="rounded-full bg-white px-3 py-1 text-slate-600">
                          L: {row.losses}
                        </div>
                        <div className="rounded-full bg-white px-3 py-1 text-slate-600">
                          PF: {row.pointsFor}
                        </div>
                        <div className="rounded-full bg-white px-3 py-1 text-slate-600">
                          PA: {row.pointsAgainst}
                        </div>
                        <div className="rounded-full bg-white px-3 py-1 text-slate-600">
                          +/-: {row.pointDiff}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
                        {row.winRate}%
                      </div>
                      <div className="mt-2 text-xs text-slate-400">Win rate</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Ghi chú Sprint 4">
          <div className="space-y-2 text-sm text-slate-600">
            <div>• BXH hiện được tính từ toàn bộ match đã lưu trong app.</div>
            <div>• Thứ tự xếp hạng: Thắng → Hiệu số → Điểm ghi được.</div>
            <div>• Sprint tiếp theo mình sẽ làm lọc BXH theo từng buổi / theo khoảng ngày.</div>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}