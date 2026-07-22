import { uniqueMemberIds } from "./helpers";

import type { SchedulerHistory } from "./cost";

export type PlanMemberPriorityOrderParams = {
  memberIds: string[];
  history: SchedulerHistory;
};

type MemberPriority = {
  memberId: string;
  originalIndex: number;
  playedMatchCount: number;
  restCount: number;
  consecutiveRestCount: number;
};

/**
 * Sắp xếp thành viên theo mức độ cần được ưu tiên thi đấu
 * trong round tiếp theo.
 *
 * Thứ tự ưu tiên:
 *
 * 1. Người đang nghỉ liên tiếp nhiều hơn.
 * 2. Người có tổng số lần nghỉ nhiều hơn.
 * 3. Người đã chơi ít trận hơn.
 * 4. Giữ nguyên thứ tự đầu vào nếu mọi chỉ số bằng nhau.
 *
 * Hàm hoàn toàn deterministic:
 * cùng memberIds và history luôn trả về cùng kết quả.
 */
export function planMemberPriorityOrder({
  memberIds,
  history,
}: PlanMemberPriorityOrderParams): string[] {
  const cleanMemberIds = uniqueMemberIds(memberIds);

  const priorities = cleanMemberIds.map(
    (memberId, originalIndex): MemberPriority => ({
      memberId,
      originalIndex,

      playedMatchCount:
        history.playedMatchCountByMemberId[memberId] ?? 0,

      restCount:
        history.restCountByMemberId[memberId] ?? 0,

      consecutiveRestCount:
        history.consecutiveRestCountByMemberId[memberId] ?? 0,
    })
  );

  priorities.sort(compareMemberPriorities);

  return priorities.map((priority) => priority.memberId);
}

function compareMemberPriorities(
  first: MemberPriority,
  second: MemberPriority
): number {
  const consecutiveRestDifference =
    second.consecutiveRestCount -
    first.consecutiveRestCount;

  if (consecutiveRestDifference !== 0) {
    return consecutiveRestDifference;
  }

  const restCountDifference =
    second.restCount - first.restCount;

  if (restCountDifference !== 0) {
    return restCountDifference;
  }

  const playedMatchCountDifference =
    first.playedMatchCount -
    second.playedMatchCount;

  if (playedMatchCountDifference !== 0) {
    return playedMatchCountDifference;
  }

  return first.originalIndex - second.originalIndex;
}