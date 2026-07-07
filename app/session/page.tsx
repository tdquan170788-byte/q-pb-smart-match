"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Plus, Users } from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import type { Player, SessionRecord } from "@/types";
import {
  createSession,
  getPlayers,
  getSessions,
  seedPlayersIfEmpty,
} from "@/lib/storage";

type CreateSessionForm = {
  date: string;
  pointToWin: number;
  participantIds: string[];
};

export default function SessionPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [pointToWin, setPointToWin] = useState(11);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openCreate, setOpenCreate] = useState(false);

  useEffect(() => {
    seedPlayersIfEmpty();
    setPlayers(getPlayers());
    setSessions(getSessions());
  }, []);

  const selectedPlayers = useMemo(
    () => players.filter((p) => selectedIds.includes(p.id)),
    [players, selectedIds]
  );

  function refreshSessions() {
    setSessions(getSessions());
  }

  function togglePlayer(playerId: string) {
    setSelectedIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  }

  function handleCreateSession() {
    const payload: CreateSessionForm = {
      date,
      pointToWin,
      participantIds: selectedIds,
    };

    if (!payload.date) return;
    if (payload.participantIds.length < 4) return;

    createSession(payload);

    refreshSessions();
    setOpenCreate(false);

    // reset nhẹ
    setSelectedIds([]);
    setPointToWin(11);
    setDate(new Date().toISOString().slice(0, 10));
  }

  return (
    <AppShell
      title="Buổi chơi"
      subtitle="Tạo buổi chơi và chọn danh sách người tham gia"
    >
      <div className="space-y-4">
        <SectionCard
          title="Tổng quan"
          action={
            <button
              onClick={() => setOpenCreate((v) => !v)}
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white"
            >
              <Plus size={16} />
              {openCreate ? "Đóng" : "Tạo buổi"}
            </button>
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Số buổi đã tạo</div>
              <div className="mt-2 text-3xl font-bold">{sessions.length}</div>
              <div className="mt-1 text-xs text-slate-400">
                Lưu trong localStorage
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Tổng thành viên</div>
              <div className="mt-2 text-3xl font-bold">{players.length}</div>
              <div className="mt-1 text-xs text-slate-400">
                Có thể chọn để tham gia buổi chơi
              </div>
            </div>
          </div>
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
                  Điểm chạm
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
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700">
                    Chọn người tham gia
                  </label>
                  <span className="text-xs text-slate-500">
                    Đã chọn: {selectedIds.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {players.map((player) => {
                    const checked = selectedIds.includes(player.id);

                    return (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => togglePlayer(player.id)}
                        className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left ${
                          checked
                            ? "border-brand-500 bg-brand-50"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div>
                          <div className="font-medium text-slate-900">
                            {player.name}
                          </div>
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

              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                Cần ít nhất <span className="font-semibold">4 người</span> để tạo
                buổi chơi.
              </div>

              <button
                onClick={handleCreateSession}
                disabled={selectedIds.length < 4}
                className="w-full rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Tạo buổi chơi
              </button>
            </div>
          </SectionCard>
        )}

        <SectionCard title="Người chơi đang chọn">
          {selectedPlayers.length === 0 ? (
            <div className="text-sm text-slate-500">
              Chưa chọn ai cho buổi chơi.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedPlayers.map((player) => (
                <span
                  key={player.id}
                  className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700"
                >
                  {player.name}
                </span>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Danh sách buổi chơi">
          {sessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <CalendarDays className="text-slate-500" size={22} />
              </div>
              <div className="text-base font-semibold">Chưa có buổi chơi nào</div>
              <div className="mt-1 text-sm text-slate-500">
                Hãy tạo buổi chơi đầu tiên để bắt đầu lên lịch đấu.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => {
                const participantCount = session.participantIds?.length ?? 0;

                return (
                  <div
                    key={session.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-base font-semibold text-slate-900">
                          {session.date || "Không có ngày"}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          Chạm {session.pointToWin} điểm
                        </div>
                      </div>

                      <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {participantCount} người
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                      <Users size={16} />
                      Người tham gia: {participantCount}
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