import type {
  GeneratedRound,
  GeneratedSchedule,
  ScheduledMatch,
  SessionRecord,
} from "@/types";

type Pairing = [string, string];

function rotateArray<T>(arr: T[], step = 1): T[] {
  if (arr.length <= 1) return [...arr];
  const n = arr.length;
  const s = ((step % n) + n) % n;
  if (s === 0) return [...arr];
  return [...arr.slice(s), ...arr.slice(0, s)];
}

function makePair(a: string, b: string): Pairing {
  return [a, b];
}

function normalizeCourtCount(value?: number) {
  if (!value || value < 1) return 1;
  return Math.floor(value);
}

function createMatch(
  round: number,
  court: number,
  teamA: string[],
  teamB: string[]
): ScheduledMatch {
  return {
    round,
    court,
    teamA,
    teamB,
  };
}

/* =========================================================
   TEAM MODE
   - Session đã chia sẵn 2 team cố định
   - Mỗi round sẽ ghép cặp nội bộ trong từng team
========================================================= */

function buildTeamModeSchedule(session: SessionRecord): GeneratedSchedule {
  const teamAPlayers = session.teamConfig?.teamAPlayerIds ?? [];
  const teamBPlayers = session.teamConfig?.teamBPlayerIds ?? [];

  if (teamAPlayers.length < 2 || teamBPlayers.length < 2) {
    return {
      totalRounds: 0,
      rounds: [],
    };
  }

  // Hiện tại team mode ưu tiên 1 sân / 1 trận mỗi round:
  // TeamA pair vs TeamB pair
  const roundsCount = Math.max(teamAPlayers.length, teamBPlayers.length);
  const rounds: GeneratedRound[] = [];

  for (let i = 0; i < roundsCount; i++) {
    const rotatedA = rotateArray(teamAPlayers, i);
    const rotatedB = rotateArray(teamBPlayers, i);

    const pairA = makePair(
      rotatedA[0],
      rotatedA[1 % rotatedA.length]
    );

    const pairB = makePair(
      rotatedB[0],
      rotatedB[1 % rotatedB.length]
    );

    rounds.push({
      round: i + 1,
      matches: [createMatch(i + 1, 1, pairA, pairB)],
      restingPlayerIds: [
        ...rotatedA.slice(2),
        ...rotatedB.slice(2),
      ],
    });
  }

  return {
    totalRounds: rounds.length,
    rounds,
  };
}

/* =========================================================
   NORMAL MODE
   - Xếp lịch doubles luân phiên
   - Nếu số người lẻ sẽ có người nghỉ
   - courtCount quyết định số trận tối đa / round
========================================================= */

function buildNormalModeSchedule(session: SessionRecord): GeneratedSchedule {
  const players = [...session.participantIds];
  const courtCount = normalizeCourtCount(session.courtCount);

  if (players.length < 4) {
    return {
      totalRounds: 0,
      rounds: [],
    };
  }

  // Nếu lẻ người -> thêm BYE
  const hasBye = players.length % 2 === 1;
  const allPlayers = hasBye ? [...players, "__BYE__"] : [...players];

  const n = allPlayers.length;
  const totalPairRounds = n - 1;

  let rotating = [...allPlayers];
  const rounds: GeneratedRound[] = [];

  for (let roundIndex = 0; roundIndex < totalPairRounds; roundIndex++) {
    const pairings: Pairing[] = [];
    const restingPlayerIds: string[] = [];

    for (let i = 0; i < n / 2; i++) {
      const p1 = rotating[i];
      const p2 = rotating[n - 1 - i];

      if (p1 === "__BYE__" && p2 !== "__BYE__") {
        restingPlayerIds.push(p2);
        continue;
      }

      if (p2 === "__BYE__" && p1 !== "__BYE__") {
        restingPlayerIds.push(p1);
        continue;
      }

      if (p1 !== "__BYE__" && p2 !== "__BYE__") {
        pairings.push(makePair(p1, p2));
      }
    }

    // ghép 2 pairings thành 1 trận doubles
    const matches: ScheduledMatch[] = [];
    const usablePairings = [...pairings];

    const maxMatches = Math.min(
      Math.floor(usablePairings.length / 2),
      courtCount
    );

    for (let m = 0; m < maxMatches; m++) {
      const pairA = usablePairings.shift();
      const pairB = usablePairings.shift();

      if (!pairA || !pairB) break;

      matches.push(
        createMatch(roundIndex + 1, m + 1, [...pairA], [...pairB])
      );
    }

    // pairings dư ra thì nghỉ round đó
    for (const remain of usablePairings) {
      restingPlayerIds.push(...remain);
    }

    rounds.push({
      round: roundIndex + 1,
      matches,
      restingPlayerIds,
    });

    // round-robin rotation (cố định phần tử đầu)
    const fixed = rotating[0];
    const rest = rotating.slice(1);
    rest.unshift(rest.pop() as string);
    rotating = [fixed, ...rest];
  }

  return {
    totalRounds: rounds.length,
    rounds,
  };
}

/* =========================================================
   PUBLIC API
========================================================= */

export function buildSessionSchedule(session: SessionRecord): GeneratedSchedule {
  if ((session.mode ?? "normal") === "team") {
    return buildTeamModeSchedule(session);
  }

  return buildNormalModeSchedule(session);
}