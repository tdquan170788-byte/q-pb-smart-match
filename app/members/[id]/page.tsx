"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, Trophy, Target, BarChart3 } from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import { getPlayerDetailStats } from "@/lib/ranking";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default function MemberDetailPage({ params }: Props) {
  const resolvedParams = use(params);
  const playerId = resolvedParams.id;

  const detail = useMemo(() => {
    return getPlayerDetailStats(playerId);
  }, [playerId]);

  if (!detail) {
    return (
      <AppShell title="Chi tiết thành viên" subtitle="Không tìm thấy người chơi">
        <SectionCard title="Không tìm thấy dữ liệu">
          <div className="space-y-3 text-sm text-slate-600">
            <p>Không tìm thấy thành viên này trong hệ thống.</p>
            <Link
              href="/members"
              className="inline-flex rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white"
            >
              Quay lại danh sách thành viên
            </Link>
          </div>
        </SectionCard>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={detail.player.name}
      subtitle={detail.player.nickname?.trim() || "Chi tiết thành viên"}
    >
      <div className="space-y-4">
        <Link
          href="/members"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách
        </Link>

        <SectionCard title="Tổng quan">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Rating</div>
              <div className="mt-2 text-3xl font-bold">{detail.player.rating}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Số trận</div>
              <div className="mt-2 text-3xl font-bold">{detail.player.matches}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Trophy size={14} />
                Trận thắng
              </div>
              <div className="mt-2 text-3xl font-bold">{detail.player.wins}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Target size={14} />
                Trận thua
              </div>
              <div className="mt-2 text-3xl font-bold">{detail.player.losses}</div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Chỉ số chi tiết">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span className="text-slate-500">Tỷ lệ thắng</span>
              <span className="font-semibold">{detail.winRate}%</span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span className="text-slate-500">Tổng điểm đã ghi</span>
              <span className="font-semibold">{detail.totalPointsFor}</span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span className="text-slate-500">Tổng điểm bị ghi</span>
              <span className="font-semibold">{detail.totalPointsAgainst}</span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span className="text-slate-500">Hiệu số điểm</span>
              <span className="font-semibold">{detail.pointDiff}</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Lịch sử gần nhất">
          {detail.recentMatches.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
              Chưa có trận đấu nào của thành viên này.
            </div>
          ) : (
            <div className="space-y-3">
              {detail.recentMatches.map((match) => (
                <div
                  key={match.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm text-slate-500">Round {match.round}</div>
                      <div className="mt-1 text-base font-semibold">
                        {match.scoreA} - {match.scoreB}
                      </div>
                    </div>

                    <div
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        match.isWin
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {match.isWin ? "Thắng" : "Thua"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Gợi ý">
          <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
            <BarChart3 className="mt-0.5 text-brand-600" size={18} />
            <div className="text-sm text-slate-600">
              Sau Sprint 5, màn này sẽ là nơi tổng hợp thành tích, đối thủ thường gặp,
              đồng đội phù hợp và hiệu quả xếp cặp của từng người chơi.
            </div>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}