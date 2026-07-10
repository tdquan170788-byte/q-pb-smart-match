"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Plus, Trash2 } from "lucide-react";

import AppShell from "@/components/app-shell";
import ConfirmDialog from "@/components/confirm-dialog";
import SectionCard from "@/components/section-card";

import type { MatchRecord, SessionRecord } from "@/types";
import {
  deleteSession,
  ensureSeedData,
  getMatches,
  getSessions,
} from "@/lib/storage";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<SessionRecord | null>(null);

  useEffect(() => {
    ensureSeedData();
    refreshData();
  }, []);

  function refreshData() {
    setSessions(getSessions());
    setMatches(getMatches());
  }

  function handleDeleteSession() {
    if (!deleteTarget) return;

    deleteSession(deleteTarget.id);
    setDeleteTarget(null);
    refreshData();
  }

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [sessions]);

  function getMatchCount(sessionId: string) {
    return matches.filter((match) => match.sessionId === sessionId).length;
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
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white"
            >
              <Plus size={16} />
              Tạo mới
            </Link>
          }
        >
          {sortedSessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <CalendarDays className="text-slate-500" size={22} />
              </div>

              <div className="text-base font-semibold">Chưa có session</div>

              <div className="mt-1 text-sm text-slate-500">
                Hãy tạo buổi chơi đầu tiên để bắt đầu xếp lịch và nhập điểm.
              </div>

              <Link
                href="/sessions/new"
                className="mt-4 inline-flex rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white"
              >
                Tạo session đầu tiên
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedSessions.map((session) => {
                const matchCount = getMatchCount(session.id);

                return (
                  <div
                    key={session.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={`/sessions/${session.id}`}
                        className="min-w-0 flex-1"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100">
                            <CalendarDays
                              className="text-brand-700"
                              size={18}
                            />
                          </div>

                          <div>
                            <div className="text-base font-semibold text-slate-900">
                              Session{" "}
                              {new Date(session.date).toLocaleDateString(
                                "vi-VN"
                              )}
                            </div>

                            <div className="mt-1 text-sm text-slate-500">
                              Mode:{" "}
                              <span className="font-medium text-slate-700">
                                {session.mode ?? "normal"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                          <div className="rounded-xl bg-white px-3 py-2 text-slate-600">
                            <div className="text-slate-400">Thành viên</div>
                            <div className="mt-1 font-semibold text-slate-900">
                              {session.memberIds.length}
                            </div>
                          </div>

                          <div className="rounded-xl bg-white px-3 py-2 text-slate-600">
                            <div className="text-slate-400">Trận đã lưu</div>
                            <div className="mt-1 font-semibold text-slate-900">
                              {matchCount}
                            </div>
                          </div>

                          <div className="rounded-xl bg-white px-3 py-2 text-slate-600">
                            <div className="text-slate-400">Số sân</div>
                            <div className="mt-1 font-semibold text-slate-900">
                              {session.courtCount ?? 1}
                            </div>
                          </div>
                        </div>
                      </Link>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(session)}
                        className="rounded-xl border border-red-200 bg-white p-2 text-red-600"
                        aria-label="Xoá session"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xoá session?"
        description={
          deleteTarget
            ? `Bạn có chắc muốn xoá session ngày ${new Date(
                deleteTarget.date
              ).toLocaleDateString(
                "vi-VN"
              )}? Các trận đã nhập trong session này cũng sẽ bị xoá.`
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