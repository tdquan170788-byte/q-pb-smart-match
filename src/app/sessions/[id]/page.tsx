"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import {
  BarChart3,
  CheckCircle2,
  Lock,
  Star,
} from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";

import ScheduleMemberAnalytics from "@/components/sessions/schedule-member-analytics";
import SchedulePairAnalytics from "@/components/sessions/schedule-pair-analytics";
import SessionOverviewSection from "@/components/sessions/session-overview-section";
import SessionPlaySection from "@/components/sessions/session-play-section";
import SessionTabs from "@/components/sessions/session-tabs";

import Badge from "@/components/ui/badge";
import Progress from "@/components/ui/progress";

import type {
  GeneratedSchedule,
  MatchRecord,
  Member,
  ScheduleQualityReport,
  ScheduledMatch,
  SessionRecord,
} from "@/types";

import {
  ensureSeedData,
  getMatchesBySessionId,
  getMembers,
  getSessionById,
  upsertMatch,
} from "@/lib/storage";

import {
  analyzeSchedule,
} from "@/lib/scheduler";

import {
  generateScheduleForSession,
} from "@/lib/session";

import {
  buildSessionProgress,
  buildTeamSessionSummary,
} from "@/lib/sessions";

import {
  buildSessionInsights,
} from "@/lib/statistics";

import {
  buildSessionSummary,
} from "@/lib/statistics/session-summary";

import {
  rebuildAllRatings,
} from "@/lib/rating";

import {
  freezeSessionSchedule,
  isSessionScheduleFrozen,
} from "@/lib/sessions/frozen-schedule.service";

type SessionTabKey =
  | "play"
  | "overview"
  | "analytics"
  | "settings";

export default function SessionDetailPage() {
  const params =
    useParams<{ id: string }>();

  const sessionId =
    params.id;

  const [
    activeTab,
    setActiveTab,
  ] = useState<SessionTabKey>(
    "play"
  );

  const [
    session,
    setSession,
  ] = useState<SessionRecord | null>(
    null
  );

  const [
    members,
    setMembers,
  ] = useState<Member[]>([]);

  const [
    matches,
    setMatches,
  ] = useState<MatchRecord[]>([]);

  const [
    freezingSchedule,
    setFreezingSchedule,
  ] = useState(false);

  const [
    freezeMessage,
    setFreezeMessage,
  ] = useState("");

  useEffect(() => {
    ensureSeedData();

    setSession(
      getSessionById(sessionId) ??
        null
    );

    setMembers(
      getMembers()
    );

    setMatches(
      getMatchesBySessionId(
        sessionId
      )
    );
  }, [sessionId]);

  const memberMap =
    useMemo(() => {
      return new Map(
        members.map((member) => [
          member.id,
          member,
        ])
      );
    }, [members]);

  const schedule:
    | GeneratedSchedule
    | null = useMemo(() => {
    if (!session) {
      return null;
    }

    return generateScheduleForSession(
      session
    );
  }, [session]);

  const qualityReport:
    | ScheduleQualityReport
    | null = useMemo(() => {
    if (
      !session ||
      !schedule
    ) {
      return null;
    }

    return analyzeSchedule({
      schedule,

      memberIds:
        session.memberIds,
    });
  }, [
    session,
    schedule,
  ]);

  const sessionProgress =
    useMemo(() => {
      if (!schedule) {
        return null;
      }

      return buildSessionProgress({
        schedule,

        savedMatches:
          matches,
      });
    }, [
      schedule,
      matches,
    ]);

  const sessionInsights =
    useMemo(() => {
      if (
        !session ||
        !schedule
      ) {
        return null;
      }

      return buildSessionInsights({
        session,

        members,

        matches,

        schedule,
      });
    }, [
      session,
      members,
      matches,
      schedule,
    ]);

  const teamSummary =
    useMemo(() => {
      if (
        !session ||
        !schedule ||
        session.mode !== "team"
      ) {
        return null;
      }

      const totalScheduledMatches =
        schedule.rounds.reduce(
          (
            total,
            round
          ) =>
            total +
            round.matches.length,
          0
        );

      return buildTeamSessionSummary({
        session,

        savedMatches:
          matches,

        totalScheduledMatches,
      });
    }, [
      session,
      schedule,
      matches,
    ]);

  const scheduleFrozen =
    useMemo(() => {
      if (!session) {
        return false;
      }

      return isSessionScheduleFrozen(
        session
      );
    }, [session]);

  const roundModeLabel =
    session?.targetRounds !==
    undefined
      ? "Tùy chỉnh"
      : "Tự động";

  const configuredRoundValue:
    string | number =
    session?.targetRounds !==
    undefined
      ? session.targetRounds
      : "Theo Scheduler";

  function refreshMatches(): void {
    setMatches(
      getMatchesBySessionId(
        sessionId
      )
    );
  }

  function refreshMembers(): void {
    setMembers(
      getMembers()
    );
  }

  function findSavedMatch(
    scheduledMatch: ScheduledMatch
  ): MatchRecord | undefined {
    return matches.find(
      (match) =>
        match.round ===
          scheduledMatch.round &&
        (match.court ?? 1) ===
          scheduledMatch.court &&
        sameIds(
          match.teamA.memberIds,
          scheduledMatch.teamAMemberIds
        ) &&
        sameIds(
          match.teamB.memberIds,
          scheduledMatch.teamBMemberIds
        )
    );
  }

  function handleSaveScore(
    match: MatchRecord,
    scoreA: number,
    scoreB: number
  ): void {
    upsertMatch({
      sessionId:
        match.sessionId,

      round:
        match.round,

      court:
        match.court,

      teamA:
        match.teamA,

      teamB:
        match.teamB,

      scoreA,

      scoreB,
    });

    /**
     * Reset và phát lại toàn bộ lịch sử
     * để tránh cộng Rating trùng khi sửa
     * hoặc lưu lại cùng một trận.
     */
    rebuildAllRatings();

    refreshMatches();
    refreshMembers();
  }

  function handleFreezeSchedule(): void {
    if (
      !session ||
      freezingSchedule
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Bạn có chắc muốn đóng băng lịch hiện tại? Sau khi đóng băng, session này sẽ luôn sử dụng lịch đang hiển thị."
      );

    if (!confirmed) {
      return;
    }

    setFreezingSchedule(true);
    setFreezeMessage("");

    try {
      const result =
        freezeSessionSchedule(
          session.id
        );

      if (!result.success) {
        setFreezeMessage(
          result.reason ===
            "session-not-found"
            ? "Không tìm thấy session cần đóng băng."
            : "Không thể lưu lịch đóng băng. Vui lòng thử lại."
        );

        return;
      }

      setSession(
        result.session
      );

      setFreezeMessage(
        result.alreadyFrozen
          ? "Session này đã có lịch đóng băng."
          : "Đã đóng băng lịch hiện tại thành công."
      );
    } catch (error) {
      console.error(
        "Freeze schedule failed:",
        error
      );

      setFreezeMessage(
        "Đã xảy ra lỗi khi đóng băng lịch. Vui lòng thử lại."
      );
    } finally {
      setFreezingSchedule(false);
    }
  }

  if (
    !session ||
    !schedule
  ) {
    return (
      <AppShell
        title="Session"
        subtitle="Không tìm thấy session"
      >
        <SectionCard title="Không tìm thấy dữ liệu">
          <div className="text-sm text-slate-600">
            Session này không tồn tại
            hoặc dữ liệu đã bị xoá.
          </div>

          <Link
            href="/sessions"
            className="mt-4 inline-flex rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white"
          >
            Quay lại danh sách session
          </Link>
        </SectionCard>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Session ${formatDate(
        session.date
      )}`}
      subtitle={`Mode: ${
        session.mode
      } • ${
        session.memberIds.length
      } thành viên • ${
        session.courtCount ?? 1
      } sân • ${
        schedule.totalRounds
      } round`}
    >
      <div className="space-y-4">
        <SessionTabs
          active={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === "play" ? (
          <SessionPlaySection
            session={session}
            schedule={schedule}
            memberMap={memberMap}
            findSavedMatch={
              findSavedMatch
            }
            onSaveScore={
              handleSaveScore
            }
          />
        ) : null}

        {activeTab ===
        "overview" ? (
          <SessionOverviewSection
            session={session}
            schedule={schedule}
            memberMap={memberMap}
            progress={
              sessionProgress
            }
            insights={
              sessionInsights
            }
            teamSummary={
              teamSummary
            }
          />
        ) : null}

        {activeTab ===
        "analytics" ? (
          <SessionAnalyticsContent
            qualityReport={
              qualityReport
            }
            memberMap={
              memberMap
            }
          />
        ) : null}

        {activeTab ===
        "settings" ? (
          <SessionSettingsContent
            session={session}
            schedule={schedule}
            scheduleFrozen={
              scheduleFrozen
            }
            roundModeLabel={
              roundModeLabel
            }
            configuredRoundValue={
              configuredRoundValue
            }
            freezingSchedule={
              freezingSchedule
            }
            freezeMessage={
              freezeMessage
            }
            onFreezeSchedule={
              handleFreezeSchedule
            }
          />
        ) : null}
      </div>
    </AppShell>
  );
}

function SessionAnalyticsContent({
  qualityReport,
  memberMap,
}: {
  qualityReport:
    | ScheduleQualityReport
    | null;

  memberMap: Map<
    string,
    Member
  >;
}) {
  if (!qualityReport) {
    return (
      <SectionCard title="Phân tích lịch đấu">
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          Chưa có đủ dữ liệu để phân tích lịch.
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-4">
      <ScheduleQualityCard
        report={
          qualityReport
        }
      />

      <SectionCard title="Phân bổ thành viên">
        <ScheduleMemberAnalytics
          memberStats={
            qualityReport.memberStats
          }
          memberMap={
            memberMap
          }
        />
      </SectionCard>

      <SectionCard title="Đồng đội bị lặp">
        <SchedulePairAnalytics
          mode="teammate"
          pairStats={
            qualityReport.teammatePairStats
          }
          memberMap={
            memberMap
          }
        />
      </SectionCard>

      <SectionCard title="Đối thủ gặp nhiều lần">
        <SchedulePairAnalytics
          mode="opponent"
          pairStats={
            qualityReport.opponentPairStats
          }
          memberMap={
            memberMap
          }
        />
      </SectionCard>
    </div>
  );
}

function SessionSettingsContent({
  session,
  schedule,
  scheduleFrozen,
  roundModeLabel,
  configuredRoundValue,
  freezingSchedule,
  freezeMessage,
  onFreezeSchedule,
}: {
  session: SessionRecord;

  schedule: GeneratedSchedule;

  scheduleFrozen: boolean;

  roundModeLabel: string;

  configuredRoundValue:
    string | number;

  freezingSchedule: boolean;

  freezeMessage: string;

  onFreezeSchedule: () => void;
}) {
  const hasRoundDifference =
    session.targetRounds !==
      undefined &&
    session.targetRounds !==
      schedule.totalRounds;

  return (
    <div className="space-y-4">
      <SectionCard title="Cấu hình session">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <SettingsMetric
            label="Kiểu round"
            value={
              roundModeLabel
            }
            description={
              session.targetRounds !==
              undefined
                ? "Số round do người dùng chọn"
                : "Scheduler tự xác định"
            }
          />

          <SettingsMetric
            label="Round thiết lập"
            value={
              configuredRoundValue
            }
            description="Cấu hình khi tạo session"
          />

          <SettingsMetric
            label="Round thực tế"
            value={
              schedule.totalRounds
            }
            description="Số round trong lịch"
          />

          <SettingsMetric
            label="Scheduler"
            value={
              session.schedulerVersion ??
              "Không xác định"
            }
            description="Phiên bản sinh lịch"
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

          {hasRoundDifference ? (
            <StatusPill tone="warning">
              Lịch thực tế khác cấu hình round
            </StatusPill>
          ) : (
            <StatusPill tone="success">
              Round thực tế đúng cấu hình
            </StatusPill>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Trạng thái lịch đấu">
        {scheduleFrozen ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2
                  size={20}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="font-semibold text-emerald-900">
                  Lịch đã được đóng băng
                </div>

                <div className="mt-1 text-sm leading-6 text-emerald-800">
                  Session luôn sử dụng lịch đã lưu.
                  Các thay đổi Scheduler sau này sẽ
                  không làm thay đổi lịch của session.
                </div>

                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <div className="rounded-xl bg-white/70 px-3 py-2 text-emerald-900">
                    <span className="text-emerald-700">
                      Scheduler:
                    </span>{" "}
                    <span className="font-semibold">
                      {session.schedulerVersion ??
                        "Không xác định"}
                    </span>
                  </div>

                  <div className="rounded-xl bg-white/70 px-3 py-2 text-emerald-900">
                    <span className="text-emerald-700">
                      Ngày đóng băng:
                    </span>{" "}
                    <span className="font-semibold">
                      {formatDateTime(
                        session.scheduleCreatedAt
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <Lock size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="font-semibold text-amber-900">
                  Session chưa đóng băng lịch
                </div>

                <div className="mt-1 text-sm leading-6 text-amber-800">
                  Lịch hiện tại có thể được tạo lại
                  khi Scheduler thay đổi. Hãy đóng
                  băng để giữ cố định lịch đang dùng.
                </div>

                <button
                  type="button"
                  onClick={
                    onFreezeSchedule
                  }
                  disabled={
                    freezingSchedule
                  }
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Lock size={17} />

                  {freezingSchedule
                    ? "Đang đóng băng..."
                    : "Đóng băng lịch hiện tại"}
                </button>
              </div>
            </div>
          </div>
        )}

        {freezeMessage ? (
          <div className="mt-3 rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700">
            {freezeMessage}
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}

function ScheduleQualityCard({
  report,
}: {
  report: ScheduleQualityReport;
}) {
  const quality =
    getQualityPresentation(
      report.qualityScore
    );

  const starCount =
    getStarCount(
      report.qualityScore
    );

  return (
    <SectionCard
      title="Chất lượng lịch đấu"
      action={
        <Badge
          variant={
            quality.variant
          }
        >
          {quality.label}
        </Badge>
      }
    >
      <div className="rounded-3xl bg-slate-900 p-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <BarChart3
                size={17}
              />

              Schedule Quality
            </div>

            <div className="mt-3 flex items-end gap-2">
              <div className="text-4xl font-bold">
                {report.qualityScore.toFixed(
                  1
                )}
              </div>

              <div className="pb-1 text-sm text-slate-400">
                / 100
              </div>
            </div>
          </div>

          <div className="flex gap-1">
            {Array.from({
              length: 5,
            }).map(
              (
                _,
                index
              ) => (
                <Star
                  key={
                    index
                  }
                  size={20}
                  className={
                    index <
                    starCount
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-slate-600"
                  }
                />
              )
            )}
          </div>
        </div>

        <div className="mt-5">
          <Progress
            value={
              report.qualityScore
            }
            max={100}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <QualityMetric
          label="Tổng round"
          value={
            report.totalRounds
          }
        />

        <QualityMetric
          label="Tổng trận"
          value={
            report.totalMatches
          }
        />

        <QualityMetric
          label="Lệch số trận"
          value={
            report.matchCountDifference
          }
        />

        <QualityMetric
          label="Lệch lượt nghỉ"
          value={
            report.restCountDifference
          }
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <QualityMetric
          label="Nghỉ liên tiếp tối đa"
          value={
            report.maxConsecutiveRestCount
          }
        />

        <QualityMetric
          label="Lặp đồng đội tối đa"
          value={
            report.maxTeammateRepeatCount
          }
        />

        <QualityMetric
          label="Lặp đối thủ tối đa"
          value={
            report.maxOpponentRepeatCount
          }
        />
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
        <div className="font-semibold text-slate-900">
          Đánh giá:{" "}
          {quality.label}
        </div>

        <div className="mt-1 leading-6">
          {
            quality.description
          }
        </div>
      </div>
    </SectionCard>
  );
}

function QualityMetric({
  label,
  value,
}: {
  label: string;

  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="text-xs text-slate-500">
        {label}
      </div>

      <div className="mt-2 text-xl font-bold text-slate-900">
        {value}
      </div>
    </div>
  );
}

function SettingsMetric({
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

      <div className="mt-2 truncate text-lg font-bold text-slate-900">
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

function getQualityPresentation(
  score: number
): {
  label: string;

  description: string;

  variant:
    | "success"
    | "info"
    | "warning"
    | "danger";
} {
  if (score >= 90) {
    return {
      label:
        "Xuất sắc",

      description:
        "Lịch đấu có độ cân bằng rất tốt, số trận và lượt nghỉ được phân bổ hợp lý, mức độ lặp đồng đội và đối thủ thấp.",

      variant:
        "success",
    };
  }

  if (score >= 75) {
    return {
      label:
        "Tốt",

      description:
        "Lịch đấu tương đối cân bằng. Một số cặp đồng đội hoặc đối thủ có thể lặp lại nhưng vẫn ở mức phù hợp.",

      variant:
        "info",
    };
  }

  if (score >= 55) {
    return {
      label:
        "Khá",

      description:
        "Lịch đấu có thể sử dụng, tuy nhiên vẫn còn chênh lệch về số trận, lượt nghỉ hoặc mức độ lặp cặp.",

      variant:
        "warning",
    };
  }

  return {
    label:
      "Cần tối ưu",

    description:
      "Lịch đấu đang có mức chênh lệch hoặc lặp cặp tương đối cao. Scheduler nên tiếp tục được tối ưu.",

    variant:
      "danger",
  };
}

function getStarCount(
  score: number
): number {
  if (score >= 90) {
    return 5;
  }

  if (score >= 75) {
    return 4;
  }

  if (score >= 55) {
    return 3;
  }

  if (score >= 35) {
    return 2;
  }

  return 1;
}

function formatDate(
  date: string
): string {
  const parsedDate =
    new Date(
      `${date}T00:00:00`
    );

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return date;
  }

  return parsedDate.toLocaleDateString(
    "vi-VN"
  );
}

function formatDateTime(
  value?: string
): string {
  if (!value) {
    return "Không xác định";
  }

  const parsedDate =
    new Date(value);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return value;
  }

  return parsedDate.toLocaleString(
    "vi-VN"
  );
}

function sameIds(
  firstMemberIds: string[],
  secondMemberIds: string[]
): boolean {
  if (
    firstMemberIds.length !==
    secondMemberIds.length
  ) {
    return false;
  }

  const firstSortedMemberIds = [
    ...firstMemberIds,
  ].sort();

  const secondSortedMemberIds = [
    ...secondMemberIds,
  ].sort();

  return firstSortedMemberIds.every(
    (
      memberId,
      index
    ) =>
      memberId ===
      secondSortedMemberIds[
        index
      ]
  );
}
