import type { MatchRecord } from "@/types/domain";
import { safeRead, safeWrite } from "./local";
import { createId } from "@/lib/shared/ids";
import { sameIds } from "@/lib/shared/array";

const MATCHES_KEY = "qpb_matches";

function normalizeMatchRecord(match: any): MatchRecord {
  const teamA = match.teamA ?? {};
  const teamB = match.teamB ?? {};

  return {
    id: match.id,
    sessionId: match.sessionId,
    round: Number(match.round ?? 1),
    court: Number(match.court ?? 1),
    teamA: {
      memberIds: teamA.memberIds ?? teamA.playerIds ?? [],
    },
    teamB: {
      memberIds: teamB.memberIds ?? teamB.playerIds ?? [],
    },
    scoreA: Number(match.scoreA ?? 0),
    scoreB: Number(match.scoreB ?? 0),
    createdAt: match.createdAt ?? new Date().toISOString(),
  };
}

export const matchesRepo = {
  getAll(): MatchRecord[] {
    const matches = safeRead<MatchRecord[]>(MATCHES_KEY, []);
    return matches.map(normalizeMatchRecord);
  },

  saveAll(matches: MatchRecord[]) {
    safeWrite(MATCHES_KEY, matches.map(normalizeMatchRecord));
  },

  add(match: Omit<MatchRecord, "id">): MatchRecord {
    const matches = this.getAll();

    const newMatch: MatchRecord = normalizeMatchRecord({
      ...match,
      id: createId("match"),
    });

    this.saveAll([newMatch, ...matches]);
    return newMatch;
  },

  upsertByScheduleSlot(payload: {
    sessionId: string;
    round: number;
    court?: number;
    teamA: { memberIds: string[] };
    teamB: { memberIds: string[] };
    scoreA: number;
    scoreB: number;
  }): MatchRecord {
    const matches = this.getAll();

    const found = matches.find(
      (m) =>
        m.sessionId === payload.sessionId &&
        m.round === payload.round &&
        (m.court ?? 1) === (payload.court ?? 1) &&
        sameIds(m.teamA.memberIds, payload.teamA.memberIds) &&
        sameIds(m.teamB.memberIds, payload.teamB.memberIds)
    );

    if (found) {
      const updated: MatchRecord = {
        ...found,
        scoreA: payload.scoreA,
        scoreB: payload.scoreB,
        court: payload.court ?? found.court ?? 1,
      };

      this.saveAll(matches.map((m) => (m.id === found.id ? updated : m)));
      return updated;
    }

    const created: MatchRecord = {
      id: createId("match"),
      sessionId: payload.sessionId,
      round: payload.round,
      court: payload.court ?? 1,
      teamA: { memberIds: payload.teamA.memberIds },
      teamB: { memberIds: payload.teamB.memberIds },
      scoreA: payload.scoreA,
      scoreB: payload.scoreB,
      createdAt: new Date().toISOString(),
    };

    this.saveAll([created, ...matches]);
    return created;
  },
};