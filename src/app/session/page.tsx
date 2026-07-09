"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Users } from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import ConfirmDialog from "@/components/confirm-dialog";
import {
  createSession,
  ensureSeedData,
  getPlayers,
  getSessions,
} from "@/lib/storage";
import type { Player, SessionMode, SessionRecord } from "@/types";

type CreateSessionForm = {
  date: string;
  pointToWin: number;
  mode: SessionMode;
  courtCount: number;
  participantIds: string[];
  teamAPlayerIds: string[];
  teamBPlayerIds: string[];
};

const defaultForm: CreateSessionForm = {
  date: new Date().toISOString().slice(0, 10),
  pointToWin: 11,
  mode: "normal",
  courtCount: 1,
  participantIds: [],
  teamAPlayerIds: [],
  teamBPlayerIds: [],
};

export default function SessionsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [form, setForm] = useState<CreateSessionForm>(defaultForm);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    ensureSeedData();
    setPlayers(getPlayers());
    setSessions(getSessions());
  }, []);

  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => a.name.localeCompare(b.name, "vi")),
    [players]
  );

  function refreshSessions() {
    setSessions(getSessions());
  }

  function toggleParticipant(playerId: string) {
    setForm((prev) => {
      const exists = prev.participantIds.includes(playerId);
      return {
        ...prev,
        participantIds: exists
          ? prev.participantIds.filter((id) => id !== playerId)
          : [...prev.participantIds, playerId],
      };
    });
  }

  function toggleTeamPlayer(team: "A" | "B", playerId: string) {
    setForm((prev) => {
      const teamA = new Set(prev.teamAPlayerIds);
      const teamB = new Set(prev.teamBPlayerIds);

      if (team === "A") {
        if (teamA.has(playerId)) teamA.delete(playerId);
        else {
          teamA.add(playerId);
          teamB.delete(playerId);
        }
      } else {
        if (teamB.has(playerId)) teamB.delete(playerId);
        else {
          teamB.add(playerId);
          teamA.delete(playerId);
        }
      }

      return {
        ...prev,
        teamAPlayerIds: [...teamA],
        teamBPlayerIds: [...teamB],
        participantIds: [...new Set([...teamA, ...teamB])],
      };
    });
  }

  function handleCreateSession() {
    if (form.mode === "normal") {
      if (form.participantIds.length < 4) return;
      createSession({
        date: form.date,
        pointToWin: form.pointToWin,
        participantIds: form.participantIds,
        mode: "normal",
        courtCount: form.courtCount,
      });
    } else {
      if (form.teamAPlayerIds.length === 0 || form.teamBPlayerIds.length === 0) return;

      createSession({
        date: form.date,
        pointToWin: form.pointToWin,
        participantIds: form.participantIds,
        mode: "team",
        courtCount: form.courtCount,
        teamConfig: {
          teamAPlayerIds: form.teamAPlayerIds,
          teamBPlayerIds: form.teamBPlayerIds,
        },
      });
    }

    refreshSessions();
    setCreateOpen(false);
    setForm(defaultForm);
  }

  return (
    <AppShell
      title="Sessions"
      subtitle="Tạo buổi chơi, chọn mode Normal / Team và quản lý lịch đấu"
    >
      <div className="space-y-4">
        <SectionCard
          title="Danh sách buổi chơi"
          action={
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white"
            >
              <Plus size={16} />
              Tạo session
            </button>
          }
        >
          {sessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Users className="text-slate-500" size={22} />
              </div>
              <div className="text-base font-semibold">Chưa có session nào</div>
              <div className="mt-1 text-sm text-slate-500">
                Tạo buổi chơi đầu tiên để bắt đầu xếp lịch và nhập kết quả.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/sessions/${session.id}`}
                  className="block rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-slate-900">
                        {session.mode === "team" ? "Team session" : "Normal session"}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        Ngày: {session.date} • Chạm {session.pointToWin} • Court:{" "}
                        {session.courtCount ?? 1}
                      </div>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700">
                      {session.participantIds.length} người
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <ConfirmDialog
        open={createOpen}
        title="Tạo session mới"
        description=""
        confirmText="Tạo session"
        cancelText="Huỷ"
        onCancel={() => setCreateOpen(false)}
        onConfirm={handleCreateSession}
      />

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-5 shadow-xl">
            <div className="mb-4 text-lg font-bold text-slate-900">Tạo session</div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Ngày
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Điểm thắng
                </label>
                <input
                  type="number"
                  value={form.pointToWin}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      pointToWin: Number(e.target.value) || 11,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Mode
                </label>
                <select
                  value={form.mode}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      mode: e.target.value as SessionMode,
                      participantIds: [],
                      teamAPlayerIds: [],
                      teamBPlayerIds: [],
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                >
                  <option value="normal">Normal</option>
                  <option value="team">Team</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Số court
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.courtCount}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      courtCount: Number(e.target.value) || 1,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                />
              </div>
            </div>

            <div className="mt-5">
              <div className="text-sm font-semibold text-slate-900">
                {form.mode === "normal" ? "Chọn người chơi" : "Chia đội cố định"}
              </div>

              {form.mode === "normal" ? (
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {sortedPlayers.map((player) => {
                    const checked = form.participantIds.includes(player.id);
                    return (
                      <label
                        key={player.id}
                        className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleParticipant(player.id)}
                        />
                        <div>
                          <div className="font-medium text-slate-900">{player.name}</div>
                          <div className="text-sm text-slate-500">
                            {player.nickname || "Không có nickname"}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  {sortedPlayers.map((player) => {
                    const inA = form.teamAPlayerIds.includes(player.id);
                    const inB = form.teamBPlayerIds.includes(player.id);

                    return (
                      <div
                        key={player.id}
                        className="flex items-center justify-between rounded-2xl border border-slate-200 p-3"
                      >
                        <div>
                          <div className="font-medium text-slate-900">{player.name}</div>
                          <div className="text-sm text-slate-500">
                            {player.nickname || "Không có nickname"}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleTeamPlayer("A", player.id)}
                            className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                              inA
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            Team A
                          </button>
                          <button
                            onClick={() => toggleTeamPlayer("B", player.id)}
                            className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                              inB
                                ? "bg-rose-600 text-white"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            Team B
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setCreateOpen(false)}
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
      ) : null}
    </AppShell>
  );
}