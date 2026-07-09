"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import { getPlayerDetailStats } from "@/lib/ranking";
import type { PlayerSummary } from "@/types";

export default function MemberDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const playerId = params?.id ?? "";
  const data = useMemo(() => getPlayerDetailStats(playerId), [playerId]);

  if (!data) {
    return (
      <AppShell title="Chi tiết thành viên" subtitle="Không tìm thấy người chơi">
        <div className="space-y-4">
          <SectionCard title="Thông báo">
            <div className="space-y-3 text-sm text-slate-600">
              <p>Không tìm thấy dữ liệu thành viên này.</p>
              <button
                onClick={() => router.push("/members")}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
              >
                Quay lại danh sách thành viên
              </button>
            </div>
          </SectionCard>
        </div>
      </AppShell>
    );
  }

  const {
    player,
    summary,
    summaryNormal,
    summaryTeam,
    recentMatches,
    topPartners,
    topOpponents,
  } = data;

  return (
    <AppShell
      title={player.name}
      subtitle={`Chi tiết thành viên${player.nickname ? ` • ${player.nickname}` : ""}`}
    >
      <div className="space-y-4">
        <SectionCard title="Tổng quan">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatBox label="Elo" value={summary.rating} />
            <StatBox label="Rank score" value={Math.round(summary.rankScore)} />
            <StatBox label="Trận" value={summary.matches} />
            <StatBox label="Win rate" value={`${Math.round(summary.winRate * 100)}%`} />
            <StatBox label="Thắng" value={summary.wins} />
            <StatBox label="Thua" value={summary.losses} />
            <StatBox label="Hòa" value={summary.draws} />
            <StatBox label="Hiệu số" value={summary.pointDiff} />
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">Chuỗi hiện tại:</span>
              <span>{formatStreak(summary.streakType, summary.streakCount)}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <span>Điểm ghi được: {summary.pointsFor}</span>
              <span>Điểm bị ghi: {summary.pointsAgainst}</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Tách theo mode">
          <div className="grid gap-4 md:grid-cols-2">
            <ModeSummaryCard title="Normal mode" summary={summaryNormal} />
            <ModeSummaryCard title="Team mode" summary={summaryTeam} />
          </div>
        </SectionCard>

        <SectionCard title="Đồng đội hay đánh cùng">
          {topPartners.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có dữ liệu.</p>
          ) : (
            <div className="space-y-3">
              {topPartners.map((item) => (
                <div
                  key={item.playerId}
                  className="rounded-2xl border border-slate-200 p-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-slate-900">{item.name}</div>
                    <div className="text-slate-500">{item.count} trận cùng đội</div>
                  </div>
                  <div className="mt-1 text-slate-600">
                    Thắng cùng nhau: {item.winsTogether} • Thua cùng nhau:{" "}
                    {item.lossesTogether}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Đối thủ hay gặp">
          {topOpponents.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có dữ liệu.</p>
          ) : (
            <div className="space-y-3">
              {topOpponents.map((item) => (
                <div
                  key={item.playerId}
                  className="rounded-2xl border border-slate-200 p-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-slate-900">{item.name}</div>
                    <div className="text-slate-500">{item.count} lần đối đầu</div>
                  </div>
                  <div className="mt-1 text-slate-600">
                    Thắng trước đối thủ này: {item.winsAgainst} • Thua:{" "}
                    {item.lossesAgainst}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="20 trận gần nhất">
          {recentMatches.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có lịch sử trận đấu.</p>
          ) : (
            <div className="space-y-3">
              {recentMatches.map((match) => (
                <div
                  key={match.matchId}
                  className="rounded-2xl border border-slate-200 p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="font-medium text-slate-900">
                      Round {match.round} • {match.scoreFor} - {match.scoreAgainst}
                    </div>
                    <div
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        match.result === "W"
                          ? "bg-emerald-100 text-emerald-700"
                          : match.result === "L"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {match.result === "W"
                        ? "Thắng"
                        : match.result === "L"
                        ? "Thua"
                        : "Hòa"}
                    </div>
                  </div>

                  <div className="mt-2 text-slate-600">
                    Đồng đội:{" "}
                    {match.partnerIds.length > 0
                      ? match.partnerIds.join(", ")
                      : "Không có"}
                  </div>
                  <div className="mt-1 text-slate-600">
                    Đối thủ:{" "}
                    {match.opponentIds.length > 0
                      ? match.opponentIds.join(", ")
                      : "Không có"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}

function StatBox({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function ModeSummaryCard({
  title,
  summary,
}: {
  title: string;
  summary: PlayerSummary;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-base font-semibold text-slate-900">{title}</div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <MiniStat label="Rating" value={summary.rating} />
        <MiniStat label="Matches" value={summary.matches} />
        <MiniStat label="W" value={summary.wins} />
        <MiniStat label="L" value={summary.losses} />
        <MiniStat label="D" value={summary.draws} />
        <MiniStat label="Diff" value={summary.pointDiff} />
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-white p-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function formatStreak(
  type: "win" | "loss" | "draw" | "none",
  count: number
) {
  if (type === "none" || count <= 0) return "Chưa có";
  if (type === "win") return `Thắng ${count} trận`;
  if (type === "loss") return `Thua ${count} trận`;
  return `Hòa ${count} trận`;
}