import type { MatchRecord } from "@/types";

import { safeRead, safeWrite } from "./local";

const MATCHES_KEY = "qpb_matches";

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function sameIds(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;

  const aa = [...a].sort();
  const bb = [...b].sort();

  return aa.every((id, index) => id === bb[index]);
}

function normalizeMatchRecord(match: Partial<MatchRecord>): MatchRecord {
  return {
    id: match.id ?? createId("match"),
    sessionId: match.sessionId ?? "",
    round: Number(match.round ?? 1),
    court: Number(match.court ?? 1),
    teamA: {
      memberIds: match.teamA?.memberIds ?? [],
    },
    teamB: {
      memberIds: match.teamB?.memberIds ?? [],
    },
    scoreA: Number(match.scoreA ?? 0),
    scoreB: Number(match.scoreB ?? 0),
    createdAt: match.createdAt ?? new Date().toISOString(),
  };
}

export function getMatches(): MatchRecord[] {
  const matches = safeRead<MatchRecord[]>(MATCHES_KEY, []);

  if (!Array.isArray(matches)) {
    return [];
  }

  return matches.map((match) => normalizeMatchRecord(match));
}

export function saveMatches(matches: MatchRecord[]): void {
  safeWrite(
    MATCHES_KEY,
    matches.map((match) => normalizeMatchRecord(match))
  );
}

export function getMatchesBySessionId(sessionId: string): MatchRecord[] {
  return getMatches().filter((match) => match.sessionId === sessionId);
}

export function addMatch(match: Omit<MatchRecord, "id">): MatchRecord {
  const matches = getMatches();

  const newMatch = normalizeMatchRecord({
    ...match,
    id: createId("match"),
  });

  saveMatches([newMatch, ...matches]);

  return newMatch;
}

export function upsertMatch(payload: {
  sessionId: string;
  round: number;
  court?: number;
  teamA: {
    memberIds: string[];
  };
  teamB: {
    memberIds: string[];
  };
  scoreA: number;
  scoreB: number;
}): MatchRecord {
  const matches = getMatches();

  const existingMatch = matches.find(
    (match) =>
      match.sessionId === payload.sessionId &&
      match.round === payload.round &&
      (match.court ?? 1) === (payload.court ?? 1) &&
      sameIds(match.teamA.memberIds, payload.teamA.memberIds) &&
      sameIds(match.teamB.memberIds, payload.teamB.memberIds)
  );

  if (existingMatch) {
    const updatedMatch = normalizeMatchRecord({
      ...existingMatch,
      scoreA: payload.scoreA,
      scoreB: payload.scoreB,
      court: payload.court ?? existingMatch.court ?? 1,
    });

    saveMatches(
      matches.map((match) =>
        match.id === existingMatch.id ? updatedMatch : match
      )
    );

    return updatedMatch;
  }

  const createdMatch = normalizeMatchRecord({
    id: createId("match"),
    sessionId: payload.sessionId,
    round: payload.round,
    court: payload.court ?? 1,
    teamA: payload.teamA,
    teamB: payload.teamB,
    scoreA: payload.scoreA,
    scoreB: payload.scoreB,
    createdAt: new Date().toISOString(),
  });

  saveMatches([createdMatch, ...matches]);

  return createdMatch;
}

export function deleteMatch(matchId: string): void {
  saveMatches(getMatches().filter((match) => match.id !== matchId));
}

export function deleteMatchesBySessionId(sessionId: string): void {
  saveMatches(getMatches().filter((match) => match.sessionId !== sessionId));
}
