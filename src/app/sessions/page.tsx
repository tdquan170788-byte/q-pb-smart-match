"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Plus, Trash2 } from "lucide-react";

import AppShell from "@/components/app-shell";
import ConfirmDialog from "@/components/confirm-dialog";
import SectionCard from "@/components/section-card";
import SessionCard from "@/components/sessions/session-card";
import EmptyState from "@/components/ui/empty-state";

import type { MatchRecord, SessionRecord } from "@/types";

import {
  deleteSession,
  ensureSeedData,
  getMatches,
  getSessions,
} from "@/lib/storage";

import { generateScheduleForSession } from "@/lib/session";

type SessionProgress = {
  session: SessionRecord;
  completedMatches: number;
  totalMatches: number;
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<SessionRecord | null>(null);

  useEffect(() => {
    ensureSeedData();
    refreshData();
    setLoaded(true);
  }, []);

  function refreshData(): void {
    setSessions(getSessions());
    setMatches(getMatches());
  }

  const matchCountBySessionId = useMemo(() => {
    const result = new Map<string, number>();

    for (const match of matches) {
      result.set(
        match.sessionId,
        (result.get(match.sessionId) ?? 0) + 1
      );
    }

    return result;
  }, [matches]);

  const sessionProgressItems = useMemo<SessionProgress[]>(() => {
    return sessions
      .map((session) => {
        const schedule = generateScheduleForSession(session);

        const totalMatches = schedule.rounds.reduce(
          (sum, round) => sum + round.matches.length,
          0
        );

        const completedMatches =
          matchCountBySessionId.get(session.id) ?? 0;

        return {
          session,
          completedMatches,
          totalMatches,
        };
      })
      .sort((a, b) => {
        const dateCompare = b.session.date.localeCompare(a.session.date);

        if (dateCompare !== 0) {
          return dateCompare;
        }

        return b.session.createdAt.localeCompare(a.session.createdAt);
      });
  }, [sessions, matchCountBySessionId]);

  function handleDeleteSession(): void {
    if (!deleteTarget) {
      return;
    }

    deleteSession(deleteTarget.id);
    setDeleteTarget(null);
    refreshData();
  }

  return (
    <AppShell
      title="Sessions"
      subtitle="Quản lý các buổi chơi và nhập kết quả"
    >
      <div className="space-y-4">
        <SectionCard
          title="Danh sách session"
          action={
            <Link
              href="/sessions/new"
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Plus size={16} />
              Tạo mới
            </Link>
          }
        >
          {!loaded ? (
            <div className="py-10 text-center text-sm text-slate-500">
              Đang tải danh sách session...
            </div>
          ) : sessionProgressItems.length === 0 ? (
            <EmptyState
              icon="🎾"
              title="Chưa có session"
              description="Hãy tạo buổi chơi đầu tiên để bắt đầu xếp lịch và nhập kết quả."
            />

          ) : (
            <div className="space-y-4">
              {sessionProgressItems.map(
                ({ session, completedMatches, totalMatches }) => (
                  <div key={session.id} className="space-y-2">
                    <SessionCard
                      id={session.id}
                      date={session.date}
                      mode={session.mode}
                      memberCount={session.memberIds.length}
                      completedMatches={completedMatches}
                      totalMatches={totalMatches}
                    />

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(session)}
                        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 size={15} />
                        Xoá session
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Thông tin">
          <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <CalendarDays size={18} />
            </div>

            <div className="text-sm text-slate-600">
              <div className="font-semibold text-slate-900">
                Theo dõi tiến độ buổi chơi
              </div>

              <div className="mt-1">
                Tiến độ được tính từ số trận đã lưu kết quả so với tổng số trận
                trong lịch thi đấu.
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Xoá session?"
        description={
          deleteTarget
            ? `Bạn có chắc muốn xoá session ngày ${formatSessionDate(
                deleteTarget.date
              )}? Toàn bộ kết quả của session này cũng sẽ bị xoá.`
            : ""
        }
        confirmText="Xoá"
        cancelText="Huỷ"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteSession}
      />
    </AppShell>
  );
}

function formatSessionDate(date: string): string {
  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("vi-VN");
}
