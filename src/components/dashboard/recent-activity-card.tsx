import Link from "next/link";
import {
  Clock3,
  Trophy,
} from "lucide-react";

import type {
  RecentMatchActivity,
} from "@/lib/statistics";

type Props = {
  activity: RecentMatchActivity;

  href?: string;
};

export default function RecentActivityCard({
  activity,
  href,
}: Props) {
  const content = (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 transition hover:border-brand-200 hover:bg-brand-50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">
            {activity.title}
          </div>

          <div className="mt-1 text-xs text-slate-500">
            {activity.description}
          </div>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <Trophy size={18} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="font-bold text-slate-900">
          {activity.scoreA} - {activity.scoreB}
        </div>

        <div className="flex items-center gap-1 text-slate-500">
          <Clock3 size={14} />

          Round {activity.round}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>
          Court {activity.court}
        </span>

        <span>
          {activity.mode === "team"
            ? "Team"
            : "Normal"}
        </span>
      </div>
    </div>
  );

  if (!href) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
}
