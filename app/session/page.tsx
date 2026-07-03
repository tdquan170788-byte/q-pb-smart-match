"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Trash2 } from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import ConfirmDialog from "@/components/confirm-dialog";
import type { Player, SessionRecord } from "@/types";
import {
  createSession,
  deleteSession,
  ensureSeedPlayers,
  getPlayers,
  getSessions,
} from "@/lib/storage";

export default function SessionPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [pointToWin, setPointToWin] = useState(11);
  const [deleteTarget, setDeleteTarget] = useState<SessionRecord | null>(null);

  useEffect(() => {
    ensureSeedPlayers();
    setPlayers(getPlayers());
    setSessions(getSessions());
  }, []);

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
    if (selectedIds.length < 4) {
      alert("Cần chọn ít nhất 4 người để tạo buổi chơi.");
      return;
    }

    createSession({
      date,
      pointToWin,
      participantIds: selectedIds,
    });

    setSelectedIds([]);
    refreshSessions();
  }

  function handleDeleteSession() {
    if (!deleteTarget) return;
    deleteSession(deleteTarget.id);
    refreshSessions();
    setDeleteTarget(null);
  }

  const selectedPlayers = useMemo(() => {
    return players.filter((player) => selectedIds.includes(player.id));
  }, [players, selectedIds]);

  return (
    <AppShell
      title="Session"
      subtitle="Tạo buổi chơi và chọn người tham gia"
    >
      <div className="space-y-4">
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
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Điểm thắng
              </label>
              <input
                type="number"
                min={1}
                value={pointToWin}
                onChange={(e) => setPointToWin(Number(e.target.value) || 11)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <div className="mb-2 text-sm font-medium text-slate-700">
                Chọn người tham gia ({selectedIds.length})
              </div>

              <div className="grid grid-cols-2 gap-2">
                {players.map((player) => {
                  const active = selectedIds.includes(player.id);

                  return (
                    <button
                      key={player.id}
                      onClick={() => togglePlayer(player.id)}
                      className={`rounded-2xl border px-3 py-3 text-left transition ${
                        active
                          ? "border-brand-600 bg-brand-50 text-brand-700"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      <div className="font-semibold">{player.name}</div>
                      <div className="text-xs text-slate-500">
                        {player.nickname?.trim() || "Chưa có biệt danh"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm font-medium text-slate-700">
                Đã chọn
              </div>
              {selectedPlayers.length === 0 ? (
                <div className="mt-2 text-sm text-slate-500">
                  Chưa chọn người chơi nào.
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedPlayers.map((player) => (
                    <span
                      key={player.id}
                      className="rounded-full bg-white px-3 py-2 text-sm text-slate-700"
                    >
                      {player.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleCreateSession}
              className="w-full rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white"
            >
              Tạo buổi chơi
            </button>
          </div>
        </SectionCard>

        <SectionCard title="Lịch sử session">
          {sessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <CalendarDays className="text-slate-500" size={22} />
              </div>
              <div className="text-base font-semibold">Chưa có session nào</div>
              <div className="mt-1 text-sm text-slate-500">
                Hãy tạo buổi chơi đầu tiên cho nhóm của bạn.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => {
                const participantNames = players
                  .filter((player) => session.participantIds.includes(player.id))
                  .map((player) => player.name);

                return (
                  <div
                    key={session.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-base font-semibold">
                          Session {session.date}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          Điểm thắng: {session.pointToWin}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {participantNames.map((name) => (
                            <span
                              key={name}
                              className="rounded-full bg-white px-3 py-1 text-xs text-slate-700"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
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
        description="Thao tác này sẽ xoá buổi chơi đã chọn."
        confirmText="Xoá"
        cancelText="Huỷ"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteSession}
      />
    </AppShell>
  );
}