"use client";

import SectionCard from "@/components/section-card";
import SessionRoundCard from "@/components/sessions/session-round-card";

import type {
  GeneratedSchedule,
  MatchRecord,
  Member,
  ScheduledMatch,
  SessionRecord,
} from "@/types";

type Props = {
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
}: Props) {
  return (
    <SectionCard title="Lịch đấu">
      {schedule.rounds.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
          Chưa thể tạo lịch đấu.
          <br />
          Cần đủ số thành viên hợp lệ.
        </div>
      ) : (
        <div className="space-y-5">
          {schedule.rounds.map((round) => (
            <SessionRoundCard
              key={round.round}
              round={round}
              session={session}
              memberMap={memberMap}
              findSavedMatch={findSavedMatch}
              onSaveScore={onSaveScore}
            />
          ))}
        </div>
      )}
    </SectionCard>
  );
}