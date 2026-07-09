"use client";

import { useState } from "react";

type Props = {
  initialScoreA?: number;
  initialScoreB?: number;
  onSave: (scoreA: number, scoreB: number) => void;
};

export default function SessionResultForm({
  initialScoreA = 0,
  initialScoreB = 0,
  onSave,
}: Props) {
  const [scoreA, setScoreA] = useState(String(initialScoreA));
  const [scoreB, setScoreB] = useState(String(initialScoreB));

  function handleSave() {
    const a = Number(scoreA);
    const b = Number(scoreB);

    if (Number.isNaN(a) || Number.isNaN(b)) return;
    if (a < 0 || b < 0) return;

    onSave(a, b);
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <input
        type="number"
        min={0}
        value={scoreA}
        onChange={(e) => setScoreA(e.target.value)}
        className="w-20 rounded-xl border border-slate-200 px-3 py-2 text-center outline-none focus:border-blue-500"
      />
      <span className="text-slate-500">-</span>
      <input
        type="number"
        min={0}
        value={scoreB}
        onChange={(e) => setScoreB(e.target.value)}
        className="w-20 rounded-xl border border-slate-200 px-3 py-2 text-center outline-none focus:border-blue-500"
      />

      <button
        type="button"
        onClick={handleSave}
        className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white"
      >
        Lưu tỉ số
      </button>
    </div>
  );
}