"use client";

import Link from "next/link";

import {
  Flame,
  Handshake,
  ShieldAlert,
  Swords,
  TrendingUp,
} from "lucide-react";

import SectionCard from "@/components/section-card";

import type {
  MemberInsights,
  MemberMatchResult,
} from "@/lib/statistics";

type MemberInsightsCardProps = {
  insights: MemberInsights;
};

export default function MemberInsightsCard({
  insights,
}: MemberInsightsCardProps) {
  return (
    <SectionCard
      title="Phong độ và đối đầu"
      action={
        <div className="rounded-full bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">
          {insights.overall.matches} trận
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <RecentFormCard insights={insights} />

        <WinStreakCard insights={insights} />

        <FavoritePartnerCard
          insights={insights}
        />

        <HardestOpponentCard
          insights={insights}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <ModeStatisticsCard
          title="Normal"
          rating={insights.normal.rating}
          matches={insights.normal.matches}
          wins={insights.normal.wins}
          losses={insights.normal.losses}
          winRate={insights.normal.winRate}
          pointDifference={
            insights.normal.pointDifference
          }
          tone="brand"
        />

        <ModeStatisticsCard
          title="Team"
          rating={insights.team.rating}
          matches={insights.team.matches}
          wins={insights.team.wins}
          losses={insights.team.losses}
          winRate={insights.team.winRate}
          pointDifference={
            insights.team.pointDifference
          }
          tone="success"
        />

        <BestPartnerCard insights={insights} />

        <FrequentOpponentCard
          insights={insights}
        />
      </div>
    </SectionCard>
  );
}

function RecentFormCard({
  insights,
}: {
  insights: MemberInsights;
}) {
  return (
    <InsightCard
      title="Phong độ gần đây"
      icon={<TrendingUp size={20} />}
      tone="brand"
    >
      {insights.recentForm.length === 0 ? (
        <EmptyContent text="Chưa có kết quả" />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {insights.recentForm.map(
              (item) => (
                <ResultBadge
                  key={item.matchId}
                  result={item.result}
                />
              )
            )}
          </div>

          <div className="mt-3 text-xs leading-5 text-slate-500">
            {formatRecentForm(
              insights.recentForm.map(
                (item) => item.result
              )
            )}
          </div>
        </>
      )}
    </InsightCard>
  );
}

function WinStreakCard({
  insights,
}: {
  insights: MemberInsights;
}) {
  return (
    <InsightCard
      title="Chuỗi thắng"
      icon={<Flame size={20} />}
      tone="red"
    >
      {insights.overall.matches === 0 ? (
        <EmptyContent text="Chưa có kết quả" />
      ) : (
        <>
          <div className="text-2xl font-bold text-slate-900">
            {insights.longestWinStreak} trận
          </div>

          <div className="mt-1 text-sm font-semibold text-slate-700">
            Dài nhất
          </div>

          <div className="mt-3 text-xs leading-5 text-slate-500">
            Hiện tại:{" "}
            <strong>
              {insights.currentWinStreak}
            </strong>{" "}
            trận thắng liên tiếp
          </div>
        </>
      )}
    </InsightCard>
  );
}

function FavoritePartnerCard({
  insights,
}: {
  insights: MemberInsights;
}) {
  const partner =
    insights.favoritePartner;

  return (
    <InsightCard
      title="Đồng đội thân thuộc"
      icon={<Handshake size={20} />}
      tone="amber"
    >
      {!partner ? (
        <EmptyContent text="Chưa có đồng đội" />
      ) : (
        <Link
          href={`/members/${partner.partner.memberId}`}
          className="block"
        >
          <div className="truncate text-lg font-bold text-slate-900">
            {partner.partner.memberName}
          </div>

          <div className="mt-1 text-sm font-semibold text-slate-700">
            {partner.matches} trận cùng nhau
          </div>

          <div className="mt-3 text-xs leading-5 text-slate-500">
            {partner.wins} thắng ·{" "}
            {partner.losses} thua ·{" "}
            {partner.winRate.toFixed(1)}%
          </div>
        </Link>
      )}
    </InsightCard>
  );
}

function HardestOpponentCard({
  insights,
}: {
  insights: MemberInsights;
}) {
  const opponent =
    insights.hardestOpponent;

  return (
    <InsightCard
      title="Đối thủ khó nhất"
      icon={<ShieldAlert size={20} />}
      tone="danger"
    >
      {!opponent ? (
        <EmptyContent text="Chưa có đối thủ" />
      ) : (
        <Link
          href={`/members/${opponent.opponent.memberId}`}
          className="block"
        >
          <div className="truncate text-lg font-bold text-slate-900">
            {opponent.opponent.memberName}
          </div>

          <div className="mt-1 text-sm font-semibold text-slate-700">
            {opponent.meetings} lần đối đầu
          </div>

          <div className="mt-3 text-xs leading-5 text-slate-500">
            Thắng {opponent.wins} · Thua{" "}
            {opponent.losses}
          </div>
        </Link>
      )}
    </InsightCard>
  );
}

function BestPartnerCard({
  insights,
}: {
  insights: MemberInsights;
}) {
  const partner =
    insights.bestPartner;

  return (
    <InsightCard
      title="Đồng đội hiệu quả"
      icon={<Handshake size={20} />}
      tone="success"
    >
      {!partner ? (
        <EmptyContent text="Chưa đủ dữ liệu" />
      ) : (
        <Link
          href={`/members/${partner.partner.memberId}`}
          className="block"
        >
          <div className="truncate text-lg font-bold text-slate-900">
            {partner.partner.memberName}
          </div>

          <div className="mt-1 text-2xl font-bold text-emerald-700">
            {partner.winRate.toFixed(1)}%
          </div>

          <div className="mt-3 text-xs leading-5 text-slate-500">
            {partner.wins}/{partner.matches} thắng ·
            Hiệu số{" "}
            {formatSignedNumber(
              partner.pointDifference
            )}
          </div>
        </Link>
      )}
    </InsightCard>
  );
}

function FrequentOpponentCard({
  insights,
}: {
  insights: MemberInsights;
}) {
  const opponent =
    insights.mostFrequentOpponent;

  return (
    <InsightCard
      title="Đối đầu nhiều nhất"
      icon={<Swords size={20} />}
      tone="slate"
    >
      {!opponent ? (
        <EmptyContent text="Chưa có đối thủ" />
      ) : (
        <Link
          href={`/members/${opponent.opponent.memberId}`}
          className="block"
        >
          <div className="truncate text-lg font-bold text-slate-900">
            {opponent.opponent.memberName}
          </div>

          <div className="mt-1 text-sm font-semibold text-slate-700">
            {opponent.meetings} lần gặp
          </div>

          <div className="mt-3 text-xs leading-5 text-slate-500">
            Thắng {opponent.wins} · Thua{" "}
            {opponent.losses} ·{" "}
            {opponent.winRate.toFixed(1)}%
          </div>
        </Link>
      )}
    </InsightCard>
  );
}

function ModeStatisticsCard({
  title,
  rating,
  matches,
  wins,
  losses,
  winRate,
  pointDifference,
  tone,
}: {
  title: string;
  rating: number;
  matches: number;
  wins: number;
  losses: number;
  winRate: number;
  pointDifference: number;
  tone: "brand" | "success";
}) {
  const presentation =
    getTonePresentation(tone);

  return (
    <div
      className={`rounded-3xl border p-4 ${presentation.cardClassName}`}
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </div>

      <div className="mt-2 text-2xl font-bold text-slate-900">
        {Math.round(rating).toLocaleString(
          "vi-VN"
        )}
      </div>

      <div className="mt-1 text-xs text-slate-500">
        Rating
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <SmallMetric
          label="Trận"
          value={matches}
        />

        <SmallMetric
          label="Win rate"
          value={`${winRate.toFixed(1)}%`}
        />

        <SmallMetric
          label="Thắng / Thua"
          value={`${wins} / ${losses}`}
        />

        <SmallMetric
          label="Hiệu số"
          value={formatSignedNumber(
            pointDifference
          )}
        />
      </div>
    </div>
  );
}

function InsightCard({
  title,
  icon,
  tone,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  tone:
    | "brand"
    | "red"
    | "amber"
    | "danger"
    | "success"
    | "slate";
  children: React.ReactNode;
}) {
  const presentation =
    getTonePresentation(tone);

  return (
    <div
      className={`rounded-3xl border p-4 ${presentation.cardClassName}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${presentation.iconClassName}`}
        >
          {icon}
        </div>
      </div>

      <div className="mt-4">
        {children}
      </div>
    </div>
  );
}

function ResultBadge({
  result,
}: {
  result: MemberMatchResult;
}) {
  const won =
    result === "win";

  return (
    <div
      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
        won
          ? "bg-emerald-100 text-emerald-800"
          : "bg-red-100 text-red-800"
      }`}
    >
      {won ? "W" : "L"}
    </div>
  );
}

function SmallMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-white/80 p-3">
      <div className="text-[11px] text-slate-500">
        {label}
      </div>

      <div className="mt-1 text-sm font-bold text-slate-900">
        {value}
      </div>
    </div>
  );
}

function EmptyContent({
  text,
}: {
  text: string;
}) {
  return (
    <div className="py-3 text-sm text-slate-500">
      {text}
    </div>
  );
}

function getTonePresentation(
  tone:
    | "brand"
    | "red"
    | "amber"
    | "danger"
    | "success"
    | "slate"
): {
  cardClassName: string;
  iconClassName: string;
} {
  if (tone === "brand") {
    return {
      cardClassName:
        "border-brand-100 bg-brand-50",

      iconClassName:
        "bg-white text-brand-700",
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

  if (tone === "amber") {
    return {
      cardClassName:
        "border-amber-100 bg-amber-50",

      iconClassName:
        "bg-white text-amber-700",
    };
  }

  if (tone === "danger") {
    return {
      cardClassName:
        "border-rose-100 bg-rose-50",

      iconClassName:
        "bg-white text-rose-700",
    };
  }

  if (tone === "success") {
    return {
      cardClassName:
        "border-emerald-100 bg-emerald-50",

      iconClassName:
        "bg-white text-emerald-700",
    };
  }

  return {
    cardClassName:
      "border-slate-200 bg-slate-50",

    iconClassName:
      "bg-white text-slate-700",
  };
}

function formatRecentForm(
  results: MemberMatchResult[]
): string {
  const wins =
    results.filter(
      (result) => result === "win"
    ).length;

  return `${wins} thắng trong ${results.length} trận gần nhất`;
}

function formatSignedNumber(
  value: number
): string {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}
