export type MemberScheduleStat = {
  memberId: string;

  matchCount: number;
  restCount: number;

  maxConsecutiveRestCount: number;
};

export type SchedulePairStat = {
  pairKey: string;

  firstMemberId: string;
  secondMemberId: string;

  count: number;
};

export type ScheduleQualityReport = {
  sessionId: string;

  totalRounds: number;
  totalMatches: number;

  memberStats: MemberScheduleStat[];

  teammatePairStats: SchedulePairStat[];
  opponentPairStats: SchedulePairStat[];

  matchCountDifference: number;
  restCountDifference: number;

  maxConsecutiveRestCount: number;
  maxTeammateRepeatCount: number;
  maxOpponentRepeatCount: number;

  qualityScore: number;
};
