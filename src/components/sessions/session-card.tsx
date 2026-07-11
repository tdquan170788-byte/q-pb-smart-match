import Link from "next/link";
import { CalendarDays, ChevronRight, Users } from "lucide-react";

import type { SessionMode } from "@/types";

import Badge from "@/components/ui/badge";
import Card from "@/components/ui/card";
import Progress from "@/components/ui/progress";

type Props = {
  id: string;
  date: string;
  mode: SessionMode;
  memberCount: number;
  completedMatches: number;
  totalMatches: number;
};

function formatSessionDate(date: string): string {
  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("vi-VN");
}

export default function SessionCard({
  id,
  date,
  mode,
  memberCount,
  completedMatches,
  totalMatches,
}: Props) {
  const safeCompletedMatches = Math.max(
    0,
    Math.min(completedMatches, totalMatches)
  );

  const isCompleted =
    totalMatches > 0 && safeCompletedMatches >= totalMatches;

  const hasStarted = safeCompletedMatches > 0;

  const statusLabel = isCompleted
    ? "Hoàn thành"
    : hasStarted
    ? "Đang diễn ra"
    : "Chưa bắt đầu";

  const statusVariant = isCompleted
    ? "success"
    : hasStarted
    ? "warning"
    : "info";

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
            <CalendarDays size={20} />
          </div>

          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Session
            </div>

            <div className="mt-1 truncate text-lg font-bold text-slate-900">
              {formatSessionDate(date)}
            </div>
          </div>
        </div>

        <Badge variant={mode === "team" ? "success" : "info"}>
          {mode === "team" ? "TEAM" : "NORMAL"}
        </Badge>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
          <span className="font-medium text-slate-700">Tiến độ</span>

          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </div>

        <Progress
          value={safeCompletedMatches}
          max={Math.max(totalMatches, 1)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Users size={14} />
            Thành viên
          </div>

          <div className="mt-2 text-lg font-bold text-slate-900">
            {memberCount}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Kết quả đã nhập</div>

          <div className="mt-2 text-lg font-bold text-slate-900">
            {safeCompletedMatches}/{totalMatches}
          </div>
        </div>
      </div>

      <Link
        href={`/sessions/${id}`}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white transition hover:opacity-90"
      >
        {isCompleted
          ? "Xem chi tiết"
          : hasStarted
          ? "Tiếp tục"
          : "Bắt đầu session"}

        <ChevronRight size={18} />
      </Link>
    </Card>
  );
}
