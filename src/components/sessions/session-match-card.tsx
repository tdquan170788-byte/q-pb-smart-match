"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  MatchRecord,
  Member,
} from "@/types";

import {
  calculateMatchRating,
  type TeamRatingResult,
} from "@/lib/rating";

import MatchRatingPreview from "./match-rating-preview";
import SessionResultForm from "./session-result-form";

type Props = {
  match: MatchRecord;

  memberMap: Map<string, Member>;

  onSaveScore: (
    match: MatchRecord,
    scoreA: number,
    scoreB: number
  ) => void;
};

function getTeamDisplayNames(
  memberIds: string[],
  memberMap: Map<string, Member>
): string[] {
  return memberIds.map(
    (memberId) =>
      memberMap.get(memberId)?.name ??
      "Unknown"
  );
}

export default function SessionMatchCard({
  match,
  memberMap,
  onSaveScore,
}: Props) {
  const [
    previewScoreA,
    setPreviewScoreA,
  ] = useState<number | null>(
    match.scoreA
  );

  const [
    previewScoreB,
    setPreviewScoreB,
  ] = useState<number | null>(
    match.scoreB
  );

  /**
   * Khi match được cập nhật sau khi lưu,
   * đồng bộ lại tỷ số đang hiển thị.
   */
  useEffect(() => {
    setPreviewScoreA(
      match.scoreA
    );

    setPreviewScoreB(
      match.scoreB
    );
  }, [
    match.scoreA,
    match.scoreB,
  ]);

  const teamA = useMemo(
    () =>
      getTeamDisplayNames(
        match.teamA.memberIds,
        memberMap
      ),
    [
      match.teamA.memberIds,
      memberMap,
    ]
  );

  const teamB = useMemo(
    () =>
      getTeamDisplayNames(
        match.teamB.memberIds,
        memberMap
      ),
    [
      match.teamB.memberIds,
      memberMap,
    ]
  );

  const members = useMemo(
    () => [
      ...memberMap.values(),
    ],
    [memberMap]
  );

  const ratingPreview:
    | TeamRatingResult
    | null = useMemo(() => {
    if (
      previewScoreA === null ||
      previewScoreB === null
    ) {
      return null;
    }

    /**
     * Pickleball không có kết quả hòa.
     * Không hiển thị preview khi hai điểm bằng nhau.
     */
    if (
      previewScoreA ===
      previewScoreB
    ) {
      return null;
    }

    const previewMatch:
      MatchRecord = {
      ...match,

      scoreA: previewScoreA,

      scoreB: previewScoreB,
    };

    return calculateMatchRating(
      previewMatch,
      members
    );
  }, [
    match,
    members,
    previewScoreA,
    previewScoreB,
  ]);

  const handleScoreChange =
    useCallback(
      (
        scoreA: number | null,
        scoreB: number | null
      ): void => {
        setPreviewScoreA(scoreA);
        setPreviewScoreB(scoreB);
      },
      []
    );

  function handleSave(
    scoreA: number,
    scoreB: number
  ): void {
    onSaveScore(
      match,
      scoreA,
      scoreB
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-900">
          Court {match.court ?? 1}
        </div>

        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          Round {match.round}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Team A
          </div>

          <div className="mt-2 font-semibold text-slate-900">
            {teamA.join(" / ")}
          </div>
        </div>

        <div className="text-center text-xl font-bold text-slate-900">
          {formatPreviewScore(
            previewScoreA
          )}{" "}
          -{" "}
          {formatPreviewScore(
            previewScoreB
          )}
        </div>

        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Team B
          </div>

          <div className="mt-2 font-semibold text-slate-900">
            {teamB.join(" / ")}
          </div>
        </div>
      </div>

      <SessionResultForm
        initialScoreA={
          match.scoreA
        }
        initialScoreB={
          match.scoreB
        }
        onScoreChange={
          handleScoreChange
        }
        onSave={handleSave}
      />

      {ratingPreview ? (
        <MatchRatingPreview
          result={ratingPreview}
          memberMap={memberMap}
        />
      ) : (
        <RatingPreviewPlaceholder
          scoreA={previewScoreA}
          scoreB={previewScoreB}
        />
      )}
    </div>
  );
}

function RatingPreviewPlaceholder({
  scoreA,
  scoreB,
}: {
  scoreA: number | null;
  scoreB: number | null;
}) {
  if (
    scoreA === null ||
    scoreB === null
  ) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        Nhập đầy đủ tỷ số để xem Rating
        Preview.
      </div>
    );
  }

  if (scoreA === scoreB) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
        Hai đội đang bằng điểm. Rating
        Preview sẽ xuất hiện khi có đội dẫn
        điểm.
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
      Không thể tính Rating Preview. Hãy
      kiểm tra dữ liệu thành viên của trận.
    </div>
  );
}

function formatPreviewScore(
  score: number | null
): string {
  if (score === null) {
    return "-";
  }

  return String(score);
}
