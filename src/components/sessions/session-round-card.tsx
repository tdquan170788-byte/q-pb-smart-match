"use client";

import SessionMatchCard from "@/components/sessions/session-match-card";

import type {
  GeneratedRound,
  MatchRecord,
  Member,
  ScheduledMatch,
  SessionRecord,
} from "@/types";

type SessionRoundCardProps = {
  round: GeneratedRound;

  session: SessionRecord;

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

export default function SessionRoundCard({
  round,
  session,
  memberMap,
  findSavedMatch,
  onSaveScore,
}: SessionRoundCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-base font-bold text-slate-900">
          Round {round.round}
        </div>

        <RestingMembersLabel
          restingMemberIds={
            round.restingMemberIds
          }
          memberMap={memberMap}
        />
      </div>

      {round.matches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-center text-sm text-slate-500">
          Round này chưa có trận đấu.
        </div>
      ) : (
        <div className="space-y-3">
          {round.matches.map(
            (scheduledMatch) => {
              const savedMatch =
                findSavedMatch(
                  scheduledMatch
                );

              const match: MatchRecord =
                savedMatch ??
                createTemporaryMatch({
                  sessionId:
                    session.id,

                  scheduledMatch,
                });

              return (
                <SessionMatchCard
                  key={createScheduledMatchKey(
                    scheduledMatch
                  )}
                  match={match}
                  memberMap={
                    memberMap
                  }
                  onSaveScore={
                    onSaveScore
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

function RestingMembersLabel({
  restingMemberIds,
  memberMap,
}: {
  restingMemberIds: string[];

  memberMap: Map<string, Member>;
}) {
  if (
    restingMemberIds.length === 0
  ) {
    return (
      <div className="text-sm text-slate-400">
        Không có người nghỉ
      </div>
    );
  }

  const restingMemberNames =
    restingMemberIds.map(
      (memberId) =>
        memberMap.get(memberId)
          ?.name ??
        memberId
    );

  return (
    <div className="text-sm text-slate-500">
      Nghỉ:{" "}
      <span className="font-medium text-slate-700">
        {restingMemberNames.join(
          ", "
        )}
      </span>
    </div>
  );
}

function createTemporaryMatch({
  sessionId,
  scheduledMatch,
}: {
  sessionId: string;

  scheduledMatch: ScheduledMatch;
}): MatchRecord {
  return {
    id: createTemporaryMatchId({
      sessionId,

      scheduledMatch,
    }),

    sessionId,

    round:
      scheduledMatch.round,

    court:
      scheduledMatch.court,

    teamA: {
      memberIds: [
        ...scheduledMatch.teamAMemberIds,
      ],
    },

    teamB: {
      memberIds: [
        ...scheduledMatch.teamBMemberIds,
      ],
    },

    scoreA: 0,

    scoreB: 0,

    createdAt:
      new Date().toISOString(),
  };
}

function createTemporaryMatchId({
  sessionId,
  scheduledMatch,
}: {
  sessionId: string;

  scheduledMatch: ScheduledMatch;
}): string {
  return [
    sessionId,
    scheduledMatch.round,
    scheduledMatch.court,
    scheduledMatch.teamAMemberIds.join(
      "_"
    ),
    scheduledMatch.teamBMemberIds.join(
      "_"
    ),
  ].join("-");
}

function createScheduledMatchKey(
  scheduledMatch: ScheduledMatch
): string {
  return [
    scheduledMatch.round,
    scheduledMatch.court,
    scheduledMatch.teamAMemberIds.join(
      "_"
    ),
    scheduledMatch.teamBMemberIds.join(
      "_"
    ),
  ].join("-");
}