import Link from "next/link";
import { Trophy } from "lucide-react";

import Avatar from "@/components/ui/avatar";

import type {
  HallOfFameEntry,
} from "@/lib/statistics";

type Props = {
  title: string;

  subtitle: string;

  href: string;

  leader: HallOfFameEntry | null;

  valueLabel: string;

  value: (entry: HallOfFameEntry) => string;
};

export default function HallOfFameCard({
  title,
  subtitle,
  href,
  leader,
  valueLabel,
  value,
}: Props) {
  return (
    <Link href={href}>
      <div className="rounded-3xl border border-slate-200 bg-white p-5 transition hover:border-brand-200 hover:bg-brand-50">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              {title}
            </div>

            <div className="mt-1 text-xs text-slate-500">
              {subtitle}
            </div>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Trophy size={20} />
          </div>
        </div>

        {leader ? (
          <>
            <div className="mt-5 flex items-center gap-3">
              <Avatar name={leader.memberName} />

              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-slate-900">
                  {leader.memberName}
                </div>

                <div className="truncate text-xs text-slate-500">
                  {leader.nickname?.trim()
                    ? leader.nickname
                    : "Không có biệt danh"}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">
                {valueLabel}
              </div>

              <div className="mt-1 text-2xl font-bold text-slate-900">
                {value(leader)}
              </div>
            </div>
          </>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            Chưa có dữ liệu
          </div>
        )}
      </div>
    </Link>
  );
}