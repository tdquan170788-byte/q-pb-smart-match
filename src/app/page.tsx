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
        second