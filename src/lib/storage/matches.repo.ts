import type { MatchRecord } from "@/types";

const MATCHES_KEY = "qpb_matches";

function isBrowser() {
  return typeof window !== "undefined";
}

function safeRead<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T) {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function sameIds(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const aa = [...a].sort();
  const bb = [...b].sort();
  return aa.every((id, idx) => id === bb[idx]);
}

function normalizeMatchRecord(match: MatchRecord): MatchRecord {
  const teamA = match.teamA as MatchRecord["teamA"] & {
    playerIds?: string[];
    memberIds?: string[];
  };
  const teamB = match.teamB as MatchRecord["teamB"] & {
    playerIds?: string[];
    memberIds?: string[];
  };

  return {
    ...match,
    teamA: {
      memberIds: teamA.memberIds ?? teamA.playerIds ?? [],
    },
    teamB: {
      memberIds: teamB.memberIds ?? teamB.playerIds ?? [],
    },
  };
}

export function getMatches(): MatchRecord[] {
  const matches = safeRead<MatchRecord[]>(MATCHES_KEY, []);
  return matches.map(normalizeMatchRecord);
}

export function saveMatches(matches: MatchRecord[]) {
  safeWrite(MATCHES_KEY, matches.map(normalizeMatchRecord));
}

export function addMatch(match: Omit<MatchRecord, "id">): MatchRecord {
  const matches = getMatches();

  const newMatch: MatchRecord = normalizeMatchRecord({
    ...match,
    id: createId("match"),
  });

  const next = [newMatch, ...matches];
  saveMatches(next);
  return newMatch;
}

export function upsertMatch(payload: {
  sessionId: string;
  round: number;
  court?: number;
  teamA: { memberIds: string[] };
  teamB: { memberIds: string[] };
  scoreA: number;
  scoreB: number;
}): MatchRecord {
  const matches = getMatches();

  const existing = matches.find(
    (m) =>
      m.sessionId === payload.sessionId &&
      m.round === payload.round &&
      (m.court ?? 1) === (payload.court ?? 1) &&
      sameIds(m.teamA.memberIds, payload.teamA.memberIds) &&
      sameIds(m.teamB.memberIds, payload.teamB.memberIds)
  );

  if (existing) {
    const updated: MatchRecord = {
      ...existing,
      scoreA: payload.scoreA,
      scoreB: payload.scoreB,
      court: payload.court ?? existing.court ?? 1,
    };

    const next = matches.map((m) => (m.id === existing.id ? updated : m));
    saveMatches(next);
    return updated;
  }

  const created: MatchRecord = {
    id: createId("match"),
    sessionId: payload.sessionId,
    round: payload.round,
    court: payload.court ?? 1,
    teamA: payload.teamA,
    teamB: payload.teamB,
    scoreA: payload.scoreA,
    scoreB: payload.scoreB,
    createdAt: new Date().toISOString(),
  };

  saveMatches([created, ...matches]);
  return created;
}