"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Plus, Users, Sparkles } from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import {
  createSession,
  getPlayers,
  getSessions,
  seedPlayersIfEmpty,
} from "@/lib/storage";
import { generateSchedule } from "@/lib/scheduler";
import type { SessionRecord } from "@/types";

type CreateSessionForm = {
  date: string;
  pointToWin: number;
  participantIds: string[];
};

export default function SessionPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [openCreate, setOpenCreate] = useState(false);

  useMemo(() => {
    seedPlayersIfEmpty();
  }, []);

  const players = useMemo(() => getPlayers(), [refreshKey]);
  const sessions = useMemo(() => getSessions(), [refreshKey]);

  const [form, setForm] = useState<CreateSessionForm>({
    date: new Date().toISOString().slice(0, 10),
    pointToWin: 11,
    participantIds: [],
  });

  const previewSchedule = useMemo(() => {
    return generateSchedule(form.participantIds);
  }, [form.participantIds]);

  const handleToggleParticipant = (playerId: string) => {
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
  };

  const handleCreateSession = () => {
    if (!form.date) {
      alert("Vui lòng chọn ngày chơi.");
      return;
    }

    if (form.participantIds.length < 4) {
      alert("Cần ít nhất 4 người để tạo lịch.");
      return;
    }

    createSession({
      date: form.date,
      pointToWin: form.pointToWin,
      participantIds: form.participantIds,
      createdAt: new Date().toISOString(),
    });

    setOpenCreate(false);
    setForm({
      date: new Date().toISOString().slice(0, 10),
      pointToWin: 11,
      participantIds: [],
    });
    setRefreshKey((v) => v + 1);
  };

  return (
    <AppShell
      title="Session"
      subtitle="Tạo buổi chơi và xem lịch ghép trận thông minh"
    >
      <div className="space-y-4">
        <SectionCard title="Tạo buổi chơi">
          {!openCreate ? (
            <button
              onClick={() => setOpenCreate(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
            >
              <Plus size={16} />
              Tạo session mới
            </button>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Ngày chơi
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, date: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Điểm chạm đích
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.pointToWin}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        pointToWin: Number(e.target.value) || 11,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Users size={16} />
                  <div className="text-sm font-semibold">Chọn người tham gia</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {players.map((player) => {
                    const active = form.participantIds.includes(player.id);

                    return (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => handleToggleParticipant(player.id)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                          active
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {player.name}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 text-sm text-slate-500">
                  Đã chọn: <strong>{form.participantIds.length}</strong> người
                </div>
              </div>

              <SectionCard title="Preview lịch đấu">
                {form.participantIds.length < 4 ? (
                  <div className="text-sm text-slate-500">
                    Chọn ít nhất 4 người để xem lịch đấu.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
                      <div className="font-semibold">Scheduler Sprint 6B</div>
                      <div className="mt-1">
                        {form.participantIds.length} người → sinh{" "}
                        <strong>{previewSchedule.length} round</strong>.
                      </div>
                    </div>

                    {previewSchedule.map((match) => (
                      <div
                        key={`${match.round}-${match.court}`}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="text-sm font-semibold text-slate-900">
                          Round {match.round} · Court {match.court}
                        </div>

                        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-sm">
                          <div className="rounded-xl bg-slate-50 p-3 text-center font-medium">
                            {match.teamA.join(" + ")}
                          </div>

                          <div className="text-slate-400">vs</div>

                          <div className="rounded-xl bg-slate-50 p-3 text-center font-medium">
                            {match.teamB.join(" + ")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <div className="flex gap-3">
                <button
                  onClick={handleCreateSession}
                  className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
                >
                  Lưu session
                </button>

                <button
                  onClick={() => setOpenCreate(false)}
                  className="rounded-2xl bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Danh sách session đã tạo">
          {sessions.length === 0 ? (
            <div className="text-sm text-slate-500">Chưa có session nào.</div>
          ) : (
            <div className="space-y-3">
              {sessions
                .slice()
                .reverse()
                .map((session: SessionRecord) => {
                  const participantCount = session.participantIds?.length ?? 0;
                  const schedule = generateSchedule(session.participantIds ?? []);

                  return (
                    <div
                      key={session.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
                            <CalendarDays size={16} />
                            {session.date}
                          </div>

                          <div className="mt-2 text-sm text-slate-600">
                            {participantCount} người · Chạm {session.pointToWin}
                          </div>
                        </div>

                        <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          {schedule.length} round
                        </div>
                      </div>

                      <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                        <div className="flex items-center gap-2 font-medium text-slate-800">
                          <Sparkles size={14} />
                          Người tham gia
                        </div>

                        <div className="mt-2">
                          {session.participantIds
                            .map((id) => players.find((p) => p.id === id)?.name || id)
                            .join(", ")}
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