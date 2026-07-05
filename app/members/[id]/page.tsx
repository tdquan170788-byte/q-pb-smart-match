"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Trophy, BarChart3, CalendarDays } from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import { getPlayerDetailStats } from "@/lib/ranking";

export default function MemberDetailPage() {
  const params = useParams<{ id: string }>();
  const playerId = params?.id ?? "";

  const data = useMemo(() => getPlayerDetailStats(playerId), [playerId]);

  if (!data.player) {
    return (
      <AppShell title="Chi tiết thành viên" subtitle="Không tìm thấy người chơi">
        <div className="space-y-4">
          <Link
            href="/members"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600"
          >
            <ArrowLeft size={16} />
            Quay lại danh sách thành viên
          </Link>

          <SectionCard title="Thông báo">
            <div className="text-sm text-slate-600">
              Không tìm thấy thành viên này.
            </div>
          </SectionCard>
        </div>
      </AppShell>
    );
  }

  const row = data.rankingRow;

  return (
    <AppShell
      title={data.player.name}
      subtitle={data.player.nickname?.trim() || "Chi tiết thành viên"}
    >
      <div className="space-y-4">
        <Link
          href="/members"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách thành viên
        </Link>

        <SectionCard title="Tổng quan">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Trophy size={16} />
                Rating
              </div>
              <div className="mt-2 text-2xl font-bold">
                {row?.rating ?? data.player.rating ?? 1000}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <CalendarDays size={16} />
                Buổi chơi
              </div>
              <div className="mt-2 text-2xl font-bold">{data.totalSessions}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Trận đấu</div>
              <div className="mt-2 text-2xl font-bold">{row?.matches ?? 0}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Tỷ lệ thắng</div>
              <div className="mt-2 text-2xl font-bold">{row?.winRate ?? 0}%</div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Thống kê thắng / thua">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-emerald-50 p-4">
              <div className="text-sm text-emerald-700">Thắng</div>
              <div className="mt-2 text-3xl font-bold text-emerald-800">
                {row?.wins ?? 0}
              </div>
            </div>

            <div className="rounded-2xl bg-rose-50 p-4">
              <div className="text-sm text-rose-700">Thua</div>
              <div className="mt-2 text-3xl font-bold text-rose-800">
                {row?.losses ?? 0}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-slate-500">Điểm ghi</div>
              <div className="mt-2 text-xl font-bold">{row?.pointsFor ?? 0}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-slate-500">Điểm thủng</div>
              <div className="mt-2 text-xl font-bold">
                {row?.pointsAgainst ?? 0}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-500">
                <BarChart3 size={14} />
                Hiệu số
              </div>
              <div className="mt-2 text-xl font-bold">
                {row?.pointDiff ?? 0}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Lịch sử trận gần nhất">
          {data.recentMatches.length === 0 ? (
            <div className="text-sm text-slate-500">Chưa có trận nào.</div>
          ) : (
            <div className="space-y-3">
              {data.recentMatches.map((match) => {
                const resultText =
                  match.result === "W"
                    ? "Thắng"
                    : match.result === "L"
                    ? "Thua"
                    : "Hòa";

                const resultClass =
                  match.result === "W"
                    ? "bg-emerald-100 text-emerald-700"
                    : match.result === "L"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-slate-100 text-slate-700";

                return (
                  <div
                    key={match.matchId}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-900">
                        {match.sessionDate || "Không có ngày"} · Round {match.round}
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${resultClass}`}
                      >
                        {resultText}
                      </span>
                    </div>

                    <div className="mt-3 text-sm text-slate-600">
                      <div>
                        <span className="font-medium">Đồng đội:</span>{" "}
                        {match.teammateNames.length > 0
                          ? match.teammateNames.join(", ")
                          : "Không có"}
                      </div>
                      <div className="mt-1">
                        <span className="font-medium">Đối thủ:</span>{" "}
                        {match.opponentNames.length > 0
                          ? match.opponentNames.join(", ")
                          : "Không có"}
                      </div>
                    </div>

                    <div className="mt-3 text-lg font-bold">
                      {match.scoreFor} - {match.scoreAgainst}
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