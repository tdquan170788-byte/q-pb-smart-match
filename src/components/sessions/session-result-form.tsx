"use client";

import {
  useEffect,
  useState,
} from "react";

type Props = {
  initialScoreA?: number;
  initialScoreB?: number;

  /**
   * Gọi khi người dùng thay đổi tỷ số.
   *
   * null nghĩa là ô nhập đang trống
   * hoặc giá trị chưa hợp lệ.
   */
  onScoreChange?: (
    scoreA: number | null,
    scoreB: number | null
  ) => void;

  onSave: (
    scoreA: number,
    scoreB: number
  ) => void;
};

export default function SessionResultForm({
  initialScoreA = 0,
  initialScoreB = 0,
  onScoreChange,
  onSave,
}: Props) {
  const [scoreA, setScoreA] = useState(
    String(initialScoreA)
  );

  const [scoreB, setScoreB] = useState(
    String(initialScoreB)
  );

  /**
   * Đồng bộ form khi match bên ngoài được cập nhật
   * sau khi lưu tỷ số hoặc tải lại session.
   */
  useEffect(() => {
    setScoreA(
      String(initialScoreA)
    );

    setScoreB(
      String(initialScoreB)
    );

    onScoreChange?.(
      initialScoreA,
      initialScoreB
    );
  }, [
    initialScoreA,
    initialScoreB,
    onScoreChange,
  ]);

  function handleScoreAChange(
    value: string
  ): void {
    setScoreA(value);

    onScoreChange?.(
      parseScore(value),
      parseScore(scoreB)
    );
  }

  function handleScoreBChange(
    value: string
  ): void {
    setScoreB(value);

    onScoreChange?.(
      parseScore(scoreA),
      parseScore(value)
    );
  }

  function handleSubmit(): void {
    const parsedScoreA =
      parseScore(scoreA);

    const parsedScoreB =
      parseScore(scoreB);

    if (
      parsedScoreA === null ||
      parsedScoreB === null
    ) {
      return;
    }

    onSave(
      parsedScoreA,
      parsedScoreB
    );
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <input
        type="number"
        min={0}
        step={1}
        value={scoreA}
        onChange={(event) =>
          handleScoreAChange(
            event.target.value
          )
        }
        className="w-20 rounded-xl border border-slate-200 px-3 py-2 text-center outline-none focus:border-brand-500"
      />

      <span className="text-slate-500">
        -
      </span>

      <input
        type="number"
        min={0}
        step={1}
        value={scoreB}
        onChange={(event) =>
          handleScoreBChange(
            event.target.value
          )
        }
        className="w-20 rounded-xl border border-slate-200 px-3 py-2 text-center outline-none focus:border-brand-500"
      />

      <button
        type="button"
        onClick={handleSubmit}
        className="rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white"
      >
        Lưu tỉ số
      </button>
    </div>
  );
}

function parseScore(
  value: string
): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsedValue =
    Number.parseInt(value, 10);

  if (
    Number.isNaN(parsedValue) ||
    parsedValue < 0
  ) {
    return null;
  }

  return parsedValue;
}
