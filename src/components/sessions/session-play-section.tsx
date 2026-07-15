"use client";

import {
  useState,
} from "react";

import SectionCard from "@/components/section-card";
import SessionRoundCard from "@/components/sessions/session-round-card";

import type {
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

export default function SessionPlaySection({
  session,
  schedule,
  memberMap,
  findSavedMatch,
  onSaveScore,
}: SessionPlaySectionProps) {
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

  function toggleRound(
    roundNumber: number
  ): void {
    setExpandedRoundNumbers(
      (
        previousRoundNumbers
      ) => {
        const alreadyExpanded =
          previousRoundNumbers.includes(
            roundNumber
          );

        if (alreadyExpanded) {
          return previousRoundNumbers.filter(
            (
              currentRoundNumber
            ) =>
              currentRoundNumber !==
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

  return (
    <SectionCard title="Lịch đấu">
      {schedule.rounds.length ===
      0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
          Chưa thể tạo lịch đấu.
          <br />
          Cần đủ số thành viên hợp lệ.
        </div>
      ) : (
        <div className="space-y-3">
          {schedule.rounds.map(
            (round) => (
              <SessionRoundCard
                key={round.round}
                round={round}
                session={session}
                memberMap={memberMap}
                expanded={expandedRoundNumbers.includes(
                  round.round
                )}
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
            )
          )}
        </div>
      )}
    </SectionCard>
  );
}
