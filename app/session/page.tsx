"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Plus, Trash2, Users } from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import ConfirmDialog from "@/components/confirm-dialog";
import {
  createSession,
  deleteSession,
  getPlayers,
  getSessions,
  seedPlayersIfEmpty,
} from "@/lib/storage";
import type { Player, SessionRecord } from "@/types";

type SessionFormState = {
  date: string;
  pointToWin: number;
  participantIds: string[];
};

const DEFAULT_POINT_TO_WIN = 11;

export default function SessionPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

  const [openCreate, setOpenCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SessionRecord | null>(null);

  const [form, setForm] = useState<SessionFormState>({
    date: getTodayValue(),
    pointToWin: DEFAULT_POINT_TO_WIN,
    participantIds: [],
  });

  useEffect(() => {
    seedPlayersIfEmpty();
    refreshAll();
  }, []);

  function refreshAll() {
    setPlayers(getPlayers());
    setSessions(getSessions());
  }

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [players]);

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  }, [sessions]);

  function resetCreateForm() {
    setForm({
      date: getTodayValue(),
      pointToWin: DEFAULT_POINT_TO_WIN,
      participantIds: [],
    });
  }

  function toggleParticipant(playerId: string) {
    setForm((prev) => {
      const exists = prev.participantIds.includes(playerId);

      if (exists) {
        return {
          ...prev,
          participantIds: prev.participantIds.filter((id) => id !== playerId),
        };
      }

      return {
        ...prev,
        participantIds: [...prev.participantIds, playerId],
      };
    });
  }

  function handleCreateSession() {
    const payload = {
      date: form.date,
      pointToWin: Number(form.pointToWin) || DEFAULT_POINT_TO_WIN,
      participantIds: form.participantIds,
    };

    if (!payload.date) return;
    if (payload.participantIds.length < 4) {
      alert("Cần chọn ít nhất 4 người để tạo buổi chơi.");
      return;
    }

    createSession(payload);

    setOpenCreate(false);
    resetCreateForm();
    refreshAll();
  }

  function handleDeleteSession() {
    if (!deleteTarget) return;
    deleteSession(deleteTarget.id);
    setDeleteTarget(null);
    refreshAll();
  }

  return (
    <AppShell
      title="Buổi chơi"
      subtitle="Tạo session và chọn người tham gia"
    >
      <div className="space-y-4">
        <SectionCard
          title="Tổng quan session"
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
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Số buổi chơi</div>
              <div className="mt-2 text-3xl font-bold">{sessions.length}</div>
              <div className="mt-1 text-xs text-slate-400">
                Lưu cục bộ trên máy hiện tại
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Người chơi khả dụng</div>
              <div className="mt-2 text-3xl font-bold">{players.length}</div>
              <div className="mt-1 text-xs text-slate-400">
                Dùng để chọn vào session
              </div>
            </div>
          </div>

          <button
            onClick={() => setOpenCreate(true)}
            className="mt-4 w-full rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white"
          >
            + Tạo buổi chơi mới
          </button>
        </SectionCard>

        <SectionCard title="Danh sách session">
          {sortedSessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
              <div className="text-base font-semibold">Chưa có session nào</div>
              <div className="mt-1 text-sm text-slate-500">
                Hãy tạo buổi chơi đầu tiên và chọn người tham gia.
              </div>
              <button
                onClick={() => setOpenCreate(true)}
                className="mt-4 rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white"
              >
                Tạo session đầu tiên
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedSessions.map((session, index) => {
                const participantCount = session.participantIds?.length ?? 0;

                return (
                  <div
                    key={session.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                            {index + 1}
                          </div>
                          <div>
                            <div className="text-base font-semibold">
                              Session {session.date}
                            </div>
                            <div className="text-sm text-slate-500">
                              Điểm chạm: {session.pointToWin}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-white px-3 py-1 text-slate-600">
                            {participantCount} người tham gia
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-slate-600">
                            Tạo lúc: {formatDateTime(session.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => setDeleteTarget(session)}
                          className="rounded-xl border border-red-200 bg-white p-2 text-red-600"
                          aria-label={`Xóa session ${session.date}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Ghi chú Sprint 6A">
          <div className="space-y-2 text-sm text-slate-600">
            <div>• Một session cần tối thiểu 4 người chơi.</div>
            <div>• Session hiện lưu ngày, điểm chạm và danh sách người tham gia.</div>
            <div>• Sprint tiếp theo sẽ sinh lịch đấu từ session này.</div>
          </div>
        </SectionCard>
      </div>

      {/* CREATE SESSION SHEET */}
      {openCreate && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/30">
          <div className="w-full rounded-t-3xl bg-white p-4 shadow-2xl">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" />

            <div className="mb-4">
              <div className="text-lg font-bold">Tạo buổi chơi</div>
              <div className="text-sm text-slate-500">
                Chọn ngày, điểm chạm và người tham gia
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Ngày chơi
                </label>
                <div className="relative">
                  <CalendarDays
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, date: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-200 px-10 py-3 outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Điểm chạm
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.pointToWin}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      pointToWin: Number(e.target.value) || DEFAULT_POINT_TO_WIN,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Users size={16} />
                  Chọn người tham gia ({form.participantIds.length})
                </div>

                <div className="max-h-72 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 p-2">
                  {sortedPlayers.length === 0 ? (
                    <div className="p-3 text-sm text-slate-500">
                      Chưa có thành viên nào. Hãy thêm thành viên trước.
                    </div>
                  ) : (
                    sortedPlayers.map((player) => {
                      const checked = form.participantIds.includes(player.id);

                      return (
                        <label
                          key={player.id}
                          className="flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleParticipant(player.id)}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                          <div className="min-w-0">
                            <div className="font-medium text-slate-900">
                              {player.name}
                            </div>
                            <div className="text-sm text-slate-500">
                              {player.nickname?.trim()
                                ? player.nickname
                                : "Chưa có biệt danh"}
                            </div>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>

                <div className="mt-2 text-xs text-slate-400">
                  Cần tối thiểu 4 người để tạo buổi chơi.
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-3">
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
                Tạo session
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xoá session?"
        description={
          deleteTarget
            ? `Bạn có chắc muốn xoá session ngày ${deleteTarget.date} không?`
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

function getTodayValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateTime(value?: string) {
  if (!value) return "--";
  try {
    return new Date(value).toLocaleString("vi-VN");
  } catch {
    return value;
  }
}