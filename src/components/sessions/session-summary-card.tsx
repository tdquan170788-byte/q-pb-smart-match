"use client";

import Link from "next/link";
import type { SessionRecord } from "@/types";

type Props = {
  session: SessionRecord;
  matchCount: number;
  participantCount: number;
};

export default function SessionSummaryCard({
  session,
  matchCount,
  participantCount,
}: Props) {
  return (
    <Link
      href={`/sessions/${session.id}`}
      className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-slate-900">
            Session {new Date(session.date).toLocaleDateString("vi-VN")}
          </div>
          <div className="mt-1 text-sm text-slate-500">
            Mode: <span className="font-medium text-slate-700">{session.mode ?? "normal"}</span>
          </div>
        </div>

        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {matchCount} trận
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <div className="text-slate-500">Số người chơi</div>
          <div className="mt-1 font-semibold text-slate-900">{participantCount}</div>
        </div>

        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <div className="text-slate-500">Điểm thắng</div>
          <div className="mt-1 font-semibold text-slate-900">{session.pointToWin}</div>
        </div>

        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <div className="text-slate-500">Số sân</div>
          <div className="mt-1 font-semibold text-slate-900">{session.courtCount ?? 1}</div>
        </div>

        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <div className="text-slate-500">Ngày tạo</div>
          <div className="mt-1 font-semibold text-slate-900">
            {new Date(session.createdAt).toLocaleDateString("vi-VN")}
          </div>
        </div>
      </div>
    </Link>
  );
}