"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Plus, Users, Swords, Trophy } from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import {
  createSession,
  ensureSeedData,
  getPlayers,
  getSessions,
} from "@/lib/storage";
import type { Player, SessionMode, SessionRecord } from "@/types";

type SessionForm = {
  date: string;
  pointToWin: number;
  participantIds: string[];
  mode: SessionMode;
  courtCount: number;
  teamAPlayerIds: string[];
  teamBPlayerIds: string[];
};

const DEFAULT_FORM: SessionForm = {
  date: new Date().toISOString().slice(0, 10),
  pointToWin: 11,
  participantIds: [],
  mode: "normal",
  courtCount: 1,
  teamAPlayerIds: [],
  teamBPlayerIds: [],
};

export default function SessionPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState<SessionForm>(DEFAULT_FORM);

  useEffect(() => {
    ensureSeedData();
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
      const nextIds = exists
        ? prev.participantIds.filter((id) => id !== playerId)
        : [...prev.participantIds, playerId];

      const nextTeamA = prev.teamAPlayerIds.filter((id) => nextIds.includes(id));
      const nextTeamB = prev.teamBPlayerIds.filter((id) => nextIds.includes(id));

      return {
        ...prev,
        participantIds: nextIds,
        teamAPlayerIds: nextTeamA,
        teamBPlayerIds: nextTeamB,
      };
    });
  }

  function assignToTeam(playerId: string, team: "A" | "B") {
    setForm((prev) => {
      if (!prev.participantIds.includes(playerId)) return prev;

      let teamA = prev.teamAPlayerIds.filter((id) => id !== playerId);
      let teamB = prev.teamBPlayerIds.filter((id) => id !== playerId);

      if (team === "A") {
        teamA = [...teamA, playerId];
      } else {
        teamB = [...teamB, playerId];
      }

      return {
        ...prev,
        teamAPlayerIds: teamA,
        teamBPlayerIds: teamB,
      };
    });
  }

  function removeFromTeams(playerId: string) {
    setForm((prev) => ({
      ...prev,
      teamAPlayerIds: prev.teamAPlayerIds.filter((id) => id !== playerId),
      teamBPlayerIds: prev.teamBPlayerIds.filter((id) => id !== playerId),
    }));
  }

  function resetForm() {
    setForm(DEFAULT_FORM);
  }

  function handleCreateSession() {
    const participantIds = Array.from(new Set(form.participantIds));

    if (!form.date) {
      alert("Vui lòng chọn ngày chơi.");
      return;
    }

    if (participantIds.length < 4) {
      alert("Cần ít nhất 4 người để tạo session.");
      return;
    }

    if (form.pointToWin < 1) {
      alert("Điểm chạm phải lớn hơn 0.");
      return;
    }

    if (form.courtCount < 1) {
      alert("Số sân phải từ 1 trở lên.");
      return;
    }

    if (form.mode === "team") {
      const teamA = form.teamAPlayerIds.filter((id) => participantIds.includes(id));
      const teamB = form.teamBPlayerIds.filter((id) => participantIds.includes(id));

      const assigned = new Set([...teamA, ...teamB]);

      if (assigned.size !== participantIds.length) {
        alert("Ở chế độ Team, tất cả người chơi phải được xếp vào Team A hoặc Team B.");
        return;
      }

      if (teamA.length < 2 || teamB.length < 2) {
        alert("Mỗi team cần ít nhất 2 người.");
        return;
      }

      createSession({
        date: form.date,
        pointToWin: form.pointToWin,
        participantIds,
        mode: "team",
        courtCount: form.courtCount,
        teamAPlayerIds: teamA,
        teamBPlayerIds: teamB,
      });
    } else {
      createSession({
        date: form.date,
        pointToWin: form.pointToWin,
        participantIds,
        mode: "normal",
        courtCount: form.courtCount,
      });
    }

    refreshSessions();
    setOpenCreate(false);
    resetForm();
  }

  return (
    <AppShell
      title="Session"
      subtitle="Tạo buổi chơi, chọn chế độ và theo dõi lịch thi đấu"
    >
      <div className="space-y-4">
        <SectionCard
          title="Quản lý session"
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
          {openCreate ? (
            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-3">
                <label className="space-y-1">
                  <div className="text-sm font-medium text-slate-700">Ngày chơi</div>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, date: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>

                <label className="space-y-1">
                  <div className="text-sm font-medium text-slate-700">Điểm chạm</div>
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
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>

                <label className="space-y-1">
                  <div className="text-sm font-medium text-slate-700">Số sân</div>
                  <input
                    type="number"
                    min={1}
                    value={form.courtCount}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        courtCount: Math.max(1, Number(e.target.value) || 1),
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-700">Chế độ thi đấu</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        mode: "normal",
                        teamAPlayerIds: [],
                        teamBPlayerIds: [],
                      }))
                    }
                    className={`rounded-xl px-4 py-2 text-sm font-medium ${
                      form.mode === "normal"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    Đối đầu thường
                  </button>

                  <button
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        mode: "team",
                      }))
                    }
                    className={`rounded-xl px-4 py-2 text-sm font-medium ${
                      form.mode === "team"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    Team mode
                  </button>
                </div>
              </div>

              <div>
                <div className="mb-2 text-sm font-medium text-slate-700">
                  Chọn người tham gia ({form.participantIds.length})
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  {players.map((player) => {
                    const checked = form.participantIds.includes(player.id);
                    return (
                      <label
                        key={player.id}
                        className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 ${
                          checked
                            ? "border-slate-900 bg-slate-50"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div>
                          <div className="font-medium text-slate-900">{player.name}</div>
                          <div className="text-xs text-slate-500">
                            {player.nickname || "Không có nickname"}
                          </div>
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
              </div>

              {form.mode === "team" ? (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Swords size={16} />
                    Chia Team
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl bg-white p-4">
                      <div className="mb-3 text-sm font-semibold text-blue-700">
                        Team A ({form.teamAPlayerIds.length})
                      </div>
                      <div className="space-y-2">
                        {form.participantIds.map((id) => {
                          const player = playerMap.get(id);
                          if (!player) return null;

                          const inTeamA = form.teamAPlayerIds.includes(id);
                          const inTeamB = form.teamBPlayerIds.includes(id);

                          return (
                            <div
                              key={`a_${id}`}
                              className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2"
                            >
                              <div className="text-sm">{player.name}</div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => assignToTeam(id, "A")}
                                  className={`rounded-lg px-3 py-1 text-xs ${
                                    inTeamA
                                      ? "bg-blue-600 text-white"
                                      : "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  Team A
                                </button>
                                <button
                                  onClick={() => assignToTeam(id, "B")}
                                  className={`rounded-lg px-3 py-1 text-xs ${
                                    inTeamB
                                      ? "bg-rose-600 text-white"
                                      : "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  Team B
                                </button>
                                <button
                                  onClick={() => removeFromTeams(id)}
                                  className="rounded-lg bg-slate-100 px-3 py-1 text-xs text-slate-700"
                                >
                                  Bỏ
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white p-4">
                      <div className="mb-3 text-sm font-semibold text-rose-700">
                        Team B ({form.teamBPlayerIds.length})
                      </div>

                      <div className="space-y-2 text-sm text-slate-700">
                        <div>
                          - Người cùng team sẽ <b>không đấu với nhau</b>.
                        </div>
                        <div>- Mỗi trận sẽ là: <b>2 người Team A vs 2 người Team B</b>.</div>
                        <div>- Kết quả team mode sẽ tính theo <b>tổng điểm</b>.</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setOpenCreate(false);
                    resetForm();
                  }}
                  className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Hủy
                </button>

                <button
                  onClick={handleCreateSession}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Lưu session
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-600">
              Tạo buổi chơi mới, chọn số sân, chọn người tham gia và chia team nếu cần.
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
                const modeLabel = session.mode === "team" ? "Team mode" : "Đối đầu";
                const courtCount = session.courtCount ?? 1;

                return (
                  <Link
                    key={session.id}
                    href={`/session/${session.id}`}
                    className="block rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <CalendarDays size={15} />
                          {session.date}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                            <Users size={13} />
                            {participantCount} người
                          </span>

                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                            <Trophy size={13} />
                            Điểm chạm {session.pointToWin}
                          </span>

                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                            {courtCount} sân
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                              session.mode === "team"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {modeLabel}
                          </span>
                        </div>
                      </div>

                      <div className="text-sm font-medium text-slate-600">
                        Xem chi tiết →
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