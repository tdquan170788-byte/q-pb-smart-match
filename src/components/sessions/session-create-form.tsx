"use client";

import { useMemo, useState } from "react";

import type { Member, SessionMode } from "@/types";

type Props = {
  members: Member[];
  onSubmit: (payload: {
    date: string;
    pointToWin: number;
    memberIds: string[];
    mode: SessionMode;
    courtCount: number;
  }) => void;
};

export default function SessionCreateForm({ members, onSubmit }: Props) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [pointToWin, setPointToWin] = useState(11);
  const [mode, setMode] = useState<SessionMode>("normal");
  const [courtCount, setCourtCount] = useState(1);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const sortedMembers = useMemo(
    () => [...members].sort((a, b) => a.name.localeCompare(b.name, "vi")),
    [members]
  );

  function toggleMember(memberId: string) {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!date) return;
    if (selectedMemberIds.length < 2) return;

    onSubmit({
      date,
      pointToWin,
      memberIds: selectedMemberIds,
      mode,
      courtCount,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Ngày chơi
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Điểm thắng
          </label>
          <input
            type="number"
            min={1}
            value={pointToWin}
            onChange={(e) => setPointToWin(Number(e.target.value) || 11)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Mode
          </label>
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
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Số sân
          </label>
          <input
            type="number"
            min={1}
            value={courtCount}
            onChange={(e) => setCourtCount(Number(e.target.value) || 1)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <div className="mb-2 text-sm font-medium text-slate-700">
          Chọn thành viên
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {sortedMembers.map((member) => {
            const checked = selectedMemberIds.includes(member.id);

            return (
              <label
                key={member.id}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 ${
                  checked
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleMember(member.id)}
                />

                <div>
                  <div className="font-semibold text-slate-900">
                    {member.name}
                  </div>
                  <div className="text-sm text-slate-500">
                    {member.nickname?.trim()
                      ? `Biệt danh: ${member.nickname}`
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
