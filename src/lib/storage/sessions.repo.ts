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

function normalizeScheduledMatch(
  match: Partial<ScheduledMatch>,
  fallbackRound: number,
  fallbackCourt: number
): ScheduledMatch {
  return {
    round: Number(match.round ?? fallbackRound),
    court: Number(match.court ?? fallbackCourt),

    teamAMemberIds: Array.isArray(match.teamAMemberIds)
      ? [...match.teamAMemberIds]
      : [],

    teamBMemberIds: Array.isArray(match.teamBMemberIds)
      ? [...match.teamBMemberIds]
      : [],
  };
}

function normalizeGeneratedRound(
  round: Partial<GeneratedRound>,
  fallbackRound: number
): GeneratedRound {
  const roundNumber = Number(
    round.round ?? fallbackRound
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

    restingMemberIds: Array.isArray(
      round.restingMemberIds
    )
      ? [...round.restingMemberIds]
      : [],
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

    totalRounds: Number(
      schedule.totalRounds ??
        rounds.length
    ),

    rounds,
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
      new Date()
        .toISOString()
        .slice(0, 10),

    pointToWin: Number(
      session.pointToWin ?? 11
    ),

    memberIds: Array.isArray(
      session.memberIds
    )
      ? [...session.memberIds]
      : [],

    createdAt:
      session.createdAt ??
      new Date().toISOString(),

    mode: session.mode ?? "normal",

    courtCount: Math.max(
      1,
      Math.floor(
        Number(
          session.courtCount ?? 1
        )
      )
    ),

    targetRounds:
      normalizeOptionalPositiveInteger(
        session.targetRounds
      ),

    teamConfig: session.teamConfig
      ? {
          teamAMemberIds: Array.isArray(
            session.teamConfig
              .teamAMemberIds
          )
            ? [
                ...session.teamConfig
                  .teamAMemberIds,
              ]
            : [],

          teamBMemberIds: Array.isArray(
            session.teamConfig
              .teamBMemberIds
          )
            ? [
                ...session.teamConfig
                  .teamBMemberIds,
              ]
            : [],
        }
      : undefined,

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

export function getSessions(): SessionRecord[] {
  const sessions =
    safeRead<SessionRecord[]>(
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

export function getSessionById(
  sessionId: string
): SessionRecord | undefined {
  return getSessions().find(
    (session) =>
      session.id === sessionId
  );
}

export function createSession(
  payload: {
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
  }
): SessionRecord {
  const sessions = getSessions();

  const sessionId =
    createId("session");

  const newSession =
    normalizeSessionRecord({
      id: sessionId,

      date: payload.date,

      pointToWin:
        payload.pointToWin,

      memberIds:
        payload.memberIds,

      createdAt:
        new Date().toISOString(),

      mode:
        payload.mode ?? "normal",

      courtCount:
        payload.courtCount ?? 1,

      targetRounds:
        payload.targetRounds,

      teamConfig:
        payload.teamConfig,

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
  session: Omit<
    SessionRecord,
    "id"
  >
): SessionRecord {
  const sessions = getSessions();

  const sessionId =
    createId("session");

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

export function updateSession(
  sessionId: string,

  payload: Partial<
    Omit<
      SessionRecord,
      "id" | "createdAt"
    >
  >
): SessionRecord | undefined {
  const sessions = getSessions();

  let updatedSession:
    | SessionRecord
    | undefined;

  const nextSessions =
    sessions.map((session) => {
      if (
        session.id !== sessionId
      ) {
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
                  sessionId:
                    session.id,
                }
              : session.scheduleSnapshot,
        });

      return updatedSession;
    });

  saveSessions(nextSessions);

  return updatedSession;
}

export function deleteSession(
  sessionId: string
): void {
  saveSessions(
    getSessions().filter(
      (session) =>
        session.id !== sessionId
    )
  );

  deleteMatchesBySessionId(
    sessionId
  );
}
