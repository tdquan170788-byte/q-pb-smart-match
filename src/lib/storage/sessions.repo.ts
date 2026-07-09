import type { SessionRecord } from "@/types/domain";
import { safeRead, safeWrite } from "./local";
import { createId } from "@/lib/shared/ids";

const SESSIONS_KEY = "qpb_sessions";

function normalizeSessionRecord(session: any): SessionRecord {
  const teamConfig = session?.teamConfig;

  return {
    id: session.id,
    date: session.date,
    pointToWin: Number(session.pointToWin ?? 11),
    participantIds: Array.isArray(session.participantIds) ? session.participantIds : [],
    createdAt: session.createdAt ?? new Date().toISOString(),
    mode: session.mode === "team" ? "team" : "normal",
    courtCount: Number(session.courtCount ?? 1),
    teamConfig: teamConfig
      ? {
          teamAMemberIds:
            teamConfig.teamAMemberIds ?? teamConfig.teamAPlayerIds ?? [],
          teamBMemberIds:
            teamConfig.teamBMemberIds ?? teamConfig.teamBPlayerIds ?? [],
        }
      : undefined,
  };
}

export const sessionsRepo = {
  getAll(): SessionRecord[] {
    const sessions = safeRead<SessionRecord[]>(SESSIONS_KEY, []);
    return sessions.map(normalizeSessionRecord);
  },

  saveAll(sessions: SessionRecord[]) {
    safeWrite(SESSIONS_KEY, sessions.map(normalizeSessionRecord));
  },

  create(payload: {
    date: string;
    pointToWin: number;
    participantIds: string[];
    mode?: "normal" | "team";
    courtCount?: number;
    teamConfig?: {
      teamAMemberIds: string[];
      teamBMemberIds: string[];
    };
  }): SessionRecord {
    const sessions = this.getAll();

    const newSession: SessionRecord = normalizeSessionRecord({
      id: createId("session"),
      date: payload.date,
      pointToWin: payload.pointToWin,
      participantIds: payload.participantIds,
      createdAt: new Date().toISOString(),
      mode: payload.mode ?? "normal",
      courtCount: payload.courtCount ?? 1,
      teamConfig: payload.teamConfig,
    });

    this.saveAll([newSession, ...sessions]);
    return newSession;
  },

  add(session: Omit<SessionRecord, "id">): SessionRecord {
    const sessions = this.getAll();
    const newSession = normalizeSessionRecord({
      ...session,
      id: createId("session"),
    });
    this.saveAll([newSession, ...sessions]);
    return newSession;
  },
};