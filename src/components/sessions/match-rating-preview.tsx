import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Gauge,
  Sparkles,
  Users,
} from "lucide-react";

import type { Member } from "@/types";

import type {
  TeamRatingMemberResult,
  TeamRatingResult,
} from "@/lib/rating";

type MatchRatingPreviewProps = {
  result: TeamRatingResult;

  memberMap: Map<string, Member>;
};

export default function MatchRatingPreview({
  result,
  memberMap,
}: MatchRatingPreviewProps) {
  const winningTeam =
    getWinningTeam(result);

  const isUpset =
    isUpsetResult(result);

  return (
    <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <Gauge size={18} />

              Rating Preview
            </div>

            <div className="mt-1 text-sm leading-6 text-slate-500">
              Điểm rating dự kiến sau khi lưu kết quả trận đấu.
            </div>
          </div>

          {isUpset ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-2 text-xs font-bold text-amber-800">
              <Sparkles size={15} />

              Kết quả bất ngờ
            </div>
          ) : null}
        </div>
      </div>

      <div className="p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <TeamExpectationCard
            teamLabel="Team A"
            averageRating={
              result.teamAAverageRating
            }
            expectedPercent={
              result.teamAExpectedPercent
            }
            delta={
              result.teamADelta
            }
            isWinner={
              winningTeam === "A"
            }
          />

          <TeamExpectationCard
            teamLabel="Team B"
            averageRating={
              result.teamBAverageRating
            }
            expectedPercent={
              result.teamBExpectedPercent
            }
            delta={
              result.teamBDelta
            }
            isWinner={
              winningTeam === "B"
            }
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <TeamMemberRatingList
            title="Team A"
            members={
              result.teamAMembers
            }
            memberMap={
              memberMap
            }
          />

          <TeamMemberRatingList
            title="Team B"
            members={
              result.teamBMembers
            }
            memberMap={
              memberMap
            }
          />
        </div>

        {isUpset ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={19}
                className="mt-0.5 shrink-0 text-amber-700"
              />

              <div>
                <div className="font-semibold text-amber-900">
                  Upset Victory
                </div>

                <div className="mt-1 text-sm leading-6 text-amber-800">
                  Đội có xác suất thắng thấp hơn đã giành chiến thắng,
                  vì vậy mức thay đổi rating sẽ lớn hơn bình thường.
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
          Đây mới là kết quả xem trước. Rating thật chưa được cập nhật
          cho đến khi hệ thống tích hợp bước lưu rating ở Sprint 12.4.
        </div>
      </div>
    </div>
  );
}

function TeamExpectationCard({
  teamLabel,
  averageRating,
  expectedPercent,
  delta,
  isWinner,
}: {
  teamLabel: string;

  averageRating: number;

  expectedPercent: number;

  delta: number;

  isWinner: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        isWinner
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Users size={16} />

            {teamLabel}
          </div>

          <div className="mt-1 text-xs text-slate-500">
            Rating trung bình
          </div>

          <div className="mt-1 text-2xl font-bold text-slate-900">
            {formatRating(
              averageRating
            )}
          </div>
        </div>

        {isWinner ? (
          <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
            Thắng
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <MetricBox
          label="Xác suất thắng"
          value={`${expectedPercent.toFixed(
            1
          )}%`}
        />

        <MetricBox
          label="Rating thay đổi"
          value={formatDelta(delta)}
          valueClassName={
            delta > 0
              ? "text-emerald-700"
              : delta < 0
                ? "text-red-700"
                : "text-slate-700"
          }
        />
      </div>
    </div>
  );
}

function TeamMemberRatingList({
  title,
  members,
  memberMap,
}: {
  title: string;

  members: TeamRatingMemberResult[];

  memberMap: Map<string, Member>;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="font-semibold text-slate-900">
          {title}
        </div>

        <div className="text-xs text-slate-500">
          {members.length} người
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {members.map((memberResult) => {
          const member =
            memberMap.get(
              memberResult.memberId
            );

          return (
            <MemberRatingRow
              key={
                memberResult.memberId
              }
              name={
                member?.name ??
                memberResult.memberId
              }
              nickname={
                member?.nickname
              }
              result={
                memberResult
              }
            />
          );
        })}
      </div>
    </div>
  );
}

function MemberRatingRow({
  name,
  nickname,
  result,
}: {
  name: string;

  nickname?: string;

  result: TeamRatingMemberResult;
}) {
  const positive =
    result.delta > 0;

  const negative =
    result.delta < 0;

  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-medium text-slate-900">
            {name}
          </div>

          {nickname?.trim() ? (
            <div className="mt-0.5 truncate text-xs text-slate-500">
              {nickname}
            </div>
          ) : null}
        </div>

        <div
          className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-sm font-bold ${
            positive
              ? "bg-emerald-100 text-emerald-800"
              : negative
                ? "bg-red-100 text-red-800"
                : "bg-slate-200 text-slate-700"
          }`}
        >
          {positive ? (
            <ArrowUp size={15} />
          ) : negative ? (
            <ArrowDown size={15} />
          ) : null}

          {formatDelta(
            result.delta
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-white px-3 py-2">
          <div className="text-xs text-slate-500">
            Rating cũ
          </div>

          <div className="mt-1 font-bold text-slate-900">
            {formatRating(
              result.oldRating
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white px-3 py-2">
          <div className="text-xs text-slate-500">
            Rating mới
          </div>

          <div className="mt-1 font-bold text-slate-900">
            {formatRating(
              result.newRating
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricBox({
  label,
  value,
  valueClassName = "text-slate-900",
}: {
  label: string;

  value: string | number;

  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl bg-white/80 p-3">
      <div className="text-xs text-slate-500">
        {label}
      </div>

      <div
        className={`mt-1 text-lg font-bold ${valueClassName}`}
      >
        {value}
      </div>
    </div>
  );
}

function getWinningTeam(
  result: TeamRatingResult
): "A" | "B" | null {
  if (
    result.teamADelta >
    result.teamBDelta
  ) {
    return "A";
  }

  if (
    result.teamBDelta >
    result.teamADelta
  ) {
    return "B";
  }

  return null;
}

function isUpsetResult(
  result: TeamRatingResult
): boolean {
  const winningTeam =
    getWinningTeam(result);

  if (winningTeam === "A") {
    return (
      result.teamAExpectedPercent <
      50
    );
  }

  if (winningTeam === "B") {
    return (
      result.teamBExpectedPercent <
      50
    );
  }

  return false;
}

function formatDelta(
  delta: number
): string {
  const roundedDelta =
    Math.round(delta);

  if (roundedDelta > 0) {
    return `+${roundedDelta}`;
  }

  return `${roundedDelta}`;
}

function formatRating(
  rating: number
): string {
  return Math.round(
    rating
  ).toLocaleString("vi-VN");
}
