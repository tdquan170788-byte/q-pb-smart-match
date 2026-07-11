"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  Plus,
  Settings,
  Trophy,
  Users,
} from "lucide-react";

import AppShell from "@/components/app-shell";
import SessionCard from "@/components/sessions/session-card";

import Avatar from "@/components/ui/avatar";
import Badge from "@/components/ui/badge";
import Card from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import SectionTitle from "@/components/ui/section-title";

import type {
  MatchRecord,
  RankingRow,
  SessionRecord,
} from "@/types";

import {
  ensureSeedData,
  getMatches,
  getMembers,
  getSessions,
} from "@/lib/storage";

import { rebuildRankingData } from "@/lib/ranking";
import { generateScheduleForSession } from "@/lib/session";

type HomeData = {
  totalMembers: number;
  totalSessions: number;
  totalMatches: number;
  recentSession: SessionRecord | null;
  recentSessionCompletedMatches: number;
  recentSessionTotalMatches: number;
  topMembers: RankingRow[];
};

const emptyHomeData: HomeData = {
  totalMembers: 0,
  totalSessions: 0,
  totalMatches: 0,
  recentSession: null,
  recentSessionCompletedMatches: 0,
  recentSessionTotalMatches: 0,
  topMembers: [],
};

export default function HomePage() {
  const [homeData, setHomeData] = useState<HomeData>(emptyHomeData);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    ensureSeedData();

    const members = getMembers();
    const sessions = getSessions();
    const matches = getMatches();

    const rankingResult = rebuildRankingData({
      members,
      sessions,
      matches,
    });

    const sortedSessions = [...sessions].sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);

      if (dateCompare !== 0) {
        return dateCompare;
      }

      return b.createdAt.localeCompare(a.createdAt);
    });

    const recentSession = sortedSessions[0] ?? null;

    const recentSessionCompletedMatches = recentSession
      ? countMatchesForSession(matches, recentSession.id)
      : 0;

    const recentSessionTotalMatches = recentSession
      ? countScheduledMatches(recentSession)
      : 0;

    setHomeData({
      totalMembers: members.length,
      totalSessions: sessions.length,
      totalMatches: matches.length,
      recentSession,
      recentSessionCompletedMatches,
      recentSessionTotalMatches,
      topMembers: rankingResult.normalRows.slice(0, 5),
    });

    setLoaded(true);
  }, []);

  const recentSessionStatus = useMemo(() => {
    if (!homeData.recentSession) {
      return null;
    }

    if (
      homeData.recentSessionTotalMatches > 0 &&
      homeData.recentSessionCompletedMatches >=
        homeData.recentSessionTotalMatches
    ) {
      return "completed";
    }

    if (homeData.recentSessionCompletedMatches > 0) {
      return "running";
    }

    return "new";
  }, [homeData]);

  return (
    <AppShell
      title="Q-PB Smart Match"
      subtitle="Quản lý buổi chơi pickleball thông minh"
    >
      <div className="space-y-5">
        <Card className="overflow-hidden bg-slate-900 text-white">
          <div className="relative">
            <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-brand-600/30" />
            <div className="absolute -bottom-20 -left-12 h-40 w-40 rounded-full bg-white/5" />

            <div className="relative">
              <div className="text-sm font-medium text-slate-300">
                Chào mừng trở lại
              </div>

              <h1 className="mt-2 text-2xl font-bold">
                Sẵn sàng cho buổi chơi mới?
              </h1>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-300">
                Chọn thành viên, tạo lịch đấu và theo dõi kết quả ngay trên một
                ứng dụng.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/sessions/new"
                  className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  <Plus size={17} />
                  Tạo session
                </Link>

                <Link
                  href="/sessions"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  <CalendarDays size={17} />
                  Xem sessions
                </Link>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <StatBox
            label="Thành viên"
            value={loaded ? homeData.totalMembers : "—"}
          />

          <StatBox
            label="Sessions"
            value={loaded ? homeData.totalSessions : "—"}
          />

          <StatBox
            label="Trận đấu"
            value={loaded ? homeData.totalMatches : "—"}
          />
        </div>

        <section>
          <SectionTitle
            title="Buổi chơi gần nhất"
            action={
              <Link
                href="/sessions"
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600"
              >
                Xem tất cả
                <ChevronRight size={16} />
              </Link>
            }
          />

          {!loaded ? (
            <Card>
              <div className="py-8 text-center text-sm text-slate-500">
                Đang tải session...
              </div>
            </Card>
          ) : homeData.recentSession ? (
            <div className="space-y-3">
              {recentSessionStatus ? (
                <div className="flex">
                  <Badge
                    variant={
                      recentSessionStatus === "completed"
                        ? "success"
                        : recentSessionStatus === "running"
                        ? "warning"
                        : "info"
                    }
                  >
                    {recentSessionStatus === "completed"
                      ? "ĐÃ HOÀN THÀNH"
                      : recentSessionStatus === "running"
                      ? "ĐANG DIỄN RA"
                      : "CHƯA BẮT ĐẦU"}
                  </Badge>
                </div>
              ) : null}

              <SessionCard
                id={homeData.recentSession.id}
                date={homeData.recentSession.date}
                mode={homeData.recentSession.mode}
                memberCount={homeData.recentSession.memberIds.length}
                completedMatches={homeData.recentSessionCompletedMatches}
                totalMatches={homeData.recentSessionTotalMatches}
              />
            </div>
          ) : (
            <Card>
              <EmptyState
                icon="🎾"
                title="Chưa có buổi chơi"
                description="Tạo session đầu tiên để bắt đầu xếp lịch và nhập kết quả."
              />

              <div className="flex justify-center">
                <Link
                  href="/sessions/new"
                  className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white"
                >
                  <Plus size={17} />
                  Tạo session đầu tiên
                </Link>
              </div>
            </Card>
          )}
        </section>

        <section>
          <SectionTitle
            title="Top thành viên"
            action={
              <Link
                href="/ranking"
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600"
              >
                Bảng xếp hạng
                <ChevronRight size={16} />
              </Link>
            }
          />

          <Card>
            {!loaded ? (
              <div className="py-8 text-center text-sm text-slate-500">
                Đang tải bảng xếp hạng...
              </div>
            ) : homeData.topMembers.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                Chưa có dữ liệu xếp hạng.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {homeData.topMembers.map((row, index) => (
                  <Link
                    key={row.memberId}
                    href={`/members/${row.memberId}`}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex w-7 shrink-0 justify-center text-lg">
                      {getRankIcon(index)}
                    </div>

                    <Avatar name={row.memberName} />

                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-slate-900">
                        {row.memberName}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {row.wins} thắng · {row.matches} trận
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-slate-900">
                        {row.rating.toFixed(0)}
                      </div>

                      <div className="text-xs text-slate-400">Rating</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </section>

        <section>
          <SectionTitle title="Truy cập nhanh" />

          <div className="grid grid-cols-2 gap-3">
            <QuickAction
              href="/sessions/new"
              title="Tạo session"
              description="Bắt đầu buổi chơi mới"
              icon={<Plus size={19} />}
            />

            <QuickAction
              href="/members"
              title="Thành viên"
              description="Quản lý danh sách"
              icon={<Users size={19} />}
            />

            <QuickAction
              href="/ranking"
              title="Bảng xếp hạng"
              description="Xem Elo và thống kê"
              icon={<Trophy size={19} />}
            />

            <QuickAction
              href="/settings"
              title="Cài đặt"
              description="Thiết lập ứng dụng"
              icon={<Settings size={19} />}
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function StatBox({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <Card className="p-3 text-center shadow-none">
      <div className="text-xl font-bold text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </Card>
  );
}

function QuickAction({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href}>
      <Card className="h-full shadow-none transition hover:border-brand-200 hover:bg-brand-50">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
          {icon}
        </div>

        <div className="mt-3 font-semibold text-slate-900">{title}</div>

        <div className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </div>
      </Card>
    </Link>
  );
}

function countMatchesForSession(
  matches: MatchRecord[],
  sessionId: string
): number {
  return matches.filter((match) => match.sessionId === sessionId).length;
}

function countScheduledMatches(session: SessionRecord): number {
  const schedule = generateScheduleForSession(session);

  return schedule.rounds.reduce(
    (sum, round) => sum + round.matches.length,
    0
  );
}

function getRankIcon(index: number): string {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";

  return `${index + 1}`;
}
