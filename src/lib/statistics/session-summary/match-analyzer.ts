import type {
  GeneratedSchedule,
  MatchRecord,
  SessionRecord,
} from "@/types";

/* =========================================================
   Public Types
========================================================= */

export type MatchOutcome = "W" | "L" | "D";

export interface MemberRawStats {
  memberId: string;
  matches: number;
  completedMatches: number;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
  playedRounds: number[];
  restedRounds: number[];
  partnerIds: string[];
  opponentIds: string[];
  resultSequence: MatchOutcome[];
}

export interface TeamRawStats {
  team: "A" | "B";
  matches: number;
  completedMatches: number;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
  resultSequence: MatchOutcome[];
}

export interface PairRawStats {
  key: string;
  memberIds: [string, string];
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
}

export interface OpponentPairRawStats {
  key: string;
  memberAId: string;
  memberBId: string;
  matches: number;
  memberAWins: number;
  memberBWins: number;
  draws: number;
  memberAPoints: number;
  memberBPoints: number;
}

export interface RoundRawStats {
  round: number;
  savedMatches: number;
  completedMatches: number;
  totalPoints: number;
  highestScore: number;
  closestPointDiff?: number;
}

export interface SessionRawStats {
  savedMatches: number;
  completedMatches: number;
  totalPoints: number;
  highestScore: number;
  biggestPointDiff: number;
  closestPointDiff?: number;
}

export interface CompletedMatchRawStats {
  round: number;

  court: number;

  teamAMemberIds: string[];

  teamBMemberIds: string[];

  scoreA: number;

  scoreB: number;

  pointDiff: number;

  totalPoints: number;
}

export interface MatchAnalysisResult {
  memberStats: Record<string, MemberRawStats>;

  teamStats: {
    A: TeamRawStats;

    B: TeamRawStats;
  };

  pairStats: Record<string, PairRawStats>;

  opponentStats: Record<string, OpponentPairRawStats>;

  roundStats: Record<number, RoundRawStats>;

  sessionStats: SessionRawStats;

  completedMatches: CompletedMatchRawStats[];
}

interface MemberAccumulator {
  memberId: string;
  matches: number;
  completedMatches: number;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
  playedRounds: Set<number>;
  restedRounds: Set<number>;
  partnerIds: Set<string>;
  opponentIds: Set<string>;
  resultSequence: MatchOutcome[];
}

export function analyzeMatches(params: {
  session: SessionRecord;
  schedule: GeneratedSchedule;
  savedMatches: MatchRecord[];
}): MatchAnalysisResult {
  const { session, schedule, savedMatches } = params;

  const memberAccumulators = createMemberAccumulators(
    session.memberIds
  );

  const teamStats = {
    A: createTeamRawStats("A"),
    B: createTeamRawStats("B"),
  };

  const pairStats: Record<string, PairRawStats> = {};

const opponentStats: Record<string, OpponentPairRawStats> = {};

const roundStats: Record<number, RoundRawStats> = {};

const completedMatches: CompletedMatchRawStats[] = [];

const sessionStats: SessionRawStats = {
    savedMatches: 0,
    completedMatches: 0,
    totalPoints: 0,
    highestScore: 0,
    biggestPointDiff: 0,
  };

  for (const match of savedMatches) {
    if (match.sessionId !== session.id) continue;

    ensureMembersExist(memberAccumulators, match.teamA.memberIds);
    ensureMembersExist(memberAccumulators, match.teamB.memberIds);

    updateSessionStatsBeforeResult(sessionStats);
    updateRoundStatsBeforeResult(roundStats, match.round);

    updateMembersBeforeResult(
      memberAccumulators,
      match.teamA.memberIds,
      match.teamB.memberIds,
      match.round
    );

    updateTeamBeforeResult(teamStats.A);
    updateTeamBeforeResult(teamStats.B);

    if (!isCompletedMatch(match)) continue;

completedMatches.push(createCompletedMatchRawStats(match));

const outcomeA = getOutcome(match.scoreA, match.scoreB);

const outcomeB = reverseOutcome(outcomeA);

updateSessionStatsAfterResult(
  sessionStats,
  match.scoreA,
  match.scoreB
);
    updateRoundStatsAfterResult(
      roundStats,
      match.round,
      match.scoreA,
      match.scoreB
    );

    updateMemberSideAfterResult({
      memberAccumulators,
      memberIds: match.teamA.memberIds,
      pointsFor: match.scoreA,
      pointsAgainst: match.scoreB,
      outcome: outcomeA,
    });

    updateMemberSideAfterResult({
      memberAccumulators,
      memberIds: match.teamB.memberIds,
      pointsFor: match.scoreB,
      pointsAgainst: match.scoreA,
      outcome: outcomeB,
    });

    updateTeamAfterResult(teamStats.A, match.scoreA, match.scoreB, outcomeA);
    updateTeamAfterResult(teamStats.B, match.scoreB, match.scoreA, outcomeB);

    updatePartnerPairs({
      pairStats,
      memberIds: match.teamA.memberIds,
      pointsFor: match.scoreA,
      pointsAgainst: match.scoreB,
      outcome: outcomeA,
    });

    updatePartnerPairs({
      pairStats,
      memberIds: match.teamB.memberIds,
      pointsFor: match.scoreB,
      pointsAgainst: match.scoreA,
      outcome: outcomeB,
    });

    updateOpponentPairs({
      opponentStats,
      teamAMemberIds: match.teamA.memberIds,
      teamBMemberIds: match.teamB.memberIds,
      scoreA: match.scoreA,
      scoreB: match.scoreB,
    });
  }

  applyScheduleParticipation(memberAccumulators, schedule);

  return {
  memberStats: finalizeMemberStats(memberAccumulators),

  teamStats,

  pairStats,

  opponentStats,

  roundStats,

  sessionStats,

  completedMatches,
};
}

function createMemberAccumulators(
  memberIds: string[]
): Record<string, MemberAccumulator> {
  const result: Record<string, MemberAccumulator> = {};
  for (const memberId of memberIds) {
    result[memberId] = createMemberAccumulator(memberId);
  }
  return result;
}

function createMemberAccumulator(memberId: string): MemberAccumulator {
  return {
    memberId,
    matches: 0,
    completedMatches: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    playedRounds: new Set<number>(),
    restedRounds: new Set<number>(),
    partnerIds: new Set<string>(),
    opponentIds: new Set<string>(),
    resultSequence: [],
  };
}

function ensureMembersExist(
  accumulators: Record<string, MemberAccumulator>,
  memberIds: string[]
): void {
  for (const memberId of memberIds) {
    if (!accumulators[memberId]) {
      accumulators[memberId] = createMemberAccumulator(memberId);
    }
  }
}

function updateMembersBeforeResult(
  accumulators: Record<string, MemberAccumulator>,
  teamAMemberIds: string[],
  teamBMemberIds: string[],
  round: number
): void {
  for (const memberId of teamAMemberIds) {
    const member = accumulators[memberId];
    member.matches += 1;
    member.playedRounds.add(round);
    addOtherMembers(member.partnerIds, teamAMemberIds, memberId);
    addMembers(member.opponentIds, teamBMemberIds);
  }

  for (const memberId of teamBMemberIds) {
    const member = accumulators[memberId];
    member.matches += 1;
    member.playedRounds.add(round);
    addOtherMembers(member.partnerIds, teamBMemberIds, memberId);
    addMembers(member.opponentIds, teamAMemberIds);
  }
}

function updateMemberSideAfterResult(params: {
  memberAccumulators: Record<string, MemberAccumulator>;
  memberIds: string[];
  pointsFor: number;
  pointsAgainst: number;
  outcome: MatchOutcome;
}): void {
  const {
    memberAccumulators,
    memberIds,
    pointsFor,
    pointsAgainst,
    outcome,
  } = params;

  for (const memberId of memberIds) {
    const member = memberAccumulators[memberId];
    member.completedMatches += 1;
    member.pointsFor += pointsFor;
    member.pointsAgainst += pointsAgainst;
    applyOutcome(member, outcome);
    member.resultSequence.push(outcome);
  }
}

function applyOutcome(
  stats: { wins: number; losses: number; draws: number },
  outcome: MatchOutcome
): void {
  if (outcome === "W") {
    stats.wins += 1;
    return;
  }
  if (outcome === "L") {
    stats.losses += 1;
    return;
  }
  stats.draws += 1;
}

function applyScheduleParticipation(
  accumulators: Record<string, MemberAccumulator>,
  schedule: GeneratedSchedule
): void {
  for (const round of schedule.rounds) {
    for (const memberId of round.restingMemberIds) {
      if (!accumulators[memberId]) {
        accumulators[memberId] = createMemberAccumulator(memberId);
      }
      accumulators[memberId].restedRounds.add(round.round);
    }

    for (const match of round.matches) {
      for (const memberId of match.teamAMemberIds) {
        if (!accumulators[memberId]) {
          accumulators[memberId] = createMemberAccumulator(memberId);
        }
        accumulators[memberId].playedRounds.add(round.round);
      }

      for (const memberId of match.teamBMemberIds) {
        if (!accumulators[memberId]) {
          accumulators[memberId] = createMemberAccumulator(memberId);
        }
        accumulators[memberId].playedRounds.add(round.round);
      }
    }
  }
}

function createTeamRawStats(team: "A" | "B"): TeamRawStats {
  return {
    team,
    matches: 0,
    completedMatches: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    resultSequence: [],
  };
}

function updateTeamBeforeResult(team: TeamRawStats): void {
  team.matches += 1;
}

function updateTeamAfterResult(
  team: TeamRawStats,
  pointsFor: number,
  pointsAgainst: number,
  outcome: MatchOutcome
): void {
  team.completedMatches += 1;
  team.pointsFor += pointsFor;
  team.pointsAgainst += pointsAgainst;
  applyOutcome(team, outcome);
  team.resultSequence.push(outcome);
}

function updatePartnerPairs(params: {
  pairStats: Record<string, PairRawStats>;
  memberIds: string[];
  pointsFor: number;
  pointsAgainst: number;
  outcome: MatchOutcome;
}): void {
  const { pairStats, memberIds, pointsFor, pointsAgainst, outcome } = params;

  for (let firstIndex = 0; firstIndex < memberIds.length; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < memberIds.length;
      secondIndex += 1
    ) {
      const memberIdsPair = normalizePair(
        memberIds[firstIndex],
        memberIds[secondIndex]
      );
      const key = createPairKey(memberIdsPair[0], memberIdsPair[1]);

      if (!pairStats[key]) {
        pairStats[key] = {
          key,
          memberIds: memberIdsPair,
          matches: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          pointsFor: 0,
          pointsAgainst: 0,
        };
      }

      const pair = pairStats[key];
      pair.matches += 1;
      pair.pointsFor += pointsFor;
      pair.pointsAgainst += pointsAgainst;
      applyOutcome(pair, outcome);
    }
  }
}

function updateOpponentPairs(params: {
  opponentStats: Record<string, OpponentPairRawStats>;
  teamAMemberIds: string[];
  teamBMemberIds: string[];
  scoreA: number;
  scoreB: number;
}): void {
  const {
    opponentStats,
    teamAMemberIds,
    teamBMemberIds,
    scoreA,
    scoreB,
  } = params;

  for (const teamAMemberId of teamAMemberIds) {
    for (const teamBMemberId of teamBMemberIds) {
      const normalizedPair = normalizePair(teamAMemberId, teamBMemberId);
      const key = createPairKey(normalizedPair[0], normalizedPair[1]);

      if (!opponentStats[key]) {
        opponentStats[key] = {
          key,
          memberAId: normalizedPair[0],
          memberBId: normalizedPair[1],
          matches: 0,
          memberAWins: 0,
          memberBWins: 0,
          draws: 0,
          memberAPoints: 0,
          memberBPoints: 0,
        };
      }

      const opponentPair = opponentStats[key];
      const firstMemberIsOriginalTeamA =
        opponentPair.memberAId === teamAMemberId;
      const memberAScore = firstMemberIsOriginalTeamA ? scoreA : scoreB;
      const memberBScore = firstMemberIsOriginalTeamA ? scoreB : scoreA;

      opponentPair.matches += 1;
      opponentPair.memberAPoints += memberAScore;
      opponentPair.memberBPoints += memberBScore;

      if (memberAScore > memberBScore) {
        opponentPair.memberAWins += 1;
      } else if (memberBScore > memberAScore) {
        opponentPair.memberBWins += 1;
      } else {
        opponentPair.draws += 1;
      }
    }
  }
}

function updateRoundStatsBeforeResult(
  roundStats: Record<number, RoundRawStats>,
  round: number
): void {
  if (!roundStats[round]) {
    roundStats[round] = {
      round,
      savedMatches: 0,
      completedMatches: 0,
      totalPoints: 0,
      highestScore: 0,
    };
  }
  roundStats[round].savedMatches += 1;
}

function updateRoundStatsAfterResult(
  roundStats: Record<number, RoundRawStats>,
  round: number,
  scoreA: number,
  scoreB: number
): void {
  const stats = roundStats[round];
  const totalPoints = scoreA + scoreB;
  const pointDiff = Math.abs(scoreA - scoreB);
  const highestScore = Math.max(scoreA, scoreB);

  stats.completedMatches += 1;
  stats.totalPoints += totalPoints;
  stats.highestScore = Math.max(stats.highestScore, highestScore);
  stats.closestPointDiff =
    stats.closestPointDiff === undefined
      ? pointDiff
      : Math.min(stats.closestPointDiff, pointDiff);
}

function updateSessionStatsBeforeResult(stats: SessionRawStats): void {
  stats.savedMatches += 1;
}

function updateSessionStatsAfterResult(
  stats: SessionRawStats,
  scoreA: number,
  scoreB: number
): void {
  const totalPoints = scoreA + scoreB;
  const pointDiff = Math.abs(scoreA - scoreB);
  const highestScore = Math.max(scoreA, scoreB);

  stats.completedMatches += 1;
  stats.totalPoints += totalPoints;
  stats.highestScore = Math.max(stats.highestScore, highestScore);
  stats.biggestPointDiff = Math.max(stats.biggestPointDiff, pointDiff);
  stats.closestPointDiff =
    stats.closestPointDiff === undefined
      ? pointDiff
      : Math.min(stats.closestPointDiff, pointDiff);
}

function finalizeMemberStats(
  accumulators: Record<string, MemberAccumulator>
): Record<string, MemberRawStats> {
  const result: Record<string, MemberRawStats> = {};

  for (const memberId of Object.keys(accumulators)) {
    const member = accumulators[memberId];
    result[memberId] = {
      memberId: member.memberId,
      matches: member.matches,
      completedMatches: member.completedMatches,
      wins: member.wins,
      losses: member.losses,
      draws: member.draws,
      pointsFor: member.pointsFor,
      pointsAgainst: member.pointsAgainst,
      playedRounds: toSortedNumberArray(member.playedRounds),
      restedRounds: toSortedNumberArray(member.restedRounds),
      partnerIds: toSortedStringArray(member.partnerIds),
      opponentIds: toSortedStringArray(member.opponentIds),
      resultSequence: [...member.resultSequence],
    };
  }

  return result;
}

function createCompletedMatchRawStats(
  match: MatchRecord
): CompletedMatchRawStats {
  return {
    round: match.round,

    court: match.court ?? 1,

    teamAMemberIds: [...match.teamA.memberIds],

    teamBMemberIds: [...match.teamB.memberIds],

    scoreA: match.scoreA,

    scoreB: match.scoreB,

    pointDiff: Math.abs(match.scoreA - match.scoreB),

    totalPoints: match.scoreA + match.scoreB,
  };
}
function getOutcome(
  pointsFor: number,
  pointsAgainst: number
): MatchOutcome {
  if (pointsFor > pointsAgainst) return "W";
  if (pointsFor < pointsAgainst) return "L";
  return "D";
}

function reverseOutcome(outcome: MatchOutcome): MatchOutcome {
  if (outcome === "W") return "L";
  if (outcome === "L") return "W";
  return "D";
}

function addOtherMembers(
  target: Set<string>,
  memberIds: string[],
  currentMemberId: string
): void {
  for (const memberId of memberIds) {
    if (memberId !== currentMemberId) target.add(memberId);
  }
}

function addMembers(target: Set<string>, memberIds: string[]): void {
  for (const memberId of memberIds) target.add(memberId);
}

function normalizePair(
  firstMemberId: string,
  secondMemberId: string
): [string, string] {
  return firstMemberId.localeCompare(secondMemberId) <= 0
    ? [firstMemberId, secondMemberId]
    : [secondMemberId, firstMemberId];
}

function createPairKey(
  firstMemberId: string,
  secondMemberId: string
): string {
  return `${firstMemberId}__${secondMemberId}`;
}

function toSortedNumberArray(values: Set<number>): number[] {
  return [...values].sort((first, second) => first - second);
}

function toSortedStringArray(values: Set<string>): string[] {
  return [...values].sort((first, second) => first.localeCompare(second));
}
