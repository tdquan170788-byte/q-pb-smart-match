"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Swords,
  Trophy,
} from "lucide-react";

import {
  useParams,
} from "next/navigation";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import MemberInsightsCard from "@/components/members/member-insights-card";

import Avatar from "@/components/ui/avatar";
import Badge from "@/components/ui/badge";
import Card from "@/components/ui/card";

import type {
  MatchRecord,
  Member,
  SessionRecord,
} from "@/types";

import type {
  MemberInsights,
  MemberMatchHistoryItem,
} from "@/lib/statistics";

import {
  buildMemberInsights,
} from "@/lib/statistics";

import {
  ensureSeedData,
  getMatches,
  getMemberById,
  getMembers,
  getSessions,
} from "@/lib/storage";

type MemberDetailData = {
  member: Member | null;

  insights: MemberInsights | null;

  sessions: SessionRecord[];

  matches: MatchRecord[];
};

const emptyMemberDetailData: MemberDetailData = {
  member: null,

  insights: null,

  sessions: [],

  matches: [],
};

export default function MemberDetailPage() {
  const params =
    useParams<{ id: string }>();

  const memberId =
    params.id;

  const [
    data,
    setData,
  ] = useState<MemberDetailData>(
    emptyMemberDetailData
  );

  const [
    loaded,
    setLoaded,
  ] = useState(false);

  useEffect(() => {
    ensureSeedData();

    const members =
      getMembers();

    const sessions =
      getSessions();

    const matches =
      getMatches();

    const member =
      getMemberById(memberId) ??
      null;

    const insights =
      member
        ? buildMemberInsights({
            memberId,

            members,

            sessions,

            matches,

            recentFormLimit:
              5,

            minimumPartnerMatches:
              2,
          })
        : null;

    setData({
      member,

      insights,

      sessions,

      matches,
    });

    setLoaded(true);
  }, [memberId]);

  const sessionMap =
    useMemo(() => {
      return new Map(
        data.sessions.map(
          (session) => [
            session.id,
            session,
          ]
        )
      );
    }, [data.sessions]);

  if (!loaded) {
    return (
      <AppShell
        title="Chi tiết thành viên"
        subtitle="Đang tải dữ liệu..."
      >
        <Card>
          <div className="py-10 text-center text-sm text-slate-500">
            Đang tải hồ sơ thành viên...
          </div>
        </Card>
      </AppShell>
    );
  }

  if (
    !data.member ||
    !data.insights
  ) {
    return (
      <AppShell
        title="Chi tiết thành viên"
        subtitle="Không tìm thấy dữ liệu"
      >
        <SectionCard title="Không tìm thấy thành viên">
          <div className="text-sm leading-6 text-slate-600">
            Thành viên này không tồn tại hoặc đã bị xoá khỏi ứng dụng.
          </div>

          <Link
            href="/members"
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white"
          >
            <ArrowLeft size={17} />

            Quay lại danh sách
          </Link>
        </SectionCard>
      </AppShell>
    );
  }

  const member =
    data.member;

  const insights =
    data.insights;

  return (
    <AppShell
      title={member.name}
      subtitle={
        member.nickname?.trim()
          ? `Biệt danh: ${member.nickname}`
          : "Hồ sơ và thống kê thành viên"
      }
    >
      <div className="space-y-4">
        <div className="flex">
          <Link
            href="/members"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600"
          >
            <ArrowLeft size={16} />

            Danh sách thành viên
          </Link>
        </div>

        <MemberProfileHeader
          member={member}
          insights={insights}
        />

        <MemberInsightsCard
          insights={insights}
        />

        <SectionCard title="Thống kê tổng quan">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <SummaryMetric
              label="Tổng trận"
              value={
                insights.overall.matches
              }
              description={`${insights.overall.wins} thắng • ${insights.overall.losses} thua`}
            />

            <SummaryMetric
              label="Tỷ lệ thắng"
              value={`${insights.overall.winRate.toFixed(
                1
              )}%`}
              description="Tất cả chế độ"
            />

            <SummaryMetric
              label="Hiệu số điểm"
              value={formatSignedNumber(
                insights.overall.pointDifference
              )}
              description={`${insights.overall.pointsFor} - ${insights.overall.pointsAgainst}`}
            />

            <SummaryMetric
              label="Chuỗi thắng dài nhất"
              value={
                insights.longestWinStreak
              }
              description={`Hiện tại ${insights.currentWinStreak} trận`}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Lịch sử trận đấu"
          action={
            <div className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
              {insights.matchHistory.length} trận
            </div>
          }
        >
          {insights.matchHistory.length ===
          0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              Thành viên chưa có trận đấu hoàn thành.
            </div>
          ) : (
            <div className="space-y-3">
              {insights.matchHistory.map(
                (historyItem) => (
                  <MemberMatchHistoryCard
                    key={
                      historyItem.matchId
                    }
                    item={
                      historyItem
                    }
                    sessionDate={
                      sessionMap.get(
                        historyItem.sessionId
                      )?.date ??
                      historyItem.sessionDate
                    }
                  />
                )
              )}
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}

function MemberProfileHeader({
  member,
  insights,
}: {
  member: Member;

  insights: MemberInsights;
}) {
  return (
    <Card className="overflow-hidden bg-slate-900 text-white">
      <div className="relative">
        <div className="absolute -right-12 -top-14 h-40 w-40 rounded-full bg-brand-600/30" />

        <div className="absolute -bottom-20 -left-12 h-40 w-40 rounded-full bg-white/5" />

        <div className="relative">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar
              name={member.name}
            />

            <div className="min-w-0 flex-1">
              <div className="truncate text-xl font-bold">
                {member.name}
              </div>

              <div className="mt-1 text-sm text-slate-300">
                {member.nickname?.trim()
                  ? member.nickname
                  : "Chưa có biệt danh"}
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 px-4 py-3 text-right">
              <div className="text-xs text-slate-300">
                Overall Rating
              </div>

              <div className="mt-1 text-2xl font-bold">
                {Math.round(
                  insights.overall.rating
                ).toLocaleString(
                  "vi-VN"
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <HeaderMetric
              label="Normal Rating"
              value={Math.round(
                insights.normal.rating
              )}
            />

            <HeaderMetric
              label="Team Rating"
              value={Math.round(
                insights.team.rating
              )}
            />

            <HeaderMetric
              label="Trận thắng"
              value={
                insights.overall.wins
              }
            />

            <HeaderMetric
              label="Win rate"
              value={`${insights.overall.winRate.toFixed(
                1
              )}%`}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

function HeaderMetric({
  label,
  value,
}: {
  label: string;

  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-3">
      <div className="text-xs text-slate-300">
        {label}
      </div>

      <div className="mt-1 text-lg font-bold text-white">
        {value}
      </div>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  description,
}: {
  label: string;

  value: string | number;

  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </div>

      <div className="mt-2 text-xs leading-5 text-slate-500">
        {description}
      </div>
    </div>
  );
}

function MemberMatchHistoryCard({
  item,
  sessionDate,
}: {
  item: MemberMatchHistoryItem;

  sessionDate: string;
}) {
  const won =
    item.result === "win";

  return (
    <Link
      href={`/sessions/${item.sessionId}`}
      className="block"
    >
      <div
        className={`rounded-2xl border p-4 transition hover:border-brand-200 ${
          won
            ? "border-emerald-100 bg-emerald-50"
            : "border-red-100 bg-red-50"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  won
                    ? "success"
                    : "danger"
                }
              >
                {won
                  ? "THẮNG"
                  : "THUA"}
              </Badge>

              <Badge variant="info">
                {item.mode === "team"
                  ? "TEAM"
                  : "NORMAL"}
              </Badge>
            </div>

            <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <CalendarDays
                size={16}
              />

              {formatDate(
                sessionDate
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900">
              {item.scoreFor}
              {" - "}
              {item.scoreAgainst}
            </div>

            <div className="mt-1 text-xs text-slate-500">
              Round {item.round}
              {" • "}
              Court {item.court}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <MatchPeopleBox
            label="Đồng đội"
            names={
              item.teammateNames
            }
            emptyText="Không xác định"
          />

          <MatchPeopleBox
            label="Đối thủ"
            names={
              item.opponentNames
            }
            emptyText="Không xác định"
          />
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-200/70 pt-3 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Swords size={14} />

            Xem chi tiết session
          </div>

          <ChevronRight
            size={16}
          />
        </div>
      </div>
    </Link>
  );
}

function MatchPeopleBox({
  label,
  names,
  emptyText,
}: {
  label: string;

  names: string[];

  emptyText: string;
}) {
  return (
    <div className="rounded-xl bg-white/80 p-3">
      <div className="text-xs text-slate-500">
        {label}
      </div>

      <div className="mt-1 text-sm font-semibold text-slate-900">
        {names.length > 0
          ? names.join(" / ")
          : emptyText}
      </div>
    </div>
  );
}

function formatDate(
  date: string
): string {
  const parsedDate =
    new Date(
      `${date}T00:00:00`
    );

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return date;
  }

  return parsedDate.toLocaleDateString(
    "vi-VN"
  );
}

function formatSignedNumber(
  value: number
): string {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}
