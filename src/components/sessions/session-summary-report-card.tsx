"use client";

import {
  CheckCircle2,
  Crown,
  Target,
  Users,
} from "lucide-react";

import SectionCard from "@/components/section-card";

import type {
  Member,
} from "@/types";

import type {
  PlayerSessionSummary,
  SessionSummary,
} from "@/lib/statistics/session-summary";

import {
  formatSessionPercent,
  formatSessionRecord,
  formatSignedNumber,
  rankSessionPlayers,
} from "@/components/sessions/session-report.utils";

type SessionSummaryReportCardProps = {
  summary: SessionSummary;

  memberMap: Map<
    string,
    Member
  >;
};

export default function SessionSummaryReportCard({
  summary,
  memberMap,
}: SessionSummaryReportCardProps) {
  const rankedPlayers =
    rankSessionPlayers({
      players: summary.players,
      memberMap,
    });

  const mvp =
    rankedPlayers.find(
      (player) =>
        player.completedMatches > 0
    );

  const overview =
    summary.overview;

  return (
    <SectionCard
      title="Báo cáo session"
      action={
        <div className="rounded-full bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">
          {overview.completedMatches}
          {" / "}
          {overview.totalMatches} trận
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <ReportMetric
          icon={<Users size={18} />}
          label="Thành viên"
          value={overview.totalMembers}
          description="Tổng người tham gia"
        />

        <ReportMetric
          icon={<Target size={18} />}
          label="Tổng trận"
          value={overview.totalMatches}
          description={`${overview.totalRounds} round`}
        />

        <ReportMetric
          icon={<CheckCircle2 size={18} />}
          label="Hoàn thành"
          value={overview.completedMatches}
          description={`${overview.unfinishedMatches} trận còn lại`}
        />

        <ReportMetric
          icon={<CheckCircle2 size={18} />}
          label="Tiến độ"
          value={`${formatSessionPercent(
            overview.completionRate
          )}%`}
          description={
            overview.completedMatches >=
              overview.totalMatches &&
            overview.totalMatches > 0
              ? "Session đã hoàn thành"
              : "Session đang diễn ra"
          }
        />
      </div>

      <div className="mt-4">
        {mvp ? (
          <MvpCard
            player={mvp}
            member={
              memberMap.get(
                mvp.memberId
              )
            }
          />
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            Chưa có đủ kết quả để xác định MVP của session.
          </div>
        )}
      </div>
    </SectionCard>
  );
}

function MvpCard({
  player,
  member,
}: {
  player: PlayerSessionSummary;

  member?: Member;
}) {
  return (
    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
            <Crown size={19} />
            MVP của session
          </div>

          <div className="mt-3 truncate text-2xl font-bold text-slate-900">
            {member?.name ??
              player.memberId}
          </div>

          {member?.nickname?.trim() ? (
            <div className="mt-1 truncate text-sm text-slate-600">
              {member.nickname}
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl bg-white px-4 py-3 text-center shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Win rate
          </div>

          <div className="mt-1 text-2xl font-bold text-amber-700">
            {formatSessionPercent(
              player.winRate
            )}%
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MvpMetric
          label="Thành tích"
          value={formatSessionRecord(
            player
          )}
        />

        <MvpMetric
          label="Hiệu số"
          value={formatSignedNumber(
            player.pointDiff
          )}
        />

        <MvpMetric
          label="Điểm ghi"
          value={player.pointsFor}
        />

        <MvpMetric
          label="Chuỗi thắng"
          value={
            player.longestWinStreak
          }
        />
      </div>
    </div>
  );
}

function ReportMetric({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;

  label: string;

  value: string | number;

  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600">
          {icon}
        </div>
      </div>

      <div className="mt-3 text-2xl font-bold text-slate-900">
        {value}
      </div>

      <div className="mt-1 text-xs leading-5 text-slate-500">
        {description}
      </div>
    </div>
  );
}

function MvpMetric({
  label,
  value,
}: {
  label: string;

  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-white/80 p-3">
      <div className="text-xs text-slate-500">
        {label}
      </div>

      <div className="mt-1 text-lg font-bold text-slate-900">
        {value}
      </div>
    </div>
  );
}

