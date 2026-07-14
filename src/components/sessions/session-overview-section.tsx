"use client";

import SectionCard from "@/components/section-card";
import SessionInsightsCard from "@/components/sessions/session-insights-card";
import SessionProgressCard from "@/components/sessions/session-progress-card";
import TeamSessionSummaryCard from "@/components/sessions/team-session-summary-card";

import type {
  GeneratedSchedule,
  Member,
  SessionRecord,
} from "@/types";

import type {
  SessionInsights,
} from "@/lib/statistics";

import type {
  SessionProgress,
  TeamSessionSummary,
} from "@/lib/sessions";

type SessionOverviewSectionProps = {
  session: SessionRecord;

  schedule: GeneratedSchedule;

  memberMap: Map<string, Member>;

  progress: SessionProgress | null;

  insights: SessionInsights | null;

  teamSummary: TeamSessionSummary | null;
};

export default function SessionOverviewSection({
  session,
  schedule,
  memberMap,
  progress,
  insights,
  teamSummary,
}: SessionOverviewSectionProps) {
  const configuredRoundValue =
    session.targetRounds !== undefined
      ? session.targetRounds
      : "Theo Scheduler";

  const roundModeLabel =
    session.targetRounds !== undefined
      ? "Tùy chỉnh"
      : "Tự động";

  const hasRoundDifference =
    session.targetRounds !== undefined &&
    session.targetRounds !==
      schedule.totalRounds;

  return (
    <div className="space-y-4">
      <SectionCard title="Thông tin session">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <OverviewMetric
            label="Ngày chơi"
            value={formatDate(
              session.date
            )}
            description="Ngày diễn ra session"
          />

          <OverviewMetric
            label="Chế độ"
            value={
              session.mode === "team"
                ? "Team"
                : "Normal"
            }
            description={
              session.mode === "team"
                ? "Thi đấu theo hai đội"
                : "Ghép cặp linh hoạt"
            }
          />

          <OverviewMetric
            label="Thành viên"
            value={
              session.memberIds.length
            }
            description="Tổng người tham gia"
          />

          <OverviewMetric
            label="Số sân"
            value={
              session.courtCount ?? 1
            }
            description="Sân sử dụng đồng thời"
          />

          <OverviewMetric
            label="Điểm thắng"
            value={
              session.pointToWin
            }
            description="Điểm mục tiêu mỗi trận"
          />

          <OverviewMetric
            label="Round thiết lập"
            value={
              configuredRoundValue
            }
            description={`Chế độ ${roundModeLabel.toLowerCase()}`}
          />

          <OverviewMetric
            label="Round thực tế"
            value={
              schedule.totalRounds
            }
            description="Round trong lịch đã sinh"
          />

          <OverviewMetric
            label="Tổng trận"
            value={countScheduledMatches(
              schedule
            )}
            description="Tổng trận theo lịch"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <StatusPill
            tone={
              session.targetRounds !==
              undefined
                ? "brand"
                : "default"
            }
          >
            Kiểu round:{" "}
            <strong>
              {roundModeLabel}
            </strong>
          </StatusPill>

          {session.targetRounds !==
          undefined ? (
            <StatusPill tone="default">
              Yêu cầu{" "}
              <strong>
                {
                  session.targetRounds
                }
              </strong>{" "}
              round
            </StatusPill>
          ) : (
            <StatusPill tone="default">
              Scheduler tự xác định số
              round
            </StatusPill>
          )}

          {hasRoundDifference ? (
            <StatusPill tone="warning">
              Lịch thực tế khác số round
              thiết lập
            </StatusPill>
          ) : null}

          {session.scheduleSnapshot ? (
            <StatusPill tone="success">
              Lịch đã đóng băng
            </StatusPill>
          ) : (
            <StatusPill tone="warning">
              Lịch chưa đóng băng
            </StatusPill>
          )}
        </div>
      </SectionCard>

      {progress ? (
        <SessionProgressCard
          progress={progress}
        />
      ) : null}

      {insights ? (
        <SessionInsightsCard
          insights={insights}
        />
      ) : null}

      {teamSummary ? (
        <TeamSessionSummaryCard
          summary={teamSummary}
        />
      ) : null}

      <SectionCard
        title="Thành viên tham gia"
        action={
          <div className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
            {session.memberIds.length} người
          </div>
        }
      >
        {session.memberIds.length ===
        0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            Session chưa có thành viên.
          </div>
        ) : session.mode === "team" ? (
          <TeamMemberOverview
            session={session}
            memberMap={memberMap}
          />
        ) : (
          <NormalMemberOverview
            memberIds={
              session.memberIds
            }
            memberMap={memberMap}
          />
        )}
      </SectionCard>
    </div>
  );
}

function NormalMemberOverview({
  memberIds,
  memberMap,
}: {
  memberIds: string[];

  memberMap: Map<string, Member>;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {memberIds.map(
        (memberId) => {
          const member =
            memberMap.get(
              memberId
            );

          return (
            <MemberCard
              key={memberId}
              memberId={memberId}
              name={
                member?.name ??
                memberId
              }
              nickname={
                member?.nickname
              }
              rating={
                member?.ratingNormal
              }
              matches={
                member?.matchesNormal
              }
            />
          );
        }
      )}
    </div>
  );
}

function TeamMemberOverview({
  session,
  memberMap,
}: {
  session: SessionRecord;

  memberMap: Map<string, Member>;
}) {
  const teamAMemberIds =
    session.teamConfig
      ?.teamAMemberIds ?? [];

  const teamBMemberIds =
    session.teamConfig
      ?.teamBMemberIds ?? [];

  const assignedMemberIds =
    new Set([
      ...teamAMemberIds,
      ...teamBMemberIds,
    ]);

  const unassignedMemberIds =
    session.memberIds.filter(
      (memberId) =>
        !assignedMemberIds.has(
          memberId
        )
    );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <TeamColumn
          title="Team A"
          memberIds={
            teamAMemberIds
          }
          memberMap={
            memberMap
          }
        />

        <TeamColumn
          title="Team B"
          memberIds={
            teamBMemberIds
          }
          memberMap={
            memberMap
          }
        />
      </div>

      {unassignedMemberIds.length >
      0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-sm font-semibold text-amber-900">
            Thành viên chưa được phân đội
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 xl:grid-cols-4">
            {unassignedMemberIds.map(
              (memberId) => {
                const member =
                  memberMap.get(
                    memberId
                  );

                return (
                  <MemberCard
                    key={memberId}
                    memberId={
                      memberId
                    }
                    name={
                      member?.name ??
                      memberId
                    }
                    nickname={
                      member?.nickname
                    }
                    rating={
                      member?.ratingTeam
                    }
                    matches={
                      member?.matchesTeam
                    }
                  />
                );
              }
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TeamColumn({
  title,
  memberIds,
  memberMap,
}: {
  title: string;

  memberIds: string[];

  memberMap: Map<string, Member>;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="font-semibold text-slate-900">
          {title}
        </div>

        <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
          {memberIds.length} người
        </div>
      </div>

      {memberIds.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-center text-sm text-slate-500">
          Chưa có thành viên.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {memberIds.map(
            (memberId) => {
              const member =
                memberMap.get(
                  memberId
                );

              return (
                <MemberCard
                  key={memberId}
                  memberId={
                    memberId
                  }
                  name={
                    member?.name ??
                    memberId
                  }
                  nickname={
                    member?.nickname
                  }
                  rating={
                    member?.ratingTeam
                  }
                  matches={
                    member?.matchesTeam
                  }
                />
              );
            }
          )}
        </div>
      )}
    </div>
  );
}

function MemberCard({
  memberId,
  name,
  nickname,
  rating,
  matches,
}: {
  memberId: string;

  name: string;

  nickname?: string;

  rating?: number;

  matches?: number;
}) {
  return (
    <div
      data-member-id={memberId}
      className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3"
    >
      <div className="truncate text-sm font-semibold text-slate-900">
        {name}
      </div>

      <div className="mt-1 truncate text-xs text-slate-500">
        {nickname?.trim()
          ? nickname
          : "Chưa có biệt danh"}
      </div>

      <div className="mt-3 flex items-end justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-slate-400">
            Rating
          </div>

          <div className="mt-1 text-base font-bold text-slate-900">
            {Number.isFinite(rating)
              ? Math.round(
                  rating ?? 0
                ).toLocaleString(
                  "vi-VN"
                )
              : "—"}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wide text-slate-400">
            Trận
          </div>

          <div className="mt-1 text-sm font-semibold text-slate-700">
            {matches ?? 0}
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewMetric({
  label,
  value,
  description,
}: {
  label: string;

  value: string | number;

  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div className="mt-2 truncate text-xl font-bold text-slate-900">
        {value}
      </div>

      <div className="mt-2 text-xs leading-5 text-slate-500">
        {description}
      </div>
    </div>
  );
}

function StatusPill({
  tone,
  children,
}: {
  tone:
    | "default"
    | "brand"
    | "success"
    | "warning";

  children: React.ReactNode;
}) {
  const className =
    tone === "brand"
      ? "bg-brand-50 text-brand-700"
      : tone === "success"
        ? "bg-emerald-100 text-emerald-800"
        : tone === "warning"
          ? "bg-amber-100 text-amber-800"
          : "bg-slate-100 text-slate-700";

  return (
    <div
      className={`rounded-full px-3 py-2 text-xs font-medium ${className}`}
    >
      {children}
    </div>
  );
}

function countScheduledMatches(
  schedule: GeneratedSchedule
): number {
  if (
    !Array.isArray(
      schedule.rounds
    )
  ) {
    return 0;
  }

  return schedule.rounds.reduce(
    (total, round) =>
      total +
      (
        Array.isArray(
          round.matches
        )
          ? round.matches.length
          : 0
      ),
    0
  );
}

function formatDate(
  value: string
): string {
  const parsedDate =
    new Date(
      `${value}T00:00:00`
    );

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return value;
  }

  return parsedDate.toLocaleDateString(
    "vi-VN"
  );
}