"use client";

import type { MatchRecord, Member } from "@/types";

import SessionResultForm from "./session-result-form";

type Props = {
  match: MatchRecord;
  memberMap: Map<string, Member>;
  onSaveScore: (match: MatchRecord, scoreA: number, scoreB: number) => void;
};

function getTeamDisplayNames(
  memberIds: string[],
  memberMap: Map<string, Member>
): string[] {
  return memberIds.map((id) => memberMap.get(id)?.name ?? "Unknown");
}

export default function SessionMatchCard({
  match,
  memberMap,
  onSaveScore,
}: Props) {
  const teamA = getTeamDisplayNames(match.teamA.memberIds, memberMap);
  const teamB = getTeamDisplayNames(match.teamB.memberIds, memberMap);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-900">
          Court {match.court ?? 1}
        </div>

        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          Round {match.round}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Team A
          </div>
          <div className="mt-2 font-semibold text-slate-900">
            {teamA.join(" / ")}
          </div>
        </div>

        <div className="text-center text-xl font-bold text-slate-900">
          {match.scoreA} - {match.scoreB}
        </div>

        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Team B
          </div>
          <div className="mt-2 font-semibold text-slate-900">
            {teamB.join(" / ")}
          </div>
        </div>
      </div>

      <SessionResultForm
        initialScoreA={match.scoreA}
        initialScoreB={match.scoreB}
        onSave={(scoreA, scoreB) => onSaveScore(match, scoreA, scoreB)}
      />
    </div>
  );
}
