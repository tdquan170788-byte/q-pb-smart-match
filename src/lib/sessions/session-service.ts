import type {
  SessionMode,
  SessionRecord,
  SessionTeamConfig,
} from "@/types";

import { buildSessionSchedule } from "@/lib/scheduler";
import { createSession } from "@/lib/storage";

export const CURRENT_SCHEDULER_VERSION =
  "smart-scheduler-2.3";

export type CreateFrozenSessionParams = {
  date: string;

  pointToWin: number;

  memberIds: string[];

  mode: SessionMode;

  courtCount: number;

  /**
   * Số round người dùng mong muốn.
   *
   * Nếu không truyền, Scheduler sẽ dùng
   * quy tắc mặc định.
   */
  targetRounds?: number;

  teamConfig?: SessionTeamConfig;
};

export function createFrozenSession(
  params: CreateFrozenSessionParams
): SessionRecord {
  const createdAt =
    new Date().toISOString();

  /**
   * Session tạm dùng để Scheduler sinh lịch.
   *
   * Sau khi lưu, Storage sẽ thay sessionId
   * trong scheduleSnapshot bằng id thật.
   */
  const temporarySession: SessionRecord = {
    id: "__temporary_session__",

    date: params.date,

    pointToWin:
      normalizePositiveInteger(
        params.pointToWin,
        11
      ),

    memberIds: uniqueStringValues(
      params.memberIds
    ),

    createdAt,

    mode: params.mode,

    courtCount:
      normalizePositiveInteger(
        params.courtCount,
        1
      ),

    targetRounds:
      normalizeOptionalPositiveInteger(
        params.targetRounds
      ),

    teamConfig:
      normalizeTeamConfig(
        params.teamConfig
      ),
  };

  const generatedSchedule =
    buildSessionSchedule(
      temporarySession
    );

  return createSession({
    date: temporarySession.date,

    pointToWin:
      temporarySession.pointToWin,

    memberIds:
      temporarySession.memberIds,

    mode:
      temporarySession.mode,

    courtCount:
      temporarySession.courtCount,

    targetRounds:
      temporarySession.targetRounds,

    teamConfig:
      temporarySession.teamConfig,

    scheduleSnapshot:
      generatedSchedule,

    schedulerVersion:
      CURRENT_SCHEDULER_VERSION,

    scheduleCreatedAt:
      createdAt,
  });
}

function normalizePositiveInteger(
  value: unknown,
  fallback: number
): number {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }

  return Math.max(
    1,
    Math.floor(parsedValue)
  );
}

function normalizeOptionalPositiveInteger(
  value: unknown
): number | undefined {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return undefined;
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return undefined;
  }

  return Math.max(
    1,
    Math.floor(parsedValue)
  );
}

function uniqueStringValues(
  values: string[]
): string[] {
  return [
    ...new Set(
      values.filter(
        (value) =>
          typeof value === "string" &&
          value.trim().length > 0
      )
    ),
  ];
}

function normalizeTeamConfig(
  teamConfig:
    | SessionTeamConfig
    | undefined
): SessionTeamConfig | undefined {
  if (!teamConfig) {
    return undefined;
  }

  return {
    teamAMemberIds:
      uniqueStringValues(
        teamConfig.teamAMemberIds
      ),

    teamBMemberIds:
      uniqueStringValues(
        teamConfig.teamBMemberIds
      ),
  };
}
