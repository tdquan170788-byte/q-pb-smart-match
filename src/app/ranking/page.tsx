"use client";

import { useEffect, useMemo, useState } from "react";

import PageHeader from "@/components/page-header";
import {
  ensureSeedData,
  getMatches,
  getMembers,
  getSessions,
  saveMembers,
} from "@/lib/storage";
import { rebuildRankingData } from "@/lib/ranking";
import type { LastResult, RankingMode, RankingRow } from "@/types";

function last5Badge(result: LastResult, index: number) {
  return (
    <span
      key={`${result}-${index}`}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
        result === "W"
          ? "bg-emerald-100 text-emerald-700"
          : result === "L"
          ? "bg-rose-100 text-rose-700"
          : "bg-slate-100 text-slate-700"
      }`}
    >
      {result}
    </span>
  );
}

function getDisplayName(row: RankingRow): string {
  if (row.nickname?.trim()) {
    return `${row.memberName} (${row.nickname})`;
  }

  return row.memberName;
}

export default function RankingPage() {
  const [mode, setMode] = useState<RankingMode>("normal");
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [normalRows, setNormalRows] = useState<RankingRow[]>([]);
  const [teamRows, setTeamRows] = useState<RankingRow[]>([]);

  useEffect(() => {
    ensureSeedData();

    const members = getMembers();
    const sessions = getSessions();
    const matches = getMatches();

    const result = rebuildRankingData({
      members,
      sessions,
      matches,
    });

    saveMembers(result.members);

    setNormalRows(result.normalRows);
    setTeamRows(result.teamRows);
  }, []);

  useEffect(() => {
    setRows(mode === "normal" ? normalRows : teamRows);
  }, [mode, normalRows, teamRows]);

  const totalMatches = useMemo(
    () => rows.reduce((sum, row) => sum + row.matches, 0),
    [rows]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bảng xếp hạng"
        description="Ranking Pro với 2 bảng riêng: Normal và Team. Điểm số tính theo Elo + thống kê thắng thua + hiệu số."
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setMode("normal")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              mode === "normal"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            BXH Normal
          </button>

          <button
            type="button"
            onClick={() => setMode("team")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              mode === "team"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            BXH Team
          </button>

          <div className="ml-auto text-sm text-slate-500">
            Tổng số lượt trận trong bảng này:{" "}
            <span className="font-semibold text-slate-900">{totalMatches}</span>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1150px] w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">#</th>
                <th className="px-4 py-3 text-left font-semibold">Người chơi</th>
                <th className="px-4 py-3 text-right font-semibold">Rating</th>
                <th className="px-4 py-3 text-right font-semibold">W</th>
                <th className="px-4 py-3 text-right font-semibold">L</th>
                <th className="px-4 py-3 text-right font-semibold">D</th>
                <th className="px-4 py-3 text-right font-semibold">Matches</th>
                <th className="px-4 py-3 text-right font-semibold">Win rate</th>
                <th className="px-4 py-3 text-right font-semibold">PF</th>
                <th className="px-4 py-3 text-right font-semibold">PA</th>
                <th className="px-4 py-3 text-right font-semibold">Diff</th>
                <th className="px-4 py-3 text-left font-semibold">Last 5</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={12}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    Chưa có dữ liệu xếp hạng cho chế độ này.
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr
                    key={row.memberId}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {index + 1}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">
                        {getDisplayName(row)}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {row.rating.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-700">
                      {row.wins}
                    </td>
                    <td className="px-4 py-3 text-right text-rose-700">
                      {row.losses}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {row.draws}
                    </td>
                    <td className="px-4 py-3 text-right">{row.matches}</td>
                    <td className="px-4 py-3 text-right">{row.winRate}%</td>
                    <td className="px-4 py-3 text-right">{row.pointsFor}</td>
                    <td className="px-4 py-3 text-right">{row.pointsAgainst}</td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        row.pointDiff > 0
                          ? "text-emerald-700"
                          : row.pointDiff < 0
                          ? "text-rose-700"
                          : "text-slate-700"
                      }`}
                    >
                      {row.pointDiff > 0 ? `+${row.pointDiff}` : row.pointDiff}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {row.last5.length > 0 ? (
                          row.last5.map((result, index) =>
                            last5Badge(result, index)
                          )
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
        <div className="font-semibold text-slate-900">Quy tắc xếp hạng</div>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Ưu tiên theo rating Elo giảm dần.</li>
          <li>Nếu bằng rating, so tiếp win rate → point diff → số trận thắng.</li>
          <li>
            BXH Normal chỉ lấy session mode <strong>normal</strong>; BXH Team
            chỉ lấy session mode <strong>team</strong>.
          </li>
        </ul>
      </div>
    </div>
  );
}
