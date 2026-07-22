import type { GeneratedSchedule } from "@/types";

import { cloneSchedule } from "./schedule-transform";

export type OptimizeScheduleParams = {
  schedule: GeneratedSchedule;
};

export function optimizeSchedule({
  schedule,
}: OptimizeScheduleParams): GeneratedSchedule {
  return cloneSchedule(schedule);
}