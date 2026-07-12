"use client";

import { useEffect, useMemo, useState } from "react";
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
import SessionMatchCard from "@/components/sessions/session-match-card";
import SessionProgressCard from "@/components/sessions/session-progress-card";

import Badge from "@/components/ui/badge";
import Progress from "@/components/ui/progress";

import type {
  GeneratedSchedule,
  MatchRecord,
  Member,
  ScheduleQualityReport,
  SessionRecord,
} from "@/types";

import {
  ensureSeedData,
  getMatchesBySessionId,
  getMembers,
  getSessionById,
  upsertMatch,
} from "@/lib/storage";

import { analyzeSchedule } from "@/lib/scheduler";
import { generateScheduleForSession } from "@/lib/session";
import { buildSessionProgress } from "@/lib/sessions";

import {
  freezeSessionSchedule,
  isSessionScheduleFrozen,
} from "@/lib/sessions/frozen-schedule.service";

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id;

  const [session, setSession] =
    useState<SessionRecord | null>(null);

  const [members, setMembers] =
    useState<Member[]>([]);

  const [matches, setMatches] =
    useState<MatchRecord[]>([]);

  const [freezingSchedule, setFreezingSchedule] =
    useState(false);

  const [freezeMessage, setFreezeMessage] =
    useState("");

  useEffect(() => {
    ensureSeedData();

    setSession(
      getSessionById(sessionId) ?? null
    );

    setMembers(getMembers());

    setMatches(
      getMatchesBySessionId(sessionId)
    );
  }, [sessionId]);

  const memberMap = useMemo(() => {
    return new Map(
      members.map((member) => [
        member.id,
        member,
      ])
    );
  }, [members]);

  const schedule: GeneratedSchedule | null =
    useMemo(() => {
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
    if (!session || !schedule) {
      return null;
    }

    return analyzeSchedule({
      schedule,
      memberIds: session.memberIds,
    });
  }, [session, schedule]);

  const sessionProgress = useMemo(() => {
    if (!schedule) {
      return null;
    }

    return buildSessionProgress({
      schedule,
      savedMatches: matches,
    });
  }, [schedule, matches]);

  const scheduleFrozen = useMemo(() => {
    if (!session) {
      return false;
    }

    return isSessionScheduleFrozen(
      session
    );
  }, [session]);

  const roundModeLabel =
    session?.targetRounds !== undefined
      ? "Tùy chỉnh"
      : "Tự động";

  const configuredRoundValue =
    session?.targetRounds !== undefined
      ? session.targetRounds
      : "Theo Scheduler";

  function refreshMatches(): void {
    setMatches(
      getMatchesBySessionId(sessionId)
    );
  }

  function findSavedMatch(
    scheduledMatch: {
      round: number;
      court: number;
      teamAMemberIds: string[];
      teamBMemberIds: string[];
    }
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
      sessionId: match.sessionId,
      round: match.round,
      court: match.court,
      teamA: match.teamA,
      teamB: match.teamB,
      scoreA,
      scoreB,
    });

    refreshMatches();
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

      setSession(result.session);

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

  if (!session || !schedule) {
    return (
      <AppShell
        title="Session"
        subtitle="Không tìm thấy session"
      >
        <SectionCard title="Không tìm thấy dữ liệu">
          <div className="text-sm text-slate-600">
            Session này không tồn tại hoặc
            dữ liệu đã bị xoá.
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
        <SectionCard title="Thông tin session">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <SummaryBox
              label="Ngày chơi"
              value={formatDate(
                session.date
              )}
            />

            <SummaryBox
              label="Mode"
              value={
                session.mode === "team"
                  ? "Team"
                  : "Normal"
              }
            />

            <SummaryBox
              label="Điểm thắng"
              value={
                session.pointToWin
              }
            />

            <SummaryBox
              label="Số sân"
              value={
                session.courtCount ?? 1
              }
            />

            <SummaryBox
              label="Round thiết lập"
              value={
                configuredRoundValue
              }
            />

            <SummaryBox
              label="Round thực tế"
              value={
                schedule.totalRounds
              }
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-2 text-sm font-semibold ${
                session.targetRounds !==
                undefined
                  ? "bg-brand-50 text-brand-700"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              Kiểu round:{" "}
              {roundModeLabel}
            </span>

            {session.targetRounds !==
            undefined ? (
              <span className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700">
                Yêu cầu{" "}
                <strong>
                  {session.targetRounds}
                </strong>{" "}
                round
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700">
                Scheduler tự xác định số
                round
              </span>
            )}

            {session.targetRounds !==
              undefined &&
            session.targetRounds !==
              schedule.totalRounds ? (
              <span className="rounded-full bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-800">
                Chênh lệch thiết lập và
                lịch thực tế
              </span>
            ) : null}
          </div>
        </SectionCard>

        {sessionProgress ? (
          <SessionProgressCard
            progress={sessionProgress}
          />
        ) : null}

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
                    Session này luôn sử dụng
                    lịch đã lưu. Các thay đổi
                    Scheduler trong tương lai
                    sẽ không làm thay đổi các
                    trận đấu.
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
                    Session cũ chưa đóng
                    băng lịch
                  </div>

                  <div className="mt-1 text-sm leading-6 text-amber-800">
                    Lịch hiện tại vẫn đang
                    được tạo lại từ Scheduler
                    mỗi khi mở session. Hãy
                    đóng băng để giữ cố định
                    lịch đang hiển thị.
                  </div>

                  <button
                    type="button"
                    onClick={
                      handleFreezeSchedule
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

        {qualityReport ? (
          <>
            <ScheduleQualityCard
              report={qualityReport}
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
          </>
        ) : null}

        <SectionCard title="Thành viên tham gia">
          <div className="flex flex-wrap gap-2">
            {session.memberIds.map(
              (memberId) => {
                const member =
                  memberMap.get(
                    memberId
                  );

                return (
                  <span
                    key={memberId}
                    className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700"
                  >
                    {member?.name ??
                      memberId}
                  </span>
                );
              }
            )}
          </div>
        </SectionCard>

        <SectionCard title="Lịch đấu">
          {schedule.rounds.length ===
          0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              Chưa thể tạo lịch đấu. Cần đủ
              số thành viên hợp lệ.
            </div>
          ) : (
            <div className="space-y-5">
              {schedule.rounds.map(
                (round) => (
                  <div
                    key={round.round}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-base font-bold text-slate-900">
                        Round{" "}
                        {round.round}
                      </div>

                      {round
                        .restingMemberIds
                        .length > 0 ? (
                        <div className="text-sm text-slate-500">
                          Nghỉ:{" "}
                          <span className="font-medium text-slate-700">
                            {round.restingMemberIds
                              .map(
                                (
                                  memberId
                                ) =>
                                  memberMap.get(
                                    memberId
                                  )
                                    ?.name ??
                                  memberId
                              )
                              .join(", ")}
                          </span>
                        </div>
                      ) : (
                        <div className="text-sm text-slate-400">
                          Không có người nghỉ
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      {round.matches.map(
                        (
                          scheduledMatch
                        ) => {
                          const savedMatch =
                            findSavedMatch(
                              scheduledMatch
                            );

                          const match:
                            MatchRecord =
                            savedMatch ?? {
                              id: `${session.id}_${scheduledMatch.round}_${scheduledMatch.court}`,

                              sessionId:
                                session.id,

                              round:
                                scheduledMatch.round,

                              court:
                                scheduledMatch.court,

                              teamA: {
                                memberIds:
                                  scheduledMatch.teamAMemberIds,
                              },

                              teamB: {
                                memberIds:
                                  scheduledMatch.teamBMemberIds,
                              },

                              scoreA: 0,
                              scoreB: 0,

                              createdAt:
                                new Date().toISOString(),
                            };

                          return (
                            <SessionMatchCard
                              key={[
                                scheduledMatch.round,
                                scheduledMatch.court,
                                scheduledMatch.teamAMemberIds.join(
                                  "_"
                                ),
                                scheduledMatch.teamBMemberIds.join(
                                  "_"
                                ),
                              ].join(
                                "-"
                              )}
                              match={
                                match
                              }
                              memberMap={
                                memberMap
                              }
                              onSaveScore={
                                handleSaveScore
                              }
                            />
                          );
                        }
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
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

  const starCount = getStarCount(
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
              <BarChart3 size={17} />
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
            }).map((_, index) => (
              <Star
                key={index}
                size={20}
                className={
                  index < starCount
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-slate-600"
                }
              />
            ))}
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
          Đánh giá: {quality.label}
        </div>

        <div className="mt-1 leading-6">
          {quality.description}
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

function SummaryBox({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div className="mt-2 text-lg font-bold text-slate-900">
        {value}
      </div>
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
      label: "Xuất sắc",
      description:
        "Lịch đấu có độ cân bằng rất tốt, số trận và lượt nghỉ được phân bổ hợp lý, mức độ lặp đồng đội và đối thủ thấp.",
      variant: "success",
    };
  }

  if (score >= 75) {
    return {
      label: "Tốt",
      description:
        "Lịch đấu tương đối cân bằng. Một số cặp đồng đội hoặc đối thủ có thể lặp lại nhưng vẫn ở mức phù hợp.",
      variant: "info",
    };
  }

  if (score >= 55) {
    return {
      label: "Khá",
      description:
        "Lịch đấu có thể sử dụng, tuy nhiên vẫn còn chênh lệch về số trận, lượt nghỉ hoặc mức độ lặp cặp.",
      variant: "warning",
    };
  }

  return {
    label: "Cần tối ưu",
    description:
      "Lịch đấu đang có mức chênh lệch hoặc lặp cặp tương đối cao. Scheduler nên tiếp tục được tối ưu.",
    variant: "danger",
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
  const parsedDate = new Date(
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
    (memberId, index) =>
      memberId ===
      secondSortedMemberIds[index]
  );
}
