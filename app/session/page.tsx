"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Plus, Users, Save, X } from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";

import type { CreateMatchInput, CreateSessionInput, ScheduledMatch } from "@/types";
import { generateSchedule } from "@/lib/scheduler";
import {
  createMatch,
  createSession,
  getPlayers,
  getSessions,
} from "@/lib/storage";

type CreateSessionForm = {
  date: string;
  pointToWin: number;
  participantIds: string[];
};

export default function SessionPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const players = useMemo(() => getPlayers(), [refreshKey]);
  const sessions = useMemo(() => getSessions(), [refreshKey]);

  const [openCreate, setOpenCreate] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");

  const [form, setForm] = useState<CreateSessionForm>({
    date: new Date().toISOString().slice(0, 10),
    pointToWin: 11,
    participantIds: [],
  });

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId]
  );

  const scheduledMatches = useMemo<ScheduledMatch[]>(() => {
    if (!selectedSession) return [];
    return generateSchedule(selectedSession.participantIds ?? []);
  }, [selectedSession]);

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
    if (!form.date) {
      alert("Vui lòng chọn ngày buổi chơi.");
      return;
    }

    if (form.participantIds.length < 4) {
      alert("Cần ít nhất 4 người để tạo buổi chơi.");
      return;
    }

    const payload: CreateSessionInput = {
      date: form.date,
      pointToWin: Number(form.pointToWin) || 11,
      participantIds: form.participantIds,
    };

    createSession(payload);

    setOpenCreate(false);
    setForm({
      date: new Date().toISOString().slice(0, 10),
      pointToWin: 11,
      participantIds: [],
    });
    setRefreshKey((v) => v + 1);
  }

  function getPlayerName(playerId: string) {
    return players.find((p) => p.id === playerId)?.name ?? "Ẩn danh";
  }

  function saveSuggestedMatch(match: ScheduledMatch) {
    if (!selectedSession) return;

    const payload: CreateMatchInput = {
      sessionId: selectedSession.id,
      round: match.round,
      court: match.court,
      teamA: {
        playerIds: match.teamA,
      },
      teamB: {
        playerIds: match.teamB,
      },
      scoreA: 0,
      scoreB: 0,
    };

    createMatch(payload);
    alert(`Đã lưu trận Round ${match.round} - Sân ${match.court}`);
    setRefreshKey((v) => v + 1);
  }

  return (
    <AppShell
      title="Session"
      subtitle="Tạo buổi chơi và xem lịch ghép trận cơ bản"
    >
      <div className="space-y-4">
        <SectionCard
          title="Buổi chơi"
          action={
            <button
              onClick={() => setOpenCreate((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white"
            >
              {openCreate ? <X size={16} /> : <Plus size={16} />}
              {openCreate ? "Đóng" : "Tạo session"}
            </button>
          }
        >
          {!openCreate ? (
            <div className="text-sm text-slate-500">
              Nhấn <b>Tạo session</b> để thêm buổi chơi mới.
            </div>
          ) : (
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
                  Điểm chạm
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
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                />
              </div>

              <div>
                <div className="mb-2 text-sm font-medium text-slate-700">
                  Chọn người tham gia ({form.participantIds.length})
                </div>

                <div className="flex flex-wrap gap-2">
                  {players.map((player) => {
                    const active = form.participantIds.includes(player.id);

                    return (
                      <button
                        key={player.id}
                        onClick={() => toggleParticipant(player.id)}
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
              </div>

              <button
                onClick={handleCreateSession}
                className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white"
              >
                Lưu session
              </button>
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
                const active = selectedSessionId === session.id;

                return (
                  <button
                    key={session.id}
                    onClick={() => setSelectedSessionId(session.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-base font-semibold text-slate-900">
                        {session.date}
                      </div>
                      <div className="text-sm text-slate-500">
                        {session.pointToWin} điểm
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                      <div className="inline-flex items-center gap-2">
                        <Users size={16} />
                        {participantCount} người
                      </div>
                      <div className="inline-flex items-center gap-2">
                        <CalendarDays size={16} />
                        Session ID: {session.id.slice(0, 8)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Lịch đề xuất">
          {!selectedSession ? (
            <div className="text-sm text-slate-500">
              Hãy chọn 1 session ở trên để xem lịch ghép trận.
            </div>
          ) : scheduledMatches.length === 0 ? (
            <div className="text-sm text-slate-500">
              Session này chưa đủ dữ liệu để sinh lịch.
            </div>
          ) : (
            <div className="space-y-3">
              {scheduledMatches.map((match, idx) => (
                <div
                  key={`${match.round}-${match.court}-${idx}`}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm text-slate-500">
                        Round {match.round} · Sân {match.court}
                      </div>
                      <div className="mt-1 text-base font-semibold text-slate-900">
                        {match.teamA.map(getPlayerName).join(" / ")}{" "}
                        <span className="mx-2 text-slate-400">vs</span>{" "}
                        {match.teamB.map(getPlayerName).join(" / ")}
                      </div>
                    </div>

                    <button
                      onClick={() => saveSuggestedMatch(match)}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white"
                    >
                      <Save size={16} />
                      Lưu trận
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}