export interface RepeatedPartnerItem {
  /**
   * Pair of member ids (always sorted)
   */
  memberIds: [string, string];

  /**
   * Number of times this pair appears
   */
  count: number;
}

export interface RepeatPartnerAnalysis {
  /**
   * Only duplicated pairs
   */
  repeatedPairs: RepeatedPartnerItem[];

  /**
   * Total unique teammate pairs
   */
  uniquePairs: number;

  /**
   * Number of duplicated pairs
   */
  duplicatedPairCount: number;

  /**
   * Maximum repeat count among all pairs
   */
  maxRepeat: number;

  /**
   * Simple quality score (0~100)
   */
  score: number;
}
