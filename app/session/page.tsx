"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, CalendarDays, Users, ChevronRight, Trash2 } from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import {
  createSession,
  deleteSession,
  getPlayers,
  getSessions,
} from "@/lib/storage";

type CreateSessionPayload = {
  date: string;
  pointToWin: number;
  participantIds: string[];
};

export default function SessionPage() {
  const [openCreate, setOpenCreate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const players = useMemo(() => getPlayers(), [refreshKey]);
  const sessions = useMemo(() => getSessions(), [refreshKey]);

  const [payload, setPayload] = useState<CreateSessionPayload>({
    date: "",
    pointToWin: 21,
    participantIds: [],
  });

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  }, [sessions]);

  function toggleParticipant(playerId: string) {
    setPayload((prev) => {
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

  function resetForm() {
    setPayload({
      date: "",
      pointToWin: 21,
      participantIds: [],
    });
  }

  function handleCreateSession() {
    if (!payload.date) {
      alert("Vui lòng chọn ngày buổi chơi.");
      return;
    }

    if (payload.participantIds.length < 2) {
      alert("Cần ít nhất 2 người tham gia.");
      return;
    }

    createSession(payload);

    resetForm();
    setOpenCreate(false);
    setRefreshKey((v) => v + 1);
  }

  function handleDeleteSession(sessionId: string) {
    const ok = window.confirm("Bạn có chắc muốn xoá buổi chơi này không?");
    if (!ok) return;

    deleteSession(sessionId);
    setRefreshKey((v) => v + 1);
  }

  return (
    <AppShell
      title="Buổi chơi"
      subtitle="Tạo buổi chơi, quản lý danh sách và truy cập nhanh vào chi tiết từng session"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-slate-500">
            Tổng số buổi chơi:{" "}
            <span className="font-semibold text-slate-900">
              {sortedSessions.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setOpenCreate(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm"
          >
            <Plus size={16} />
            Tạo buổi chơi
          </button>
        </div>

        {openCreate && (
          <SectionCard title="Tạo buổi chơi mới">
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Ngày chơi
                </label>
                <input
                  type="date"
                  value={payload.date}
                  onChange={(e) =>
                    setPayload((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Điểm chạm đích
                </label>
                <input
                  type="number"
                  min={1}
                  value={payload.pointToWin}
                  onChange={(e) =>
                    setPayload((prev) => ({
                      ...prev,
                      pointToWin: Number(e.target.value) || 21,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <div className="mb-2 text-sm font-medium text-slate-700">
                  Chọn người tham gia
                </div>

                {players.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                    Chưa có thành viên nào.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {players.map((player) => {
                      const checked = payload.participantIds.includes(player.id);

                      return (
                        <label
                          key={player.id}
                          className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3 transition ${
                            checked
                              ? "border-slate-900 bg-slate-50"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {player.name}
                            </div>
                            {player.nickname ? (
                              <div className="text-xs text-slate-500">
                                {player.nickname}
                              </div>
                            ) : null}
                          </div>

                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleParticipant(player.id)}
                            className="h-4 w-4"
                          />
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setOpenCreate(false);
                  }}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Huỷ
                </button>

                <button
                  type="button"
                  onClick={handleCreateSession}
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Lưu buổi chơi
                </button>
              </div>
            </div>
          </SectionCard>
        )}

        <SectionCard title="Danh sách buổi chơi">
          {sortedSessions.length === 0 ? (
            <div className="text-sm text-slate-500">Chưa có buổi chơi nào.</div>
          ) : (
            <div className="space-y-3">
              {sortedSessions.map((session) => {
                const participantCount = session.participantIds?.length ?? 0;

                return (
                  <div
                    key={session.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <CalendarDays size={15} />
                          <span>{session.date || "Chưa có ngày"}</span>
                        </div>

                        <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                          <Users size={15} />
                          <span>{participantCount} người tham gia</span>
                        </div>

                        <div className="mt-2 text-sm text-slate-600">
                          Điểm chạm đích:{" "}
                          <span className="font-semibold text-slate-900">
                            {session.pointToWin ?? 21}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/session/${session.id}`}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
                        >
                          Chi tiết
                          <ChevronRight size={16} />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDeleteSession(session.id)}
                          className="inline-flex items-center gap-1 rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600"
                        >
                          <Trash2 size={16} />
                          Xoá
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}