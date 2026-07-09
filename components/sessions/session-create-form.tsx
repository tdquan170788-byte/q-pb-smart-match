"use client";

import { useMemo, useState } from "react";
import type { Player, SessionMode } from "@/types";

type Props = {
  players: Player[];
  onSubmit: (payload: {
    date: string;
    pointToWin: number;
    participantIds: string[];
    mode: SessionMode;
    courtCount: number;
  }) => void;
};

export default function SessionCreateForm({ players, onSubmit }: Props) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [pointToWin, setPointToWin] = useState(11);
  const [mode, setMode] = useState<SessionMode>("normal");
  const [courtCount, setCourtCount] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => a.name.localeCompare(b.name, "vi")),
    [players]
  );

  function togglePlayer(playerId: string) {
    setSelectedIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!date) return;
    if (selectedIds.length < 2) return;

    onSubmit({
      date,
      pointToWin,
      participantIds: selectedIds,
      mode,
      courtCount,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Ngày chơi</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Điểm thắng</label>
          <input
            type="number"
            min={1}
            value={pointToWin}
            onChange={(e) => setPointToWin(Number(e.target.value))}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Mode</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as SessionMode)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
          >
            <option value="normal">Normal</option>
            <option value="team">Team</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Số sân</label>
          <input
            type="number"
            min={1}
            value={courtCount}
            onChange={(e) => setCourtCount(Number(e.target.value))}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <div className="mb-2 text-sm font-medium text-slate-700">Chọn người chơi</div>
        <div className="grid gap-3 md:grid-cols-2">
          {sortedPlayers.map((player) => {
            const checked = selectedIds.includes(player.id);

            return (
              <label
                key={player.id}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 ${
                  checked
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => togglePlayer(player.id)}
                />
                <div>
                  <div className="font-semibold text-slate-900">{player.name}</div>
                  <div className="text-sm text-slate-500">
                    {player.nickname?.trim()
                      ? `Biệt danh: ${player.nickname}`
                      : "Chưa có biệt danh"}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <button
        type="submit"
        className="rounded-2xl bg-brand-600 px-5 py-3 font-semibold text-white"
      >
        Tạo session
      </button>
    </form>
  );
}