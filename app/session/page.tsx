"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Plus, Users } from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import type { CreateSessionForm, Player, SessionRecord } from "@/types";
import {
  addSession,
  ensureSeedData,
  getPlayers,
  getSessions,
} from "@/lib/storage";

export default function SessionsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [openCreate, setOpenCreate] = useState(false);

  const [form, setForm] = useState<CreateSessionForm>({
    date: new Date().toISOString().slice(0, 10),
    pointToWin: 11,
    participantIds: [],
  });

  useEffect(() => {
    ensureSeedData();
    setPlayers(getPlayers());
    setSessions(getSessions());
  }, []);

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [players]);

  function refreshSessions() {
    setSessions(getSessions());
  }

  function toggleParticipant(playerId: string) {
    setForm((prev) => {
      const exists = prev.participantIds.includes(playerId);
      const nextIds = exists
        ? prev.participantIds.filter((id) => id !== playerId)
        : [...prev.participantIds, playerId];

      return {
        ...prev,
        participantIds: nextIds,
      };
    });
  }

  function handleCreateSession() {
    if (form.participantIds.length < 4) {
      alert("Cần chọn ít nhất 4 người để tạo buổi chơi.");
      return;
    }

    const created = addSession({
      date: form.date,
      pointToWin: form.pointToWin,
      participantIds: form.participantIds,
      createdAt: new Date().toISOString(),
    });

    refreshSessions();
    setOpenCreate(false);

    setForm({
      date: new Date().toISOString().slice(0, 10),
      pointToWin: 11,
      participantIds: [],
    });

    window.location.href = `/sessions/${created.id}`;
  }

  return (
    <AppShell
      title="Buổi chơi"
      subtitle="Tạo buổi chơi và chọn người tham gia"
    >
      <div className="space-y-4">
        <SectionCard
          title="Sprint 3 - Buổi chơi"
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
              <div className="text-sm text-slate-500">Tổng buổi chơi</div>
              <div className="mt-2 text-3xl font-bold">{sessions.length}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Thành viên hiện có</div>
              <div className="mt-2 text-3xl font-bold">{players.length}</div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Danh sách buổi chơi">
          {sessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <CalendarDays className="text-slate-500" size={22} />
              </div>
              <div className="text-base font-semibold">Chưa có buổi chơi</div>
              <div className="mt-1 text-sm text-slate-500">
                Hãy tạo buổi chơi đầu tiên cho nhóm pickleball của bạn.
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
              {sessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/sessions/${session.id}`}
                  className="block rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold">
                        Buổi {new Date(session.date).toLocaleDateString("vi-VN")}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        Chạm {session.pointToWin} • {session.participantIds.length} người
                      </div>
                    </div>

                    <div className="rounded-full bg-white px-3 py-1 text-xs text-slate-600">
                      Xem chi tiết
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {openCreate ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40">
          <div className="w-full rounded-t-3xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-lg font-bold">Tạo buổi chơi</div>
                <div className="text-sm text-slate-500">
                  Chọn ngày, điểm chạm đích và người tham gia
                </div>
              </div>

              <button
                onClick={() => setOpenCreate(false)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600"
              >
                Đóng
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Ngày chơi
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Điểm chạm đích
                </label>
                <select
                  value={form.pointToWin}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      pointToWin: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                >
                  <option value={11}>11</option>
                  <option value={15}>15</option>
                </select>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Users size={16} />
                  Chọn người tham gia ({form.participantIds.length})
                </div>

                <div className="max-h-72 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 p-3">
                  {sortedPlayers.map((player) => {
                    const checked = form.participantIds.includes(player.id);

                    return (
                      <label
                        key={player.id}
                        className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3"
                      >
                        <div>
                          <div className="font-medium">{player.name}</div>
                          <div className="text-xs text-slate-500">
                            {player.nickname?.trim() || "Chưa có biệt danh"}
                          </div>
                        </div>

                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleParticipant(player.id)}
                          className="h-5 w-5"
                        />
                      </label>
                    );
                  })}
                </div>

                <div className="mt-2 text-xs text-slate-500">
                  Nên chọn từ 4–8 người cho Sprint 3 bản đầu.
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpenCreate(false)}
                  className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700"
                >
                  Huỷ
                </button>

                <button
                  type="button"
                  onClick={handleCreateSession}
                  className="flex-1 rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white"
                >
                  Tạo buổi
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}