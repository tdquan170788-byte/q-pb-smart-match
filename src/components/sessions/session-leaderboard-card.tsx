"use client";

import Link from "next/link";

import {
  ChevronRight,
  Medal,
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

type SessionLeaderboardCardProps = {
  summary: SessionSummary;

  memberMap: Map<
    string,
    Member
  >;
};

export default function SessionLeaderboardCard({
  summary,
  memberMap,
}: SessionLeaderboardCardProps) {
  const rankedPlayers =
    rankSessionPlayers({
      players: summary.players,
      memberMap,
    });

  if (rankedPlayers.length === 0) {
    return (
      <SectionCard title="Bảng thành tích session">
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          Chưa có thành viên để tạo bảng thành tích.
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Bảng thành tích session"
      action={
        <div className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
          {rankedPlayers.length} người
        </div>
      }
    >
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
        <div className="grid grid-cols-[56px_minmax(0,1fr)_90px_90px_90px_90px] bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <div>#</div>
          <div>Thành viên</div>
          <div className="text-center">W-L-D</div>
          <div className="text-center">Win rate</div>
          <div className="text-center">Hiệu số</div>
          <div className="text-center">Điểm ghi</div>
        </div>

        {rankedPlayers.map(
          (player, index) => (
            <LeaderboardRow
              key={player.memberId}
              rank={index + 1}
              player={player}
              member={
                memberMap.get(
                  player.memberId
                )
              }
            />
          )
        )}
      </div>

      <div className="space-y-3 md:hidden">
        {rankedPlayers.map(
          (player, index) => (
            <MobileLeaderboardRow
              key={player.memberId}
              rank={index + 1}
              player={player}
              member={
                memberMap.get(
                  player.memberId
                )
              }
            />
          )
        )}
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
        Xếp hạng theo số trận thắng, tỷ lệ thắng, hiệu số điểm, điểm ghi được và tên thành viên.
      </div>
    </SectionCard>
  );
}

function LeaderboardRow({
  rank,
  player,
  member,
}: {
  rank: number;

  player: PlayerSessionSummary;

  member?: Member;
}) {
  return (
    <Link
      href={`/members/${player.memberId}`}
      className="grid grid-cols-[56px_minmax(0,1fr)_90px_90px_90px_90px] items-center border-t border-slate-200 px-4 py-3 transition hover:bg-brand-50"
    >
      <RankBadge rank={rank} />

      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-slate-900">
          {member?.name ??
            player.memberId}
        </div>

        <div className="mt-1 truncate text-xs text-slate-500">
          {member?.nickname?.trim()
            ? member.nickname
            : `${player.completedMatches} trận hoàn thành`}
        </div>
      </div>

      <div className="text-center text-sm font-semibold text-slate-700">
        {formatSessionRecord(player)}
      </div>

      <div className="text-center text-sm font-semibold text-slate-700">
        {formatSessionPercent(
          player.winRate
        )}%
      </div>

      <div
        className={`text-center text-sm font-bold ${getPointDifferenceClassName(
          player.pointDiff
        )}`}
      >
        {formatSignedNumber(
          player.pointDiff
        )}
      </div>

      <div className="text-center text-sm font-semibold text-slate-700">
        {player.pointsFor}
      </div>
    </Link>
  );
}

function MobileLeaderboardRow({
  rank,
  player,
  member,
}: {
  rank: number;

  player: PlayerSessionSummary;

  member?: Member;
}) {
  return (
    <Link
      href={`/members/${player.memberId}`}
      className="block rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-brand-200 hover:bg-brand-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <RankBadge rank={rank} />

          <div className="min-w-0">
            <div className="truncate font-semibold text-slate-900">
              {member?.name ??
                player.memberId}
            </div>

            <div className="mt-1 truncate text-xs text-slate-500">
              {member?.nickname?.trim()
                ? member.nickname
                : `${player.completedMatches} trận hoàn thành`}
            </div>
          </div>
        </div>

        <ChevronRight
          size={17}
          className="shrink-0 text-slate-400"
        />
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        <MobileMetric
          label="W-L-D"
          value={formatSessionRecord(
            player
          )}
        />

        <MobileMetric
          label="Win rate"
          value={`${formatSessionPercent(
            player.winRate
          )}%`}
        />

        <MobileMetric
          label="Hiệu số"
          value={formatSignedNumber(
            player.pointDiff
          )}
          valueClassName={
            getPointDifferenceClassName(
              player.pointDiff
            )
          }
        />

        <MobileMetric
          label="Điểm"
          value={player.pointsFor}
        />
      </div>
    </Link>
  );
}

function RankBadge({
  rank,
}: {
  rank: number;
}) {
  if (rank <= 3) {
    const className =
      rank === 1
        ? "bg-amber-100 text-amber-700"
        : rank === 2
          ? "bg-slate-200 text-slate-700"
          : "bg-orange-100 text-orange-700";

    return (
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${className}`}
      >
        <Medal size={18} />
      </div>
    );
  }

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700">
      {rank}
    </div>
  );
}

function MobileMetric({
  label,
  value,
  valueClassName = "text-slate-900",
}: {
  label: string;

  value: string | number;

  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-2 py-3 text-center">
      <div className="text-[10px] uppercase tracking-wide text-slate-400">
        {label}
      </div>

      <div
        className={`mt-1 text-sm font-bold ${valueClassName}`}
      >
        {value}
      </div>
    </div>
  );
}

function getPointDifferenceClassName(
  value: number
): string {
  if (value > 0) {
    return "text-emerald-700";
  }

  if (value < 0) {
    return "text-red-600";
  }

  return "text-slate-600";
}
