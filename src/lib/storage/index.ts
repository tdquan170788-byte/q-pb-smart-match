import type { MatchRecord, Member, SessionRecord } from "@/types";

import { safeRead, safeWrite } from "./local";
import { seededMembers } from "./seed";

const MEMBERS_KEY = "qpb_members";
const MATCHES_KEY = "qpb_matches";
const SESSIONS_KEY = "qpb_sessions";

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function sameIds(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;

  const aa = [...a].sort();
  const bb = [...b].sort();

  return aa.every((id, index) => id === bb[index]);
}

function withMemberDefaults(
  member: Partial<Member> & Pick<Member, "id" | "name">
): Member {
  return {
    id: member.id,
    name: member.name,
    nickname: member.nickname ?? "",
    createdAt: member.createdAt ?? new Date().toISOString(),

    rating: member.rating ?? 1000,
    wins: member.wins ?? 0,
    losses: member.losses ?? 0,
    matches: member.matches ?? 0,

    ratingNormal: member.ratingNormal ?? 1000,
    winsNormal: member.winsNormal ?? 0,
    lossesNormal: member.lossesNormal ?? 0,
    matchesNormal: member.matchesNormal ?? 0,
    pointsForNormal: member.pointsForNormal ?? 0,
    pointsAgainstNormal: member.pointsAgainstNormal ?? 0,

    ratingTeam: member.ratingTeam ?? 1000,
    winsTeam: member.winsTeam ?? 0,
    lossesTeam: member.lossesTeam ?? 0,
    matchesTeam: member.matchesTeam ?? 0,
    pointsForTeam: member.pointsForTeam ?? 0,
    pointsAgainstTeam: member.pointsAgainstTeam ?? 0,
  };
}

function normalizeMatchRecord(match: Partial<MatchRecord>): MatchRecord {
  return {
    id: match.id ?? createId("match"),
    sessionId: match.sessionId ?? "",
    round: Number(match.round ?? 1),
    court: Number(match.court ?? 1),
    scoreA: Number(match.scoreA ?? 0),
    scoreB: Number(match.scoreB ?? 0),
    createdAt: match.createdAt ?? new Date().toISOString(),
    teamA: {
      memberIds: match.teamA?.memberIds ?? [],
    },
    teamB: {
      memberIds: match.teamB?.memberIds ?? [],
    },
  };
}

function normalizeSessionRecord(session: Partial<SessionRecord>): SessionRecord {
  return {
    id: session.id ?? createId("session"),
    date: session.date ?? new Date().toISOString().slice(0, 10),
    pointToWin: Number(session.pointToWin ?? 11),
    memberIds: session.memberIds ?? [],
    createdAt: session.createdAt ?? new Date().toISOString(),
    mode: session.mode ?? "normal",
    courtCount: Number(session.courtCount ?? 1),
    teamConfig: session.teamConfig,
  };
}

/* =========================================================
   SEED
========================================================= */

export function seedMembersIfEmpty(): void {
  const members = safeRead<Member[]>(MEMBERS_KEY, []);

  if (!Array.isArray(members) || members.length === 0) {
    safeWrite(MEMBERS_KEY, seededMembers);
  }
}

export function ensureSeedMembers(): void {
  seedMembersIfEmpty();
}

export function ensureSeedData(): void {
  const members = safeRead<Member[]>(MEMBERS_KEY, []);

  if (!Array.isArray(members) || members.length === 0) {
    safeWrite(MEMBERS_KEY, seededMembers);
  }

  const matches = safeRead<MatchRecord[]>(MATCHES_KEY, []);

  if (!Array.isArray(matches)) {
    safeWrite(MATCHES_KEY, []);
  }

  const sessions = safeRead<SessionRecord[]>(SESSIONS_KEY, []);

  if (!Array.isArray(sessions)) {
    safeWrite(SESSIONS_KEY, []);
  }
}

export function resetSeedMembers(): void {
  safeWrite(MEMBERS_KEY, seededMembers);
}

/* =========================================================
   MEMBERS
========================================================= */

export function getMembers(): Member[] {
  const members = safeRead<Member[]>(MEMBERS_KEY, []);

  if (!Array.isArray(members)) {
    return [];
  }

  return members.map((member) => withMemberDefaults(member));
}

export function saveMembers(members: Member[]): void {
  safeWrite(
    MEMBERS_KEY,
    members.map((member) => withMemberDefaults(member))
  );
}

export function createMember(payload: {
  name: string;
  nickname?: string;
}): Member {
  const members = getMembers();

  const newMember = withMemberDefaults({
    id: createId("member"),
    name: payload.name.trim(),
    nickname: payload.nickname?.trim() || "",
    createdAt: new Date().toISOString(),
  });

  saveMembers([newMember, ...members]);

  return newMember;
}

export function updateMember(
  memberId: string,
  payload: {
    name?: string;
    nickname?: string;
  }
): void {
  const members = getMembers();

  const nextMembers = members.map((member) => {
    if (member.id !== memberId) {
      return member;
    }

    return withMemberDefaults({
      ...member,
      name: payload.name?.trim() ?? member.name,
      nickname: payload.nickname?.trim() ?? member.nickname ?? "",
    });
  });

  saveMembers(nextMembers);
}

export function deleteMember(memberId: string): void {
  saveMembers(getMembers().filter((member) => member.id !== memberId));
}

/* =========================================================
   MATCHES
========================================================= */

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

/* =========================================================
   SESSIONS
========================================================= */

export function getSessions(): SessionRecord[] {
  const sessions = safeRead<SessionRecord[]>(SESSIONS_KEY, []);

  if (!Array.isArray(sessions)) {
    return [];
  }

  return sessions.map((session) => normalizeSessionRecord(session));
}

export function saveSessions(sessions: SessionRecord[]): void {
  safeWrite(
    SESSIONS_KEY,
    sessions.map((session) => normalizeSessionRecord(session))
  );
}

export function createSession(payload: {
  date: string;
  pointToWin: number;
  memberIds: string[];
  mode?: "normal" | "team";
  courtCount?: number;
  teamConfig?: {
    teamAMemberIds: string[];
    teamBMemberIds: string[];
  };
}): SessionRecord {
  const sessions = getSessions();

  const newSession = normalizeSessionRecord({
    id: createId("session"),
    date: payload.date,
    pointToWin: payload.pointToWin,
    memberIds: payload.memberIds,
    createdAt: new Date().toISOString(),
    mode: payload.mode ?? "normal",
    courtCount: payload.courtCount ?? 1,
    teamConfig: payload.teamConfig,
  });

  saveSessions([newSession, ...sessions]);

  return newSession;
}

export function addSession(session: Omit<SessionRecord, "id">): SessionRecord {
  const sessions = getSessions();

  const newSession = normalizeSessionRecord({
    ...session,
    id: createId("session"),
  });

  saveSessions([newSession, ...sessions]);

  return newSession;
}
