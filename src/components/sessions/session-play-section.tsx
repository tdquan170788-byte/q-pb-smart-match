"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import SectionCard from "@/components/section-card";
import SessionRoundCard from "@/components/sessions/session-round-card";

import type {
  GeneratedRound,
  GeneratedSchedule,
  MatchRecord,
  Member,
  ScheduledMatch,
  SessionRecord,
} from "@/types";

type SessionPlaySectionProps = {
  session: SessionRecord;

  schedule: GeneratedSchedule;

  memberMap: Map<string, Member>;

  findSavedMatch: (
    scheduledMatch: ScheduledMatch
  ) => MatchRecord | undefined;

  onSaveScore: (
    match: MatchRecord,
    scoreA: number,
    scoreB: number
  ) => void;
};

type RoundProgress = {
  roundNumber: number;

  completedMatches: number;

  totalMatches: number;

  completionPercent: number;

  completed: boolean;
};

export default function SessionPlaySection({
  session,
  schedule,
  memberMap,
  findSavedMatch,
  onSaveScore,
}: SessionPlaySectionProps) {
  const roundProgressMap =
    useMemo(() => {
      return buildRoundProgressMap({
        rounds: schedule.rounds,

        findSavedMatch,
      });
    }, [
      schedule.rounds,
      findSavedMatch,
    ]);

  const currentRoundNumber =
    useMemo(() => {
      return findCurrentRoundNumber({
        rounds: schedule.rounds,

        roundProgressMap,
      });
    }, [
      schedule.rounds,
      roundProgressMap,
    ]);

  const roundRefs =
    useRef<
      Record<number, HTMLDivElement | null>
    >({});

  const [
    expandedRoundNumbers,
    setExpandedRoundNumbers,
  ] = useState<number[]>(() => {
    const firstRound =
      schedule.rounds[0];

    return firstRound
      ? [firstRound.round]
      : [];
  });

  /**
   * Khi round hiện tại thay đổi:
   *
   * - mở round mới;
   * - đóng round hiện tại cũ;
   * - vẫn cho phép người dùng mở thêm các round khác sau đó.
   */
  useEffect(() => {
  if (
    currentRoundNumber === null
  ) {
    return;
  }

  setExpandedRoundNumbers([
    currentRoundNumber,
  ]);

  requestAnimationFrame(() => {
    roundRefs.current[
      currentRoundNumber
    ]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}, [currentRoundNumber]);

  function toggleRound(
    roundNumber: number
  ): void {
    setExpandedRoundNumbers(
      (
        previousRoundNumbers
      ) => {
        if (
          previousRoundNumbers.includes(
            roundNumber
          )
        ) {
          return previousRoundNumbers.filter(
            (
              currentRoundNumberValue
            ) =>
              currentRoundNumberValue !==
              roundNumber
          );
        }

        return [
          ...previousRoundNumbers,
          roundNumber,
        ];
      }
    );
  }

  if (
    schedule.rounds.length === 0
  ) {
    return (
      <SectionCard title="Lịch đấu">
        <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
          Chưa thể tạo lịch đấu.
          <br />
          Cần đủ số thành viên hợp lệ.
        </div>
      </SectionCard>
    );
  }

  const totalCompletedMatches =
    [...roundProgressMap.values()].reduce(
      (
        total,
        progress
      ) =>
        total +
        progress.completedMatches,
      0
    );

  const totalMatches =
    [...roundProgressMap.values()].reduce(
      (
        total,
        progress
      ) =>
        total +
        progress.totalMatches,
      0
    );

  return (
    <SectionCard
      title="Lịch đấu"
      action={
        <div className="rounded-full bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">
          {totalCompletedMatches}
          {" / "}
          {totalMatches} trận
        </div>
      }
    >
      <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <PlaySummaryMetric
            label="Round hiện tại"
            value={
              currentRoundNumber !== null
                ? `Round ${currentRoundNumber}`
                : "Không xác định"
            }
          />

          <PlaySummaryMetric
            label="Đã hoàn thành"
            value={
              totalCompletedMatches
            }
          />

          <PlaySummaryMetric
            label="Còn lại"
            value={Math.max(
              0,
              totalMatches -
                totalCompletedMatches
            )}
          />

          <PlaySummaryMetric
            label="Tổng round"
            value={
              schedule.totalRounds
            }
          />
        </div>
      </div>

      <div className="space-y-3">
        {schedule.rounds.map(
          (round) => {
            const progress =
              roundProgressMap.get(
                round.round
              ) ??
              createEmptyRoundProgress(
                round
              );

            const status =
              getRoundStatus({
                roundNumber:
                  round.round,

                currentRoundNumber,

                completed:
                  progress.completed,
              });

            return (
              <div
                key={round.round}

  ref={(element) => {
    roundRefs.current[
      round.round
    ] = element;
  }}
>
              <div
                className={
                  status === "current"
                    ? "rounded-2xl border-2 border-emerald-500 bg-emerald-50 p-1"
                    : status === "completed"
                    ? "rounded-2xl border border-emerald-200 bg-emerald-50/40 p-1"
                    : "rounded-2xl border border-slate-200 p-1"
                }
              >
                <SessionRoundCard
                round={round}
                session={session}
                memberMap={memberMap}
                expanded={expandedRoundNumbers.includes(
                  round.round
                )}
                status={status}
                completedMatches={
                  progress.completedMatches
                }
                totalMatches={
                  progress.totalMatches
                }
                completionPercent={
                  progress.completionPercent
                }
                onToggle={() =>
                  toggleRound(
                    round.round
                  )
                }
                findSavedMatch={
                  findSavedMatch
                }
                onSaveScore={
                  onSaveScore
                }
              />
              </div>
              </div>
            );
          }
        )}
      </div>
    </SectionCard>
  );
}

function buildRoundProgressMap({
  rounds,
  findSavedMatch,
}: {
  rounds: GeneratedRound[];

  findSavedMatch: (
    scheduledMatch: ScheduledMatch
  ) => MatchRecord | undefined;
}): Map<number, RoundProgress> {
  const progressMap =
    new Map<
      number,
      RoundProgress
    >();

  for (const round of rounds) {
    const totalMatches =
      round.matches.length;

    const completedMatches =
      round.matches.reduce(
        (
          total,
          scheduledMatch
        ) => {
          const savedMatch =
            findSavedMatch(
              scheduledMatch
            );

          return (
            total +
            (
              savedMatch &&
              isCompletedMatch(
                savedMatch
              )
                ? 1
                : 0
            )
          );
        },
        0
      );

    progressMap.set(
      round.round,
      {
        roundNumber:
          round.round,

        completedMatches,

        totalMatches,

        completionPercent:
          calculateCompletionPercent({
            completedMatches,

            totalMatches,
          }),

        completed:
          totalMatches > 0 &&
          completedMatches >=
            totalMatches,
      }
    );
  }

  return progressMap;
}

function findCurrentRoundNumber({
  rounds,
  roundProgressMap,
}: {
  rounds: GeneratedRound[];

  roundProgressMap: Map<
    number,
    RoundProgress
  >;
}): number | null {
  if (rounds.length === 0) {
    return null;
  }

  const orderedRounds = [
    ...rounds,
  ].sort(
    (
      firstRound,
      secondRound
    ) =>
      firstRound.round -
      secondRound.round
  );

  const firstIncompleteRound =
    orderedRounds.find(
      (round) => {
        const progress =
          roundProgressMap.get(
            round.round
          );

        return (
          !progress ||
          !progress.completed
        );
      }
    );

  if (firstIncompleteRound) {
    return firstIncompleteRound.round;
  }

  return (
    orderedRounds[
      orderedRounds.length - 1
    ]?.round ??
    null
  );
}

function getRoundStatus({
  roundNumber,
  currentRoundNumber,
  completed,
}: {
  roundNumber: number;

  currentRoundNumber: number | null;

  completed: boolean;
}):
  | "completed"
  | "current"
  | "waiting" {
  if (completed) {
    return "completed";
  }

  if (
    currentRoundNumber ===
    roundNumber
  ) {
    return "current";
  }

  return "waiting";
}

function createEmptyRoundProgress(
  round: GeneratedRound
): RoundProgress {
  return {
    roundNumber:
      round.round,

    completedMatches:
      0,

    totalMatches:
      round.matches.length,

    completionPercent:
      0,

    completed:
      false,
  };
}

function isCompletedMatch(
  match: MatchRecord
): boolean {
  if (
    !Number.isFinite(
      match.scoreA
    ) ||
    !Number.isFinite(
      match.scoreB
    )
  ) {
    return false;
  }

  if (
    match.scoreA < 0 ||
    match.scoreB < 0
  ) {
    return false;
  }

  if (
    match.scoreA === 0 &&
    match.scoreB === 0
  ) {
    return false;
  }

  return (
    match.scoreA !==
    match.scoreB
  );
}

function calculateCompletionPercent({
  completedMatches,
  totalMatches,
}: {
  completedMatches: number;

  totalMatches: number;
}): number {
  if (totalMatches <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (
          completedMatches /
          totalMatches
        ) *
          100
      )
    )
  );
}

function PlaySummaryMetric({
  label,
  value,
}: {
  label: string;

  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-white p-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div className="mt-1 truncate text-base font-bold text-slate-900">
        {value}
      </div>
    </div>
  );
}
