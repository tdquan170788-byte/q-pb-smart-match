"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus, Users, CalendarDays, Trophy } from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import type { MatchRecord, Player, SessionRecord } from "@/types";
import {
  addMatch,
  addSession,
  ensureSeedData,
  getMatches,
  getPlayers,
  getSessions,
} from "@/lib/storage";

type MatchForm = {
  teamA1: string;
  teamA2: string;
  teamB1: string;
  teamB2: string;
  scoreA: string;
  scoreB: string;
};

export default function SessionsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);

  const [date, setDate] = useState("");
  const [pointToWin, setPointToWin] = useState("11");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState("");

  const [matchForm, setMatchForm] = useState<MatchForm>({
    teamA1: "",
    teamA2: "",
    teamB1: "",
    teamB2: "",
    scoreA: "",
    scoreB: "",
  });

  useEffect(() => {
    ensureSeedData();
    refreshAll();
  }, []);

  function refreshAll() {
    const nextPlayers = getPlayers();
    const nextSessions = getSessions();
    const nextMatches = getMatches();

    setPlayers(nextPlayers);
    setSessions(nextSessions);
    setMatches(nextMatches);

    if (!currentSessionId && nextSessions.length > 0) {
      setCurrentSessionId(nextSessions[0].id);
    }
  }

  const currentSession = useMemo(() => {
    return sessions.find((s) => s.id === currentSessionId) ?? null;
  }, [sessions, currentSessionId]);

  const currentSessionMatches = useMemo(() => {
    if (!currentSessionId) return [];
    return matches
      .filter((m) => m.sessionId === currentSessionId)
      .sort((a, b) => a.round - b.round);
  }, [matches, currentSessionId]);

  const playerMap = useMemo(() => {
    return new Map(players.map((p) => [p.id, p]));
  }, [players]);

  function togglePlayer(playerId: string) {
    setSelectedIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  }

  function handleCreateSession() {
    if (!date) {
      alert("Hãy chọn ngày chơi.");
      return;
    }

    if (selectedIds.length < 4) {
      alert("Cần chọn ít nhất 4 người để tạo buổi chơi.");
      return;
    }

    const created = addSession({
      date,
      pointToWin: Number(pointToWin) || 11,
      participantIds: selectedIds,
      createdAt: new Date().toISOString(),
    });

    refreshAll();
    setCurrentSessionId(created.id);
    setMatchForm({
      teamA1: "",
      teamA2: "",
      teamB1: "",
      teamB2: "",
      scoreA: "",
      scoreB: "",
    });
  }

  function handleAddMatch() {
    if (!currentSession) {
      alert("Hãy tạo hoặc chọn một buổi chơi trước.");
      return;
    }

    const { teamA1, teamA2, teamB1, teamB2, scoreA, scoreB } = matchForm;

    if (!teamA1 || !teamA2 || !teamB1 || !teamB2) {
      alert("Hãy chọn đủ 4 người cho trận.");
      return;
    }

    const ids = [teamA1, teamA2, teamB1, teamB2];
    const uniqueIds = new Set(ids);
    if (uniqueIds.size < 4) {
      alert("Một người không thể xuất hiện 2 lần trong cùng trận.");
      return;
    }

    if (!currentSession.participantIds.includes(teamA1) ||
        !currentSession.participantIds.includes(teamA2) ||
        !currentSession.participantIds.includes(teamB1) ||
        !currentSession.participantIds.includes(teamB2)) {
      alert("Người chơi phải nằm trong danh sách tham gia của buổi này.");
      return;
    }

    const nextRound = currentSessionMatches.length + 1;

    addMatch({
      sessionId: currentSession.id,
      round: nextRound,
      teamA: { playerIds: [teamA1, teamA2] },
      teamB: { playerIds: [teamB1, teamB2] },
      scoreA: Number(scoreA) || 0,
      scoreB: Number(scoreB) || 0,
      createdAt: new Date().toISOString(),
    });

    refreshAll();

    setMatchForm({
      teamA1: "",
      teamA2: "",
      teamB1: "",
      teamB2: "",
      scoreA: "",
      scoreB: "",
    });
  }

  const selectablePlayers = currentSession
    ? players.filter((p) => currentSession.participantIds.includes(p.id))
    : [];

  return (
    <AppShell
      title="Buổi chơi"
      subtitle="Tạo session, chọn người chơi và nhập kết quả trận"
    >
      <div className="space-y-4">
        <div>
          <Link
            href="/sessions/history"
            className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
          >
            Xem lịch sử buổi chơi
          </Link>
        </div>

        <SectionCard title="Tạo buổi chơi mới">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
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
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Điểm chạm
              </label>
              <input
                type="number"
                min={1}
                value={pointToWin}
                onChange={(e) => setPointToWin(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
              />
            </div>

            <div>
              <div className="mb-2 text-sm font-medium text-slate-700">
                Chọn người tham gia
              </div>
              <div className="grid grid-cols-2 gap-2">
                {players.map((player) => {
                  const checked = selectedIds.includes(player.id);
                  return (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => togglePlayer(player.id)}
                      className={`rounded-2xl border px-3 py-3 text-left text-sm ${
                        checked
                          ? "border-brand-600 bg-brand-50 text-brand-700"
                          : "border-slate-200 bg-white text-slate-700"
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
              className="w-full rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white"
            >
              <span className="inline-flex items-center gap-2">
                <Plus size={16} />
                Tạo buổi chơi
              </span>
            </button>
          </div>
        </SectionCard>

        <SectionCard title="Chọn buổi hiện tại">
          {sessions.length === 0 ? (
            <div className="text-sm text-slate-500">
              Chưa có buổi chơi nào. Hãy tạo buổi chơi ở phần trên.
            </div>
          ) : (
            <div className="space-y-3">
              <select
                value={currentSessionId}
                onChange={(e) => setCurrentSessionId(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
              >
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.date} • {session.participantIds.length} người • chạm {session.pointToWin}
                  </option>
                ))}
              </select>

              {currentSession ? (
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white p-3">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <CalendarDays size={16} />
                        Ngày chơi
                      </div>
                      <div className="mt-2 font-bold">{currentSession.date}</div>
                    </div>

                    <div className="rounded-2xl bg-white p-3">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Trophy size={16} />
                        Điểm chạm
                      </div>
                      <div className="mt-2 font-bold">{currentSession.pointToWin}</div>
                    </div>

                    <div className="rounded-2xl bg-white p-3">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Users size={16} />
                        Người tham gia
                      </div>
                      <div className="mt-2 font-bold">
                        {currentSession.participantIds.length}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white p-3">
                      <div className="text-sm text-slate-500">Số trận đã nhập</div>
                      <div className="mt-2 font-bold">{currentSessionMatches.length}</div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Nhập kết quả trận">
          {!currentSession ? (
            <div className="text-sm text-slate-500">
              Hãy tạo hoặc chọn buổi chơi trước khi nhập trận.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="mb-3 text-sm font-semibold text-slate-700">
                  Team A
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={matchForm.teamA1}
                    onChange={(e) =>
                      setMatchForm((prev) => ({ ...prev, teamA1: e.target.value }))
                    }
                    className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                  >
                    <option value="">Chọn người 1</option>
                    {selectablePlayers.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={matchForm.teamA2}
                    onChange={(e) =>
                      setMatchForm((prev) => ({ ...prev, teamA2: e.target.value }))
                    }
                    className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                  >
                    <option value="">Chọn người 2</option>
                    {selectablePlayers.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="mb-3 text-sm font-semibold text-slate-700">
                  Team B
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={matchForm.teamB1}
                    onChange={(e) =>
                      setMatchForm((prev) => ({ ...prev, teamB1: e.target.value }))
                    }
                    className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                  >
                    <option value="">Chọn người 1</option>
                    {selectablePlayers.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={matchForm.teamB2}
                    onChange={(e) =>
                      setMatchForm((prev) => ({ ...prev, teamB2: e.target.value }))
                    }
                    className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                  >
                    <option value="">Chọn người 2</option>
                    {selectablePlayers.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Điểm Team A
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={matchForm.scoreA}
                    onChange={(e) =>
                      setMatchForm((prev) => ({ ...prev, scoreA: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Điểm Team B
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={matchForm.scoreB}
                    onChange={(e) =>
                      setMatchForm((prev) => ({ ...prev, scoreB: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleAddMatch}
                className="w-full rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white"
              >
                + Lưu trận đấu
              </button>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Các trận của buổi đang chọn">
          {!currentSession ? (
            <div className="text-sm text-slate-500">
              Chưa chọn buổi chơi.
            </div>
          ) : currentSessionMatches.length === 0 ? (
            <div className="text-sm text-slate-500">
              Buổi này chưa có trận nào.
            </div>
          ) : (
            <div className="space-y-3">
              {currentSessionMatches.map((match) => {
                const teamA = match.teamA.playerIds
                  .map((id) => playerMap.get(id)?.name ?? "Unknown")
                  .join(" / ");
                const teamB = match.teamB.playerIds
                  .map((id) => playerMap.get(id)?.name ?? "Unknown")
                  .join(" / ");

                return (
                  <div
                    key={match.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="mb-2 text-sm font-semibold text-slate-700">
                      Trận {match.round}
                    </div>
                    <div className="text-sm text-slate-600">{teamA}</div>
                    <div className="my-2 text-center text-lg font-bold text-brand-700">
                      {match.scoreA} - {match.scoreB}
                    </div>
                    <div className="text-sm text-slate-600">{teamB}</div>
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