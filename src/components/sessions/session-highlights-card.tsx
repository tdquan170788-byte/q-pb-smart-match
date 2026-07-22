"use client";

import type { Member } from "@/types";

import type {
  BestPartnershipHighlight,
  LongestWinStreakHighlight,
  MatchOfTheDayHighlight,
  MostEfficientPlayerHighlight,
  MostRestedPlayerHighlight,
  SessionHighlights,
} from "@/lib/statistics/session-summary";

type SessionHighlightsCardProps = {
  highlights?: SessionHighlights;

  memberMap: Map<string, Member>;
};

export default function SessionHighlightsCard({
  highlights,
  memberMap,
}: SessionHighlightsCardProps) {
  if (!hasHighlights(highlights)) {
    return null;
  }

  return (
    <section className="mt-6">
      <div className="mb-3">
        <h3 className="text-base font-bold text-slate-900">
          Điểm nhấn session
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Những thành tích nổi bật trong phiên đấu.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {highlights.bestPartnership ? (
          <BestPartnershipCard
            highlight={highlights.bestPartnership}
            memberMap={memberMap}
          />
        ) : null}

        {highlights.matchOfTheDay ? (
          <MatchOfTheDayCard
            highlight={highlights.matchOfTheDay}
            memberMap={memberMap}
          />
        ) : null}

        {highlights.mostEfficientPlayer ? (
          <MostEfficientPlayerCard
            highlight={highlights.mostEfficientPlayer}
            memberMap={memberMap}
          />
        ) : null}

        {highlights.longestWinStreak ? (
          <LongestWinStreakCard
            highlight={highlights.longestWinStreak}
            memberMap={memberMap}
          />
        ) : null}

        {highlights.mostRestedPlayer ? (
          <MostRestedPlayerCard
            highlight={highlights.mostRestedPlayer}
            memberMap={memberMap}
          />
        ) : null}
      </div>
    </section>
  );
}

/* =========================================================
   Best Partnership
========================================================= */

function BestPartnershipCard({
  highlight,
  memberMap,
}: {
  highlight: BestPartnershipHighlight;

  memberMap: Map<string, Member>;
}) {
  const partnershipName = highlight.memberIds
    .map((memberId) => getMemberName(memberId, memberMap))
    .join(" & ");

  return (
    <HighlightCard
      emoji="🏆"
      label="Cặp đôi xuất sắc"
      title={partnershipName}
      description={`${highlight.wins} thắng · ${highlight.losses} thua · ${highlight.draws} hòa`}
      metricLabel="Win rate"
      metricValue={formatPercent(highlight.winRate)}
      footer={`Hiệu số ${formatSignedNumber(highlight.pointDiff)} sau ${highlight.matches} trận`}
      className="border-amber-200 bg-amber-50"
    />
  );
}

/* =========================================================
   Match Of The Day
========================================================= */

function MatchOfTheDayCard({
  highlight,
  memberMap,
}: {
  highlight: MatchOfTheDayHighlight;

  memberMap: Map<string, Member>;
}) {
  const teamAName = formatTeamName(
    highlight.teamAMemberIds,
    memberMap
  );

  const teamBName = formatTeamName(
    highlight.teamBMemberIds,
    memberMap
  );

  return (
    <HighlightCard
      emoji="🎯"
      label="Trận đấu hay nhất"
      title={`${highlight.scoreA} - ${highlight.scoreB}`}
      description={`${teamAName} vs ${teamBName}`}
      metricLabel="Chênh lệch"
      metricValue={highlight.pointDiff}
      footer={`Round ${highlight.round} · Sân ${highlight.court} · ${highlight.totalPoints} tổng điểm`}
      className="border-sky-200 bg-sky-50"
    />
  );
}

/* =========================================================
   Most Efficient Player
========================================================= */

function MostEfficientPlayerCard({
  highlight,
  memberMap,
}: {
  highlight: MostEfficientPlayerHighlight;

  memberMap: Map<string, Member>;
}) {
  return (
    <HighlightCard
      emoji="⚡"
      label="Người chơi hiệu quả nhất"
      title={getMemberName(
        highlight.memberId,
        memberMap
      )}
      description="Dựa trên tỷ lệ thắng và hiệu số điểm trung bình."
      metricLabel="Hiệu suất"
      metricValue={formatDecimal(highlight.score)}
      footer="Điểm hiệu suất trong session"
      className="border-emerald-200 bg-emerald-50"
    />
  );
}

/* =========================================================
   Longest Win Streak
========================================================= */

function LongestWinStreakCard({
  highlight,
  memberMap,
}: {
  highlight: LongestWinStreakHighlight;

  memberMap: Map<string, Member>;
}) {
  return (
    <HighlightCard
      emoji="🔥"
      label="Chuỗi thắng dài nhất"
      title={getMemberName(
        highlight.memberId,
        memberMap
      )}
      description={`${highlight.streak} trận thắng liên tiếp`}
      metricLabel="Chuỗi thắng"
      metricValue={highlight.streak}
      footer="Thành tích tốt nhất trong session"
      className="border-orange-200 bg-orange-50"
    />
  );
}

/* =========================================================
   Most Rested Player
========================================================= */

function MostRestedPlayerCard({
  highlight,
  memberMap,
}: {
  highlight: MostRestedPlayerHighlight;

  memberMap: Map<string, Member>;
}) {
  return (
    <HighlightCard
      emoji="😴"
      label="Nghỉ nhiều nhất"
      title={getMemberName(
        highlight.memberId,
        memberMap
      )}
      description={`${highlight.restedRounds} vòng nghỉ`}
      metricLabel="Vòng nghỉ"
      metricValue={highlight.restedRounds}
      footer="Số vòng không tham gia thi đấu"
      className="border-violet-200 bg-violet-50"
    />
  );
}

/* =========================================================
   Shared UI
========================================================= */

function HighlightCard({
  emoji,
  label,
  title,
  description,
  metricLabel,
  metricValue,
  footer,
  className,
}: {
  emoji: string;

  label: string;

  title: string;

  description: string;

  metricLabel: string;

  metricValue: string | number;

  footer: string;

  className: string;
}) {
  return (
    <article
      className={`rounded-3xl border p-4 ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <span
              aria-hidden="true"
              className="text-lg"
            >
              {emoji}
            </span>

            <span>{label}</span>
          </div>

          <div className="mt-3 break-words text-lg font-bold text-slate-900">
            {title}
          </div>

          <div className="mt-1 text-sm leading-5 text-slate-600">
            {description}
          </div>
        </div>

        <div className="shrink-0 rounded-2xl bg-white px-3 py-2 text-center shadow-sm">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {metricLabel}
          </div>

          <div className="mt-1 text-xl font-bold text-slate-900">
            {metricValue}
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-black/5 pt-3 text-xs leading-5 text-slate-500">
        {footer}
      </div>
    </article>
  );
}

/* =========================================================
   Helpers
========================================================= */

function hasHighlights(
  highlights?: SessionHighlights
): highlights is SessionHighlights {
  if (!highlights) return false;

  return Boolean(
    highlights.bestPartnership ||
      highlights.matchOfTheDay ||
      highlights.mostEfficientPlayer ||
      highlights.longestWinStreak ||
      highlights.mostRestedPlayer
  );
}

function getMemberName(
  memberId: string,
  memberMap: Map<string, Member>
): string {
  const member = memberMap.get(memberId);

  return member?.name?.trim() || memberId;
}

function formatTeamName(
  memberIds: string[],
  memberMap: Map<string, Member>
): string {
  return memberIds
    .map((memberId) =>
      getMemberName(memberId, memberMap)
    )
    .join(" / ");
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatSignedNumber(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}

function formatDecimal(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2);
}
