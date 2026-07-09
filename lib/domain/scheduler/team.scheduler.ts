import type { SessionRecord } from "@/types/domain";
import type { GeneratedSchedule } from "./scheduler.types";

export function generateTeamSchedule(session: SessionRecord): GeneratedSchedule {
  const courtCount = session.courtCount ?? 1;
  const teamA = session.teamConfig?.teamAMemberIds ?? [];
  const teamB = session.teamConfig?.teamBMemberIds ?? [];

  if (teamA.length === 0 || teamB.length === 0) {
    return {
      sessionId: session.id,
      totalRounds: 0,
      rounds: [],
    };
  }

  const totalRounds = 5;

  const rounds = Array.from({ length: totalRounds }).map((_, idx) => {
    const matches = [];

    for (let court = 1; court <= courtCount; court += 1) {
      matches.push({
        round: idx + 1,
        court,
        teamA: [...teamA],
        teamB: [...teamB],
      });
    }

    return {
      round: idx + 1,
      matches,
      restingPlayerIds: [],
    };
  });

  return {
    sessionId: session.id,
    totalRounds,
    rounds,
  };
}