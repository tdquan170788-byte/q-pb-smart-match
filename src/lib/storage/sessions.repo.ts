import type { SessionMode, SessionRecord, SessionTeamConfig } from "@/types";

import { safeRead, safeWrite } from "./local";
import { deleteMatchesBySessionId } from "./matches.repo";

const SESSIONS_KEY = "qpb_sessions";

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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

export function getSessionById(sessionId: string): SessionRecord | undefined {
  return getSessions().find((session) => session.id === sessionId);
}

export function createSession(payload: {
  date: string;
  pointToWin: number;
  memberIds: string[];
  mode?: SessionMode;
  courtCount?: number;
  teamConfig?: SessionTeamConfig;
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

export function updateSession(
  sessionId: string,
  payload: Partial<Omit<SessionRecord, "id" | "createdAt">>
): SessionRecord | undefined {
  const sessions = getSessions();

  let updatedSession: SessionRecord | undefined;

  const nextSessions = sessions.map((session) => {
    if (session.id !== sessionId) {
      return session;
    }

    updatedSession = normalizeSessionRecord({
      ...session,
      ...payload,
      id: session.id,
      createdAt: session.createdAt,
    });

    return updatedSession;
  });

  saveSessions(nextSessions);

  return updatedSession;
}

export function deleteSession(sessionId: string): void {
  saveSessions(getSessions().filter((session) => session.id !== sessionId));
  deleteMatchesBySessionId(sessionId);
}
