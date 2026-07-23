import type {
  GeneratedSchedule,
  SessionRecord,
} from "@/types";

import { buildSessionSchedule } from "@/lib/scheduler";
import { createSession } from "@/lib/storage";

const CURRENT_SCHEDULER_VERSION =
  "smart-scheduler-2.2";

type CreateFrozenSessionParams = {
  date: string;

  pointToWin: number;

  memberIds: string[];

  mode: "normal" | "team";

  courtCount: number;
  
  roundPlanning?: SessionRecord["roundPlanning"];
  
  /**
   * Số round mong muốn.
   * Nếu không truyền Scheduler sẽ tự quyết định.
   */
  targetRounds?: number;

  teamConfig?: SessionRecord["teamConfig"];
};
export function createFrozenSession(
  params: CreateFrozenSessionParams
): SessionRecord {
  /**
   * Session tạm để scheduler sinh lịch.
   * id sẽ được thay bằng id thật sau khi lưu.
   */
  const temporarySession: SessionRecord = {
    id: "__temporary__",

    date: params.date,

    pointToWin: params.pointToWin,

    memberIds: [...params.memberIds],

    createdAt: new Date().toISOString(),

    mode: params.mode,

    courtCount: params.courtCount,

    roundPlanning: params.roundPlanning,

    targetRounds: params.targetRounds,

    teamConfig: params.teamConfig,
  };

  const generatedSchedule =
    buildSessionSchedule(
      temporarySession
    );

  /**
   * createSession sẽ sinh id thật.
   * Sau đó storage sẽ tự thay sessionId
   * bên trong snapshot.
   */

  return createSession({
    date: params.date,

    pointToWin: params.pointToWin,

    memberIds: params.memberIds,

    mode: params.mode,

   courtCount: params.courtCount,

  roundPlanning: params.roundPlanning,
    
    targetRounds: params.targetRounds,

    teamConfig: params.teamConfig,

    scheduleSnapshot: generatedSchedule,

    schedulerVersion:
      CURRENT_SCHEDULER_VERSION,

    scheduleCreatedAt:
      new Date().toISOString(),
  });
}
