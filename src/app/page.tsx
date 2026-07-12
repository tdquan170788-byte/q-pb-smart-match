"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  CalendarCheck2,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronRight,
  CircleDashed,
  Gamepad2,
  Layers3,
  LockKeyhole,
  Plus,
  Settings,
  Trophy,
  Users,
} from "lucide-react";

import AppShell from "@/components/app-shell";
import DashboardMetricCard from "@/components/dashboard/dashboard-metric-card";
import HallOfFameCard from "@/components/dashboard/hall-of-fame-card";
import SessionCard from "@/components/sessions/session-card";

import Avatar from "@/components/ui/avatar";
import Badge from "@/components/ui/badge";
import Card from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import SectionTitle from "@/components/ui/section-title";

import type {
  DashboardStatistics,
  HallOfFameEntry,
  HallOfFameStatistics,
} from "@/lib/statistics";

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

import {
  rebuildRankingData,
} from "@/lib/ranking";

import {
  generateScheduleForSession,
} from "@/lib/session";

import {
  buildDashboardStatistics,
  buildHallOfFameStatistics,
} from "@/lib/statistics";

type HomeData = {
  statistics: DashboardStatistics;

  hallOfFame: HallOfFameStatistics;

  recentSession: SessionRecord | null;

  recentSessionCompletedMatches: number;

  recentSessionTotalMatches: number;

  topMembers: RankingRow[];
};

const emptyStatistics: DashboardStatistics = {
  totalMembers: 0,

  totalSessions: 0,

  normalSessionCount: 0,

  teamSessionCount: 0,

  totalSavedMatches: 0,

  completedMatchCount: 0,

  pendingMatchCount: 0,

  normalCompletedMatchCount: 0,

  teamCompletedMatchCount: 0,

  totalScheduledMatches: 0,

  totalRounds: 0,

  frozenSessionCount: 0,

  unfrozenSessionCount: 0,

  completionPercent: 0,
};

const emptyHallOfFame: HallOfFameStatistics = {
  normalRatingLeader: null,

  teamRatingLeader: null,

  mostWins: null,

  bestWinRate: null,

  normalRatingTop: [],

  teamRatingTop: [],

  winsTop: [],

  winRateTop: [],

  minimumMatchesForWinRate: 5,
};

const emptyHomeData: HomeData = {
  statistics: emptyStatistics,

  hallOfFame: emptyHallOfFame,

  recentSession: null,

  recentSessionCompletedMatches: 0,

  recentSessionTotalMatches: 0,

  topMembers: [],
};

export default function HomePage() {
  const [
    homeData,
    setHomeData,
  ] = useState<HomeData>(
    emptyHomeData
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

    /**
     * Resolve lịch của mọi session để Dashboard
     * thống kê được cả session cũ chưa có snapshot.
     */
    const schedules =
      sessions.map((session) =>
        generateScheduleForSession(
          session
        )
      );

    const statistics =
      buildDashboardStatistics({
        members,

        sessions,

        matches,

        schedules,
      });

    const hallOfFame =
      buildHallOfFameStatistics({
        members,

        minimumMatchesForWinRate:
          5,

        topLimit:
          5,
      });

    const rankingResult =
      rebuildRankingData({
        members,

        sessions,

        matches,
      });

    const sortedSessions = [
      ...sessions,
    ].sort(
      (
        firstSession,
        secondSession
      ) => {
        const dateCompare =
          secondSession.date.localeCompare(
            firstSession.date
          );

        if (dateCompare !== 0) {
          return dateCompare;
        }

        return secondSession.createdAt.localeCompare(
          firstSession.createdAt
        );
      }
    );

    const recentSession =
      sortedSessions[0] ?? null;

    const recentSessionCompletedMatches =
      recentSession
        ? countCompletedMatchesForSession(
            matches,
            recentSession.id
          )
        : 0;

    const recentSessionTotalMatches =
      recentSession
        ? countScheduledMatches(
            recentSession
          )
        : 0;

    setHomeData({
      statistics,

      hallOfFame,

      recentSession,

      recentSessionCompletedMatches,

      recentSessionTotalMatches,

      topMembers:
        rankingResult.normalRows.slice(
          0,
          5
        ),
    });

    setLoaded(true);
  }, []);

  const recentSessionStatus =
    useMemo(() => {
      if (
        !homeData.recentSession
      ) {
        return null;
      }

      if (
        homeData
          .recentSessionTotalMatches >
          0 &&
        homeData
          .recentSessionCompletedMatches >=
          homeData
            .recentSessionTotalMatches
      ) {
        return "completed";
      }

      if (
        homeData
          .recentSessionCompletedMatches >
        0
      ) {
        return "running";
      }

      return "new";
    }, [homeData]);

  const statistics =
    homeData.statistics;

  const hallOfFame =
    homeData.hallOfFame;

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
                  <CalendarDays
                    size={17}
                  />

                  Xem sessions
                </Link>
              </div>
            </div>
          </div>
        </Card>

        <section>
          <SectionTitle
            title="Tổng quan"
          />

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <DashboardMetricCard
              title="Thành viên"
              value={
                loaded
                  ? statistics.totalMembers
                  : "—"
              }
              description="Tổng thành viên"
              icon={
                <Users size={20} />
              }
              tone="brand"
            />

            <DashboardMetricCard
              title="Sessions"
              value={
                loaded
                  ? statistics.totalSessions
                  : "—"
              }
              description="Tổng buổi chơi"
              secondaryValue={
                loaded
                  ? `${statistics.normalSessionCount} Normal • ${statistics.teamSessionCount} Team`
                  : undefined
              }
              icon={
                <CalendarDays
                  size={20}
                />
              }
              tone="info"
            />

            <DashboardMetricCard
              title="Trận theo lịch"
              value={
                loaded
                  ? statistics.totalScheduledMatches
                  : "—"
              }
              description="Tổng số trận đã lên lịch"
              secondaryValue={
                loaded
                  ? `${statistics.totalSavedMatches} trận đã lưu`
                  : undefined
              }
              icon={
                <Gamepad2
                  size={20}
                />
              }
              tone="success"
            />

            <DashboardMetricCard
              title="Tổng round"
              value={
                loaded
                  ? statistics.totalRounds
                  : "—"
              }
              description="Tổng round từ mọi session"
              icon={
                <Layers3
                  size={20}
                />
              }
              tone="warning"
            />
          </div>
        </section>

        <section>
          <SectionTitle
            title="Tiến độ hệ thống"
          />

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <DashboardMetricCard
              title="Đã hoàn thành"
              value={
                loaded
                  ? statistics.completedMatchCount
                  : "—"
              }
              description="Trận đã có kết quả hợp lệ"
              secondaryValue={
                loaded
                  ? `${statistics.normalCompletedMatchCount} Normal • ${statistics.teamCompletedMatchCount} Team`
                  : undefined
              }
              icon={
                <CalendarCheck2
                  size={20}
                />
              }
              tone="success"
            />

            <DashboardMetricCard
              title="Đang chờ"
              value={
                loaded
                  ? statistics.pendingMatchCount
                  : "—"
              }
              description="Trận chưa nhập kết quả"
              icon={
                <CircleDashed
                  size={20}
                />
              }
              tone={
                statistics.pendingMatchCount >
                0
                  ? "warning"
                  : "success"
              }
            />

            <DashboardMetricCard
              title="Lịch đóng băng"
              value={
                loaded
                  ? statistics.frozenSessionCount
                  : "—"
              }
              description="Session có lịch cố định"
              secondaryValue={
                loaded &&
                statistics.unfrozenSessionCount >
                  0
                  ? `${statistics.unfrozenSessionCount} session chưa đóng băng`
                  : loaded
                    ? "Tất cả đã đóng băng"
                    : undefined
              }
              icon={
                <LockKeyhole
                  size={20}
                />
              }
              tone={
                statistics.unfrozenSessionCount >
                0
                  ? "warning"
                  : "success"
              }
            />

            <DashboardMetricCard
              title="Tiến độ"
              value={
                loaded
                  ? `${statistics.completionPercent}%`
                  : "—"
              }
              description="Tỷ lệ trận đã hoàn thành"
              secondaryValue={
                loaded
                  ? `${statistics.completedMatchCount} / ${statistics.totalScheduledMatches} trận`
                  : undefined
              }
              icon={
                <ChartNoAxesCombined
                  size={20}
                />
              }
              tone="brand"
            />
          </div>
        </section>

        <section>
          <SectionTitle
            title="Hall of Fame"
            action={
              <Link
                href="/ranking"
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600"
              >
                Xem xếp hạng

                <ChevronRight
                  size={16}
                />
              </Link>
            }
          />

          {!loaded ? (
            <Card>
              <div className="py-8 text-center text-sm text-slate-500">
                Đang tải thành tích...
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <HallOfFameCard
                title="Rating Normal"
                subtitle="Dẫn đầu chế độ Normal"
                href={getHallOfFameHref(
                  hallOfFame.normalRatingLeader
                )}
                leader={
                  hallOfFame.normalRatingLeader
                }
                valueLabel="Normal Rating"
                value={(entry) =>
                  formatRating(
                    entry.rating
                  )
                }
              />

              <HallOfFameCard
                title="Rating Team"
                subtitle="Dẫn đầu chế độ Team"
                href={getHallOfFameHref(
                  hallOfFame.teamRatingLeader
                )}
                leader={
                  hallOfFame.teamRatingLeader
                }
                valueLabel="Team Rating"
                value={(entry) =>
                  formatRating(
                    entry.rating
                  )
                }
              />

              <HallOfFameCard
                title="Nhiều trận thắng"
                subtitle="Tổng thành tích hai mode"
                href={getHallOfFameHref(
                  hallOfFame.mostWins
                )}
                leader={
                  hallOfFame.mostWins
                }
                valueLabel="Số trận thắng"
                value={(entry) =>
                  `${entry.wins} thắng`
                }
              />

              <HallOfFameCard
                title="Tỷ lệ thắng"
                subtitle={`Tối thiểu ${hallOfFame.minimumMatchesForWinRate} trận`}
                href={getHallOfFameHref(
                  hallOfFame.bestWinRate
                )}
                leader={
                  hallOfFame.bestWinRate
                }
                valueLabel="Win rate"
                value={(entry) =>
                  `${entry.winRate.toFixed(
                    1
                  )}%`
                }
              />
            </div>
          )}
        </section>

        <section>
          <SectionTitle
            title="Buổi chơi gần nhất"
            action={
              <Link
                href="/sessions"
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600"
              >
                Xem tất cả

                <ChevronRight
                  size={16}
                />
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
                      recentSessionStatus ===
                      "completed"
                        ? "success"
                        : recentSessionStatus ===
                            "running"
                          ? "warning"
                          : "info"
                    }
                  >
                    {recentSessionStatus ===
                    "completed"
                      ? "ĐÃ HOÀN THÀNH"
                      : recentSessionStatus ===
                          "running"
                        ? "ĐANG DIỄN RA"
                        : "CHƯA BẮT ĐẦU"}
                  </Badge>
                </div>
              ) : null}

              <SessionCard
                id={
                  homeData.recentSession.id
                }
                date={
                  homeData.recentSession.date
                }
                mode={
                  homeData.recentSession.mode
                }
                memberCount={
                  homeData.recentSession
                    .memberIds.length
                }
                completedMatches={
                  homeData
                    .recentSessionCompletedMatches
                }
                totalMatches={
                  homeData
                    .recentSessionTotalMatches
                }
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

                <ChevronRight
                  size={16}
                />
              </Link>
            }
          />

          <Card>
            {!loaded ? (
              <div className="py-8 text-center text-sm text-slate-500">
                Đang tải bảng xếp hạng...
              </div>
            ) : homeData.topMembers.length ===
              0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                Chưa có dữ liệu xếp hạng.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {homeData.topMembers.map(
                  (row, index) => (
                    <Link
                      key={
                        row.memberId
                      }
                      href={`/members/${row.memberId}`}
                      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex w-7 shrink-0 justify-center text-lg">
                        {getRankIcon(
                          index
                        )}
                      </div>

                      <Avatar
                        name={
                          row.memberName
                        }
                      />

                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold text-slate-900">
                          {
                            row.memberName
                          }
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          {row.wins} thắng
                          {" · "}
                          {row.matches} trận
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-slate-900">
                          {row.rating.toFixed(
                            0
                          )}
                        </div>

                        <div className="text-xs text-slate-400">
                          Rating
                        </div>
                      </div>
                    </Link>
                  )
                )}
              </div>
            )}
          </Card>
        </section>

        <section>
          <SectionTitle
            title="Truy cập nhanh"
          />

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <QuickAction
              href="/sessions/new"
              title="Tạo session"
              description="Bắt đầu buổi chơi mới"
              icon={
                <Plus size={19} />
              }
            />

            <QuickAction
              href="/members"
              title="Thành viên"
              description="Quản lý danh sách"
              icon={
                <Users size={19} />
              }
            />

            <QuickAction
              href="/ranking"
              title="Bảng xếp hạng"
              description="Xem Elo và thống kê"
              icon={
                <Trophy size={19} />
              }
            />

            <QuickAction
              href="/settings"
              title="Cài đặt"
              description="Thiết lập ứng dụng"
              icon={
                <Settings
                  size={19}
                />
              }
            />
          </div>
        </section>
      </div>
    </AppShell>
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

        <div className="mt-3 font-semibold text-slate-900">
          {title}
        </div>

        <div className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </div>
      </Card>
    </Link>
  );
}

function countCompletedMatchesForSession(
  matches: MatchRecord[],
  sessionId: string
): number {
  return matches.filter(
    (match) =>
      match.sessionId === sessionId &&
      isCompletedMatch(match)
  ).length;
}

function countScheduledMatches(
  session: SessionRecord
): number {
  const schedule =
    generateScheduleForSession(
      session
    );

  return schedule.rounds.reduce(
    (sum, round) =>
      sum +
      round.matches.length,
    0
  );
}

function isCompletedMatch(
  match: MatchRecord
): boolean {
  if (
    !Number.isFinite(
      match.scoreA
    ) ||
    !Number.isFinite(
      match.scoreB
    )
  ) {
    return false;
  }

  if (
    match.scoreA < 0 ||
    match.scoreB < 0
  ) {
    return false;
  }

  if (
    match.scoreA === 0 &&
    match.scoreB === 0
  ) {
    return false;
  }

  return (
    match.scoreA !==
    match.scoreB
  );
}

function getHallOfFameHref(
  entry: HallOfFameEntry | null
): string {
  if (!entry) {
    return "/ranking";
  }

  return `/members/${entry.memberId}`;
}

function formatRating(
  rating: number
): string {
  return Math.round(
    rating
  ).toLocaleString("vi-VN");
}

function getRankIcon(
  index: number
): string {
  if (index === 0) {
    return "🥇";
  }

  if (index === 1) {
    return "🥈";
  }

  if (index === 2) {
    return "🥉";
  }

  return `${index + 1}`;
}