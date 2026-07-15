"use client";

import {
  CheckCircle2,
  ChevronDown,
  Circle,
  PlayCircle,
} from "lucide-react";

import SessionMatchCard from "@/components/sessions/session-match-card";

import type {
  GeneratedRound,
  MatchRecord,
  Member,
  ScheduledMatch,
  SessionRecord,
} from "@/types";

type RoundStatus =
  | "completed"
  | "current"
  | "waiting";

type SessionRoundCardProps = {
  round: GeneratedRound;

  session: SessionRecord;

  memberMap: Map<string, Member>;

  expanded: boolean;

  status: RoundStatus;

  completedMatches: number;

  totalMatches: number;

  completionPercent: number;

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
  status,
  completedMatches,
  totalMatches,
  completionPercent,
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

  const presentation =
    getRoundPresentation(
      status
    );

  return (
    <div
      className={`overflow-hidden rounded-2xl border ${presentation.containerClassName}`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className={`w-full p-4 text-left transition ${presentation.buttonClassName}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${presentation.iconClassName}`}
            >
              {presentation.icon}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-base font-bold text-slate-900">
                  Round {round.round}
                </div>

                <div
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${presentation.badgeClassName}`}
                >
                  {
                    presentation.label
                  }
                </div>
              </div>

              <div className="mt-1 truncate text-sm text-slate-500">
                {restingMemberNames.length >
                0
                  ? `Nghỉ: ${restingMemberNames.join(
                      ", "
                    )}`
                  : "Không có người nghỉ"}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
              {completedMatches}
              {" / "}
              {totalMatches}
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
        </div>

        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-white">
            <div
              className={`h-full rounded-full transition-all ${presentation.progressClassName}`}
              style={{
                width: `${completionPercent}%`,
              }}
            />
          </div>

          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              {completedMatches} trận đã
              hoàn thành
            </span>

            <span>
              {completionPercent}%
            </span>
          </div>
        </div>
      </button>

      {expanded ? (
        <div className="border-t border-slate-200 bg-slate-50 p-4">
          {round.matches.length ===
          0 ? (
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

function getRoundPresentation(
  status: RoundStatus
): {
  label: string;

  icon: React.ReactNode;

  containerClassName: string;

  buttonClassName: string;

  iconClassName: string;

  badgeClassName: string;

  progressClassName: string;
} {
  if (status === "completed") {
    return {
      label:
        "Hoàn thành",

      icon: (
        <CheckCircle2
          size={19}
        />
      ),

      containerClassName:
        "border-emerald-200 bg-emerald-50",

      buttonClassName:
        "bg-emerald-50 hover:bg-emerald-100/70",

      iconClassName:
        "bg-emerald-100 text-emerald-700",

      badgeClassName:
        "bg-emerald-100 text-emerald-700",

      progressClassName:
        "bg-emerald-500",
    };
  }

  if (status === "current") {
    return {
      label:
        "Đang thi đấu",

      icon: (
        <PlayCircle
          size={19}
        />
      ),

      containerClassName:
        "border-brand-300 bg-brand-50 shadow-sm",

      buttonClassName:
        "bg-brand-50 hover:bg-brand-100/70",

      iconClassName:
        "bg-brand-100 text-brand-700",

      badgeClassName:
        "bg-brand-600 text-white",

      progressClassName:
        "bg-brand-600",
    };
  }

  return {
    label:
      "Chờ thi đấu",

    icon: (
      <Circle
        size={18}
      />
    ),

    containerClassName:
      "border-slate-200 bg-white",

    buttonClassName:
      "bg-white hover:bg-slate-50",

    iconClassName:
      "bg-slate-100 text-slate-500",

    badgeClassName:
      "bg-slate-100 text-slate-600",

    progressClassName:
      "bg-slate-400",
  };
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
