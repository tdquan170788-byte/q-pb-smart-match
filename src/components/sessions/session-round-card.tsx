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
          restingMember