"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Plus,
  Users,
  ChevronRight,
  Swords,
  Trash2,
} from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import type { Player, SessionRecord } from "@/types";
import {
  createSession,
  getPlayers,
  getSessions,
  saveMatches,
  seedPlayersIfEmpty,
} from "@/lib/storage";
import { generateSchedule } from "@/lib/scheduler";

type CreateSessionForm = {
  date: string;
  pointToWin: number;
  participantIds: string[];
};

export default function SessionPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [openCreate, setOpenCreate] = useState(false);

  const [form, setForm] = useState<CreateSessionForm>({
    date: "",
    pointToWin: 11,
    participantIds: [],
  });

  useEffect(() => {
    seedPlayersIfEmpty();
    setPlayers(getPlayers());
    setSessions(getSessions());
  }, []);

  const playerMap = useMemo(() => {
    return new Map(players.map((p) => [p.id, p]));
  }, [players]);

  function refreshSessions() {
    setSessions(getSessions());
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

  function resetForm() {
    setForm({
      date: "",
      pointToWin: 11,
      participantIds: [],
    });
  }

  function handleCreateSession() {
    const date = form.date.trim();
    const pointToWin = Number(form.pointToWin || 11);
    const participantIds = form.participantIds;

    if (!date) {
      alert("Vui lòng chọn ngày chơi.");
      return;
    }

    if (participantIds.length < 4) {
      alert("Cần ít nhất 4 người để tạo buổi chơi.");
      return;
    }

    createSession({
      date,
      pointToWin,
      participantIds,
    });

    refreshSessions();
    resetForm();
    setOpenCreate(false);
  }

  function handleGenerateSchedule(session: SessionRecord) {
    const matches = generateSchedule(session.participantIds).map((m) => ({
      id: `match_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sessionId: session.id,
      round: m.round,
      court: m.court,
      teamA: { playerIds: m.teamA },
      teamB: { playerIds: m.teamB },
      scoreA: 0,
      scoreB: 0,
      createdAt: new Date().toISOString(),
    }));

    saveMatches(matches);
    alert(
      `Đã tạo ${matches.length} trận cho buổi ${session.date}. Bạn có thể sang màn Session Detail / Match để nhập tỷ số ở Sprint tiếp theo.`
    );
  }

  function getParticipantNames(session: SessionRecord) {
    return session.participantIds
      .map((id) => playerMap.get(id)?.name)
      .filter(Boolean)
      .join(", ");
  }

  return (
    <AppShell
      title="Buổi chơi"
      subtitle="Tạo session, chọn người chơi và sinh lịch đấu"
    >
      <div className="space-y-4">
        <SectionCard
          title="Tổng quan buổi chơi"
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
              <div className="text-sm text-slate-500">Tổng số buổi</div>
              <div className="mt-2 text-3xl font-bold">{sessions.length}</div>
              <div className="mt-1 text-xs text-slate-400">
                Đã lưu trên thiết bị hiện tại
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Người chơi hiện có</div>
              <div className="mt-2 text-3xl font-bold">{players.length}</div>
              <div className="mt-1 text-xs text-slate-400">
                Dùng để chọn tham gia session
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

        {openCreate && (
          <SectionCard title="Tạo buổi chơi mới">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
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
                <label className="mb-2 block text-sm font-medium text-slate-700">
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
                  <option value={21}>21</option>
                </select>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700">
                    Chọn người tham gia
                  </label>
                  <span className="text-xs text-slate-500">
                    Đã chọn {form.participantIds.length} người
                  </span>
                </div>

                <div className="space-y-2">
                  {players.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                      Chưa có người chơi nào trong danh sách.
                    </div>
                  ) : (
                    players.map((player) => {
                      const checked = form.participantIds.includes(player.id);

                      return (
                        <label
                          key={player.id}
                          className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 transition ${
                            checked
                              ? "border-brand-500 bg-brand-50"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <div>
                            <div className="font-medium">{player.name}</div>
                            <div className="text-sm text-slate-500">
                              {player.nickname?.trim()
                                ? player.nickname
                                : "Chưa có biệt danh"}
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
                    })
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCreateSession}
                  className="flex-1 rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white"
                >
                  Lưu buổi chơi
                </button>

                <button
                  onClick={() => {
                    resetForm();
                    setOpenCreate(false);
                  }}
                  className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700"
                >
                  Huỷ
                </button>
              </div>
            </div>
          </SectionCard>
        )}

        <SectionCard title="Danh sách buổi chơi">
          {sessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <CalendarDays className="text-slate-500" size={22} />
              </div>
              <div className="text-base font-semibold">Chưa có buổi chơi</div>
              <div className="mt-1 text-sm text-slate-500">
                Hãy tạo buổi đầu tiên để bắt đầu xếp lịch pickleball.
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
              {sessions.map((session) => {
                const participantCount = session.participantIds?.length ?? 0;

                return (
                  <div
                    key={session.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                            {session.date}
                          </div>

                          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            Chạm {session.pointToWin}
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                          <Users size={16} />
                          {participantCount} người tham gia
                        </div>

                        <div className="mt-2 text-sm text-slate-500">
                          {getParticipantNames(session)}
                        </div>
                      </div>

                      <ChevronRight className="mt-1 text-slate-400" size={18} />
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleGenerateSchedule(session)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
                      >
                        <Swords size={16} />
                        Tạo lịch
                      </button>

                      <button
                        onClick={() => {
                          alert(
                            "Sprint 6A chưa làm chức năng xoá session. Có thể bổ sung ở Sprint 7."
                          );
                        }}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                      >
                        <Trash2 size={16} />
                        Xoá
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Ghi chú Sprint 6A">
          <div className="space-y-2 text-sm text-slate-600">
            <div>• Session hiện lưu localStorage trên máy hiện tại.</div>
            <div>• Có thể chọn người tham gia cho từng buổi chơi.</div>
            <div>• Nút “Tạo lịch” sẽ sinh danh sách match tự động từ participantIds.</div>
            <div>
              • Sprint tiếp theo có thể làm Session Detail để nhập tỷ số từng trận.
            </div>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}