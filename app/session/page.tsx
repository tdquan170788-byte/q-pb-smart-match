"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Plus, Users, ArrowRight } from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import {
  createSession,
  ensureSeedData,
  getPlayers,
  getSessions,
} from "@/lib/storage";
import type { Player, SessionRecord } from "@/types";

export default function SessionPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [pointToWin, setPointToWin] = useState(11);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openCreate, setOpenCreate] = useState(false);

  useEffect(() => {
    ensureSeedData();
    setPlayers(getPlayers());
    setSessions(getSessions());
  }, []);

  const selectedCount = selectedIds.length;

  const canCreate = useMemo(() => {
    return date && pointToWin >= 1 && selectedIds.length >= 4;
  }, [date, pointToWin, selectedIds]);

  function togglePlayer(playerId: string) {
    setSelectedIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  }

  function handleCreateSession() {
    if (!canCreate) return;

    const session = createSession({
      date,
      pointToWin,
      participantIds: selectedIds,
    });

    setSessions(getSessions());
    setOpenCreate(false);

    // reset form
    setDate(new Date().toISOString().slice(0, 10));
    setPointToWin(11);
    setSelectedIds([]);

    // optional: có thể redirect nếu muốn
    window.location.href = `/session/${session.id}`;
  }

  return (
    <AppShell title="Session" subtitle="Tạo buổi chơi và quản lý lịch đánh">
      <div className="space-y-4">
        <SectionCard
          title="Tạo session mới"
          action={
            <button
              onClick={() => setOpenCreate((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus size={16} />
              {openCreate ? "Đóng" : "Tạo session"}
            </button>
          }
        >
          {!openCreate ? (
            <div className="text-sm text-slate-500">
              Bấm <span className="font-semibold">Tạo session</span> để chọn ngày,
              điểm chạm và người chơi.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Ngày chơi
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Điểm chạm
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={pointToWin}
                    onChange={(e) => setPointToWin(Number(e.target.value || 11))}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-700">
                    Chọn người chơi
                  </div>
                  <div className="text-sm text-slate-500">
                    Đã chọn: <span className="font-semibold">{selectedCount}</span>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {players.map((player) => {
                    const checked = selectedIds.includes(player.id);

                    return (
                      <label
                        key={player.id}
                        className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 ${
                          checked
                            ? "border-slate-900 bg-slate-50"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-slate-900">
                            {player.name}
                          </div>
                          <div className="text-sm text-slate-500">
                            {player.nickname?.trim() || "Không có nickname"}
                          </div>
                        </div>

                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePlayer(player.id)}
                          className="h-5 w-5"
                        />
                      </label>
                    );
                  })}
                </div>

                <div className="mt-2 text-sm text-slate-500">
                  Hỗ trợ tốt nhất cho <strong>5–9 người</strong>. Tối thiểu 4 người.
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleCreateSession}
                  disabled={!canCreate}
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Tạo session
                </button>
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Danh sách session">
          {sessions.length === 0 ? (
            <div className="text-sm text-slate-500">Chưa có session nào.</div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => {
                const participantCount = session.participantIds?.length ?? 0;

                return (
                  <Link
                    key={session.id}
                    href={`/session/${session.id}`}
                    className="block rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <CalendarDays size={14} />
                          {session.date}
                        </div>

                        <div className="text-lg font-bold text-slate-900">
                          Session {session.id.slice(-6)}
                        </div>

                        <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                          <div className="inline-flex items-center gap-1">
                            <Users size={14} />
                            {participantCount} người
                          </div>
                          <div>Điểm chạm: {session.pointToWin}</div>
                        </div>
                      </div>

                      <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                        Xem chi tiết
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}