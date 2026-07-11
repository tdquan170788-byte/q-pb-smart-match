import type {
  GeneratedRound,
  GeneratedSchedule,
  ScheduledMatch,
  SessionMode,
  SessionRecord,
  SessionTeamConfig,
} from "@/types";

import { safeRead, safeWrite } from "./local";
import { deleteMatchesBySessionId } from "./matches.repo";

const SESSIONS_KEY = "qpb_sessions";

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function normalizePositiveInteger(
  value: unknown,
  fallback: number
): number {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }

  return Math.max(1, Math.floor(parsedValue));
}

function normalizeOptionalPositiveInteger(
  value: unknown
): number | undefined {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return undefined;
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return undefined;
  }

  return Math.max(1, Math.floor(parsedValue));
}

function normalizeStringArray(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string" &&
      item.trim().length > 0
  );
}

function normalizeScheduledMatch(
  match: Partial<ScheduledMatch>,
  fallbackRound: number,
  fallbackCourt: number
): ScheduledMatch {
  return {
    round: normalizePositiveInteger(
      match.round,
      fallbackRound
    ),

    court: normalizePositiveInteger(
      match.court,
      fallbackCourt
    ),

    teamAMemberIds: normalizeStringArray(
      match.teamAMemberIds
    ),

    teamBMemberIds: normalizeStringArray(
      match.teamBMemberIds
    ),
  };
}

function normalizeGeneratedRound(
  round: Partial<GeneratedRound>,
  fallbackRound: number
): GeneratedRound {
  const roundNumber = normalizePositiveInteger(
    round.round,
    fallbackRound
  );

  const matches = Array.isArray(round.matches)
    ? round.matches.map((match, index) =>
        normalizeScheduledMatch(
          match,
          roundNumber,
          index + 1
        )
      )
    : [];

  return {
    round: roundNumber,
    matches,
    restingMemberIds: normalizeStringArray(
      round.restingMemberIds
    ),
  };
}

function normalizeScheduleSnapshot(
  schedule: Partial<GeneratedSchedule> | undefined,
  sessionId: string
): GeneratedSchedule | undefined {
  if (
    !schedule ||
    !Array.isArray(schedule.rounds)
  ) {
    return undefined;
  }

  const rounds = schedule.rounds.map(
    (round, index) =>
      normalizeGeneratedRound(
        round,
        index + 1
      )
  );

  return {
    sessionId,

    totalRounds: normalizePositiveInteger(
      schedule.totalRounds,
      rounds.length > 0 ? rounds.length : 1
    ),

    rounds,
  };
}

function normalizeTeamConfig(
  teamConfig:
    | Partial<SessionTeamConfig>
    | undefined
): SessionTeamConfig | undefined {
  if (!teamConfig) {
    return undefined;
  }

  return {
    teamAMemberIds: normalizeStringArray(
      teamConfig.teamAMemberIds
    ),

    teamBMemberIds: normalizeStringArray(
      teamConfig.teamBMemberIds
    ),
  };
}

function normalizeSessionRecord(
  session: Partial<SessionRecord>
): SessionRecord {
  const sessionId =
    session.id ?? createId("session");

  return {
    id: sessionId,

    date:
      session.date ??
      new Date().toISOString().slice(0, 10),

    pointToWin: normalizePositiveInteger(
      session.pointToWin,
      11
    ),

    memberIds: normalizeStringArray(
      session.memberIds
    ),

    createdAt:
      session.createdAt ??
      new Date().toISOString(),

    mode: session.mode ?? "normal",

    courtCount: normalizePositiveInteger(
      session.courtCount,
      1
    ),

    targetRounds:
      normalizeOptionalPositiveInteger(
        session.targetRounds
      ),

    teamConfig: normalizeTeamConfig(
      session.teamConfig
    ),

    scheduleSnapshot:
      normalizeScheduleSnapshot(
        session.scheduleSnapshot,
        sessionId
      ),

    schedulerVersion:
      session.schedulerVersion,

    scheduleCreatedAt:
      session.scheduleCreatedAt,
  };
}

/* =========================================================
   READ
========================================================= */

export function getSessions(): SessionRecord[] {
  const sessions = safeRead<SessionRecord[]>(
    SESSIONS_KEY,
    []
  );

  if (!Array.isArray(sessions)) {
    return [];
  }

  return sessions.map((session) =>
    normalizeSessionRecord(session)
  );
}

export function getSessionById(
  sessionId: string
): SessionRecord | undefined {
  return getSessions().find(
    (session) => session.id === sessionId
  );
}

/* =========================================================
   WRITE
========================================================= */

export function saveSessions(
  sessions: SessionRecord[]
): void {
  safeWrite(
    SESSIONS_KEY,
    sessions.map((session) =>
      normalizeSessionRecord(session)
    )
  );
}

/* =========================================================
   CREATE
========================================================= */

export function createSession(payload: {
  date: string;
  pointToWin: number;
  memberIds: string[];

  mode?: SessionMode;
  courtCount?: number;
  targetRounds?: number;

  teamConfig?: SessionTeamConfig;

  scheduleSnapshot?: GeneratedSchedule;
  schedulerVersion?: string;
  scheduleCreatedAt?: string;
}): SessionRecord {
  const sessions = getSessions();
  const sessionId = createId("session");

  const newSession = normalizeSessionRecord({
    id: sessionId,

    date: payload.date,

    pointToWin: payload.pointToWin,

    memberIds: payload.memberIds,

    createdAt: new Date().toISOString(),

    mode: payload.mode ?? "normal",

    courtCount: payload.courtCount ?? 1,

    targetRounds: payload.targetRounds,

    teamConfig: payload.teamConfig,

    scheduleSnapshot:
      payload.scheduleSnapshot
        ? {
            ...payload.scheduleSnapshot,
            sessionId,
          }
        : undefined,

    schedulerVersion:
      payload.schedulerVersion,

    scheduleCreatedAt:
      payload.scheduleCreatedAt,
  });

  saveSessions([
    newSession,
    ...sessions,
  ]);

  return newSession;
}

export function addSession(
  session: Omit<SessionRecord, "id">
): SessionRecord {
  const sessions = getSessions();
  const sessionId = createId("session");

  const newSession =
    normalizeSessionRecord({
      ...session,

      id: sessionId,

      scheduleSnapshot:
        session.scheduleSnapshot
          ? {
              ...session.scheduleSnapshot,
              sessionId,
            }
          : undefined,
    });

  saveSessions([
    newSession,
    ...sessions,
  ]);

  return newSession;
}

/* =========================================================
   UPDATE
========================================================= */

export function updateSession(
  sessionId: string,
  payload: Partial<
    Omit<SessionRecord, "id" | "createdAt">
  >
): SessionRecord | undefined {
  const sessions = getSessions();

  let updatedSession:
    | SessionRecord
    | undefined;

  const nextSessions = sessions.map(
    (session) => {
      if (session.id !== sessionId) {
        return session;
      }

      updatedSession =
        normalizeSessionRecord({
          ...session,
          ...payload,

          id: session.id,

          createdAt:
            session.createdAt,

          scheduleSnapshot:
            payload.scheduleSnapshot
              ? {
                  ...payload.scheduleSnapshot,
                  sessionId: session.id,
                }
              : session.scheduleSnapshot,
        });

      return updatedSession;
    }
  );

  saveSessions(nextSessions);

  return updatedSession;
}

/* =========================================================
   DELETE
========================================================= */

export function deleteSession(
  sessionId: string
): void {
  saveSessions(
    getSessions().filter(
      (session) =>
        session.id !== sessionId
    )
  );

  deleteMatchesBySessionId(sessionId);
}
