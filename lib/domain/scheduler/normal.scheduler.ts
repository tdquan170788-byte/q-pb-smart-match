import type { SessionRecord } from "@/types/domain";
import type { GeneratedRound, GeneratedSchedule } from "./scheduler.types";
import { buildRoundRobinPairs } from "./round-robin";
import { chunkArray } from "@/lib/shared/array";

export function generateNormalSchedule(session: SessionRecord): GeneratedSchedule {
  const participants = [...session.participantIds];
  const courtCount = session.courtCount ?? 1;

  if (participants.length < 4) {
    return {
      sessionId: session.id,
      totalRounds: 0,
      rounds: [],
    };
  }

  const rrRounds = buildRoundRobinPairs(participants);
  const rounds: GeneratedRound[] = [];

  rrRounds.forEach((pairs, roundIndex) => {
    const grouped = chunkArray(pairs, 2);

    const matches = [];
    const restingSet = new Set<string>();

    let court = 1;
    for (const group of grouped) {
      if (court > courtCount) {
        group.flat().forEach((id) => restingSet.add(id));
        continue;
      }

      if (group.length < 2) {
        group.flat().forEach((id) => restingSet.add(id));
        continue;
      }

      const [pair1, pair2] = group;

      matches.push({
        round: roundIndex + 1,
        court,
        teamA: [pair1[0], pair1[1]],
        teamB: [pair2[0], pair2[1]],
      });

      court += 1;
    }

    const playingIds = new Set(matches.flatMap((m) => [...m.teamA, ...m.teamB]));
    participants.forEach((id) => {
      if (!playingIds.has(id)) restingSet.add(id);
    });

    rounds.push({
      round: roundIndex + 1,
      matches,
      restingPlayerIds: [...restingSet],
    });
  });

  return {
    sessionId: session.id,
    totalRounds: rounds.length,
    rounds,
  };
}