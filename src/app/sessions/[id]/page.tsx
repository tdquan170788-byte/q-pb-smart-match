"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import {
  BarChart3,
  CheckCircle2,
  Lock,
  Star,
} from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";

import ScheduleMemberAnalytics from "@/components/sessions/schedule-member-analytics";
import SchedulePairAnalytics from "@/components/sessions/schedule-pair-analytics";
import SessionInsightsCard from "@/components/sessions/session-insights-card";
import SessionMatchCard from "@/components/sessions/session-match-card";
import SessionProgressCard from "@/components/sessions/session-progress-card";
import TeamSessionSummaryCard from "@/components/sessions/team-session-summary-card";

import Badge from "@/components/ui/badge";
import Progress from "@/components/ui/progress";

import type {
  GeneratedSchedule,
  MatchRecord,
  Member,
  ScheduleQualityReport,
  SessionRecord,
} from "@/types";

import {
  ensureSeedData,
  getMatchesBySessionId,
 