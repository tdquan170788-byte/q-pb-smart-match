"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, BarChart3, Trophy } from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import { getPlayerDetailStats, getPlayers } from "@/lib/storage";

type Props = {
  params: {
    id: string;
  };
};

export default function MemberDetailPage({ params }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <AppShell title="Chi tiết thành viên" subtitle="Đang tải dữ liệu">
        <div className="rounded-3xl bg-white p-5 shadow-card">Đang tải...</div>
      </AppShell>
    );
  }

  const data = getPlayerDetailStats(params.id);

  if (!data) {
    return (
      <AppShell title="Chi tiết thành viên" subtitle="Không tìm thấy người chơi">
        <SectionCard title="Không tìm thấy">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Thành viên này không tồn tại hoặc đã bị xoá.
            </p>
            <Link
              href="/members"
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white"
            >
              <ArrowLeft size={16} />
              Quay lại danh sách
            </Link>
          </div>
        </SectionCard>
      </AppShell>
    );
  }

  const { player, summary, recentMatches } = data;
  const allPlayers = getPlayers();

  function getPlayerNames(ids: string[]) {
    return ids
      .map((id) => allPlayers.find((p) => p.id === id)?.name ?? "Unknown")
      .join(" / ");
  }

  return (
    <AppShell title={player.name} subtitle="Chi tiết thành viên">
      <div className="space-y-4">
        <Link
          href="/members"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách
        </Link>

        <SectionCard title="Tổng quan">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Tên</div>
              <div className="mt-2 text-xl font-bold">{player.name}</div>
              <div className="mt-1 text-xs text-slate-400">
                {player.nickname?.trim()
                  ? `Biệt danh: ${player.nickname}`
                  : "Chưa có biệt danh"}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Rating</div>
              <div className="mt-2 text-2xl font-bold">{player.rating}</div>
              <div className="mt-1 text-xs text-slate-400">
                Điểm xếp hạng hiện tại
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Thống kê thi đấu">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <BarChart3 size={16} />
                Tổng trận
              </div>
              <div className="mt-2 text-2xl font-bold">{summary.matches}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Tỷ lệ thắng</div>
              <div className="mt-2 text-2xl font-bold">{summary.winRate}%</div>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-sm text-emerald-700">
                <Trophy size={16} />
                Thắng
              </div>
              <div className="mt-2 text-2xl font-bold text-emerald-700">
                {summary.wins}
              </div>
            </div>

            <div className="rounded-2xl bg-rose-50 p-4">
              <div className="text-sm text-rose-700">Thua</div>
              <div className="mt-2 text-2xl font-bold text-rose-700">
                {summary.losses}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Các trận gần đây">
          {recentMatches.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
              Chưa có trận nào của thành viên này.
            </div>
          ) : (
            <div className="space-y-3">
              {recentMatches.map((match) => {
                const teamA = getPlayerNames(match.teamA.playerIds);
                const teamB = getPlayerNames(match.teamB.playerIds);

                return (
                  <div
                    key={match.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-800">
                          Round {match.round}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          {teamA} <span className="font-semibold">vs</span> {teamB}
                        </div>
                        <div className="mt-2 text-sm text-slate-500">
                          Tỷ số: {match.scoreA} - {match.scoreB}
                        </div>
                      </div>

                      <div
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          match.result === "W"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {match.result === "W" ? "Thắng" : "Thua"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}