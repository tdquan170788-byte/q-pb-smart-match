"use client";

import {
  Flame,
  Medal,
  PauseCircle,
  Sparkles,
} from "lucide-react";

import SectionCard from "@/components/section-card";

import type {
  SessionInsights,
} from "@/lib/statistics";

type SessionInsightsCardProps = {
  insights: SessionInsights;
};

export default function SessionInsightsCard({
  insights,
}: SessionInsightsCardProps) {
  const hasAnyInsight =
    Boolean(insights.mvp) ||
    Boolean(insights.longestWinStreak) ||
    Boolean(insights.mostRest) ||
    Boolean(insights.bestMatch);

  if (!hasAnyInsight) {
    return (
      <SectionCard title="Điểm nổi bật của session">
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          Chưa có đủ kết quả để tạo thống kê nổi bật.
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Điểm nổi bật của session"
      action={
        <div className="rounded-full bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">
          {insights.completedMatches} /{" "}
          {insights.totalScheduledMatches} trận
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MvpInsightCard insights={insights} />

        <WinStreakInsightCard insights={insights} />

        <MostRestInsightCard insights={insights} />

        <BestMatchInsightCard insights={insights} />
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        {insights.isCompleted
          ? "Các thống kê đã được tổng hợp từ toàn bộ kết quả của session."
          : `Session đang hoàn thành ${insights.completionPercent}%. Các insight sẽ tiếp tục thay đổi khi có thêm kết quả.`}
      </div>
    </SectionCard>
  );
}

function MvpInsightCard({
  insights,
}: {
  insights: SessionInsights;
}) {
  const mvp = insights.mvp;

  if (!mvp) {
    return (
      <EmptyInsightCard
        title="MVP"
        description="Chưa xác định"
        icon={<Medal size={20} />}
        tone="amber"
      />
    );
  }

  return (
    <InsightCard
      title="MVP"
      primaryValue={mvp.memberName}
      secondaryValue={`${mvp.wins}/${mvp.matches} thắng`}
      description={`Win rate ${mvp.winRate.toFixed(
        1
      )}% • Hiệu số ${formatSignedNumber(
        mvp.pointDifference
      )}`}
      icon={<Medal size={20} />}
      tone="amber"
    />
  );
}

function WinStreakInsightCard({
  insights,
}: {
  insights: SessionInsights;
}) {
  const streak =
    insights.longestWinStreak;

  if (!streak) {
    return (
      <EmptyInsightCard
        title="Chuỗi thắng"
        description="Chưa xác định"
        icon={<Flame size={20} />}
        tone="red"
      />
    );
  }

  return (
    <InsightCard
      title="Chuỗi thắng"
      primaryValue={`${streak.longestWinStreak} trận`}
      secondaryValue={streak.memberName}
      description={`${streak.totalWins} thắng trong ${streak.matchCount} trận`}
      icon={<Flame size={20} />}
      tone="red"
    />
  );
}

function MostRestInsightCard({
  insights,
}: {
  insights: SessionInsights;
}) {
  const mostRest =
    insights.mostRest;

  if (!mostRest) {
    return (
      <EmptyInsightCard
        title="Nghỉ nhiều nhất"
        description="Chưa xác định"
        icon={<PauseCircle size={20} />}
        tone="slate"
      />
    );
  }

  return (
    <InsightCard
      title="Nghỉ nhiều nhất"
      primaryValue={`${mostRest.restRounds} round`}
      secondaryValue={mostRest.memberName}
      description={`Nghỉ liên tiếp tối đa ${mostRest.consecutiveRestMaximum} round`}
      icon={<PauseCircle size={20} />}
      tone="slate"
    />
  );
}

function BestMatchInsightCard({
  insights,
}: {
  insights: SessionInsights;
}) {
  const bestMatch =
    insights.bestMatch;

  if (!bestMatch) {
    return (
      <EmptyInsightCard
        title="Trận nổi bật"
        description="Chưa xác định"
        icon={<Sparkles size={20} />}
        tone="brand"
      />
    );
  }

  return (
    <InsightCard
      title="Trận nổi bật"
      primaryValue={`${bestMatch.scoreA} - ${bestMatch.scoreB}`}
      secondaryValue={`Round ${bestMatch.round} • Court ${bestMatch.court}`}
      description={`${formatTeamNames(
        bestMatch.teamAMemberNames
      )} vs ${formatTeamNames(
        bestMatch.teamBMemberNames
      )}`}
      icon={<Sparkles size={20} />}
      tone="brand"
    />
  );
}

function InsightCard({
  title,
  primaryValue,
  secondaryValue,
  description,
  icon,
  tone,
}: {
  title: string;
  primaryValue: string;
  secondaryValue: string;
  description: string;
  icon: React.ReactNode;
  tone:
    | "amber"
    | "red"
    | "slate"
    | "brand";
}) {
  const presentation =
    getTonePresentation(tone);

  return (
    <div
      className={`rounded-3xl border p-4 ${presentation.cardClassName}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </div>

          <div className="mt-2 truncate text-xl font-bold text-slate-900">
            {primaryValue}
          </div>

          <div className="mt-1 truncate text-sm font-semibold text-slate-700">
            {secondaryValue}
          </div>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${presentation.iconClassName}`}
        >
          {icon}
        </div>
      </div>

      <div className="mt-4 border-t border-slate-200/80 pt-3 text-xs leading-5 text-slate-500">
        {description}
      </div>
    </div>
  );
}

function EmptyInsightCard({
  title,
  description,
  icon,
  tone,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  tone:
    | "amber"
    | "red"
    | "slate"
    | "brand";
}) {
  const presentation =
    getTonePresentation(tone);

  return (
    <div
      className={`rounded-3xl border p-4 ${presentation.cardClassName}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </div>

          <div className="mt-2 text-sm font-medium text-slate-500">
            {description}
          </div>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${presentation.iconClassName}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function getTonePresentation(
  tone:
    | "amber"
    | "red"
    | "slate"
    | "brand"
): {
  cardClassName: string;
  iconClassName: string;
} {
  if (tone === "amber") {
    return {
      cardClassName:
        "border-amber-100 bg-amber-50",
      iconClassName:
        "bg-white text-amber-700",
    };
  }

  if (tone === "red") {
    return {
      cardClassName:
        "border-red-100 bg-red-50",
      iconClassName:
        "bg-white text-red-700",
    };
  }

  if (tone === "brand") {
    return {
      cardClassName:
        "border-brand-100 bg-brand-50",
      iconClassName:
        "bg-white text-brand-700",
    };
  }

  return {
    cardClassName:
      "border-slate-200 bg-slate-50",
    iconClassName:
      "bg-white text-slate-700",
  };
}

function formatSignedNumber(
  value: number
): string {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}

function formatTeamNames(
  names: string[]
): string {
  if (names.length === 0) {
    return "Không xác định";
  }

  return names.join(" / ");
}