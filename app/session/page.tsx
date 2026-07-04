"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Plus, Trash2, Users } from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import ConfirmDialog from "@/components/confirm-dialog";
import {
  createSession,
  deleteSession,
  ensureSeedData,
  getPlayers,
  getSessions,
} from "@/lib/storage";
import type { SessionRecord } from "@/types";

type CreateSessionForm = {
  date: string;
  pointToWin: number;
  participantIds: string[];
};

function todayInputValue() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = `${now.getMonth() + 1}`.padStart(2, "0");
  const dd = `${now.getDate()}`.padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function SessionPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SessionRecord | null>(null);

  const [date, setDate] = useState(todayInputValue());
  const [pointToWin, setPointToWin] = useState(11);
  const [participantIds, setParticipantIds] = useState<string[]>([]);

  useEffect(() => {
    ensureSeedData();
    refreshSessions();
  }, []);

  const players = useMemo(() => getPlayers(), []);
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  }, [sessions]);

  function refreshSessions() {
    setSessions(getSessions());
  }

  function toggleParticipant(playerId: string) {
    setParticipantIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  }

  function resetCreateForm() {
    setDate(todayInputValue());
    setPointToWin(11);
    setParticipantIds([]);
  }

  function handleCreateSession() {
    if (!date) return;
    if (participantIds.length < 4) {
      alert("Cần chọn ít nhất 4 người để tạo buổi chơi.");
      return;
    }

    const payload: CreateSessionForm = {
      date,
      pointToWin,
      participantIds,
    };

    createSession({
      ...payload,
      createdAt: new Date().toISOString(),
    });

    setOpenCreate(false);
    resetCreateForm();
    refreshSessions();
  }

  function handleDeleteSession() {
    if (!deleteTarget) return;
    deleteSession(deleteTarget.id);
    setDeleteTarget(null);
    refreshSessions();
  }

  function getParticipantNames(ids: string[]) {
    return ids
      .map((id) => players.find((p) => p.id === id)?.name ?? "Unknown")
      .join(", ");
  }

  return (
    <AppShell title="Buổi chơi" subtitle="Tạo và quản lý session pickleball">
      <div className="space-y-4">
        <SectionCard
          title="Danh sách buổi chơi"
          action={
            <button
              onClick={() => setOpenCreate(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white"
            >
              <Plus size={16} />
              Tạo buổi
            </button>
          }
        >
          {sortedSessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <CalendarDays className="text-slate-500" size={22} />
              </div>
              <div className="text-base font-semibold">Chưa có buổi chơi</div>
              <div className="mt-1 text-sm text-slate-500">
                Tạo buổi chơi đầu tiên để bắt đầu xếp cặp.
              </div>
              <button
                onClick={() => setOpenCreate(true)}
                className="mt-4 rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white"
              >
                Tạo buổi đầu tiên
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedSessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/session/${session.id}`} className="min-w-0 flex-1">
                      <div className="text-base font-semibold">
                        {new Date(session.date).toLocaleDateString("vi-VN")}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        Chạm để xem chi tiết buổi chơi
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-white px-3 py-1 text-slate-600">
                          Chạm đích: {session.pointToWin}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-slate-600">
                          Người chơi: {session.participantIds.length}
                        </span>
                      </div>

                      <div className="mt-3 text-xs text-slate-500">
                        {getParticipantNames(session.participantIds)}
                      </div>
                    </Link>

                    <button
                      onClick={() => setDeleteTarget(session)}
                      className="rounded-xl border border-red-200 bg-white p-2 text-red-600"
                      aria-label="Xoá buổi chơi"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {openCreate && (
          <SectionCard title="Tạo buổi chơi mới">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Ngày chơi
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Chạm đích
                </label>
                <select
                  value={pointToWin}
                  onChange={(e) => setPointToWin(Number(e.target.value))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                >
                  <option value={11}>11</option>
                  <option value={15}>15</option>
                  <option value={21}>21</option>
                </select>
              </div>

              <div>
                <div className="mb-2 text-sm font-medium text-slate-700">
                  Chọn người tham gia ({participantIds.length})
                </div>

                <div className="space-y-2">
                  {players.map((player) => {
                    const checked = participantIds.includes(player.id);

                    return (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => toggleParticipant(player.id)}
                        className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left ${
                          checked
                            ? "border-brand-600 bg-brand-50"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div>
                          <div className="font-medium">{player.name}</div>
                          <div className="text-sm text-slate-500">
                            {player.nickname?.trim()
                              ? `Biệt danh: ${player.nickname}`
                              : "Chưa có biệt danh"}
                          </div>
                        </div>

                        <div
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            checked
                              ? "bg-brand-600 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {checked ? "Đã chọn" : "Chọn"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setOpenCreate(false);
                    resetCreateForm();
                  }}
                  className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700"
                >
                  Huỷ
                </button>

                <button
                  onClick={handleCreateSession}
                  className="flex-1 rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white"
                >
                  Lưu buổi chơi
                </button>
              </div>
            </div>
          </SectionCard>
        )}

        <SectionCard title="Ghi chú Sprint 5 – Phase 1">
          <div className="space-y-2 text-sm text-slate-600">
            <div>• Đã có danh sách buổi chơi và màn hình chi tiết từng buổi.</div>
            <div>• Đã có lịch sử session và thống kê cơ bản theo người chơi.</div>
            <div>• Phase tiếp theo sẽ là xếp cặp tự động cho từng round.</div>
          </div>
        </SectionCard>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xoá buổi chơi?"
        description={
          deleteTarget
            ? `Bạn có chắc muốn xoá buổi chơi ngày ${new Date(
                deleteTarget.date
              ).toLocaleDateString("vi-VN")} không?`
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