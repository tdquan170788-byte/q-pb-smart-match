"use client";

import { ChevronDown } from "lucide-react";

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

  expanded: boolean;

  onToggle: () => void;

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
  expanded,
  onToggle,
  findSavedMatch,
  onSaveScore,
}: SessionRoundCardProps) {
  const restingMemberNames =
    getRestingMemberNames({
      restingMemberIds:
        round.restingMemberIds,

      memberMap,
    });

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-slate-100"
      >
        <div className="min-w-0 flex-1">
          <div className="text-base font-bold text-slate-900">
            Round {round.round}
          </div>

          <div className="mt-1 truncate text-sm text-slate-500">
            {restingMemberNames.length > 0
              ? `Nghỉ: ${restingMemberNames.join(", ")}`
              : "Không có người nghỉ"}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
            {round.matches.length} trận
          </div>

          <ChevronDown
            size={19}
            className={`text-slate-500 transition-transform ${
              expanded
                ? "rotate-180"
                : ""
            }`}
          />
        </div>
      </button>

      {expanded ? (
        <div className="border-t border-slate-200 p-4">
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

                  const match:
                    MatchRecord =
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
      ) : null}
    </div>
  );
}

function getRestingMemberNames({
  restingMemberIds,
  memberMap,
}: {
  restingMemberIds: string[];

  memberMap: Map<string, Member>;
}): string[] {
  return restingMemberIds.map(
    (memberId) =>
      memberMap.get(memberId)
        ?.name ??
      memberId
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
