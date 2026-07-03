"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, RefreshCcw, Save, Users } from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import type { MatchRecord, Player, ScheduledMatch, SessionRecord } from "@/types";
import {
  getMatchesBySession,
  getPlayersByIds,
  getSessionById,
  upsertMatch,
} from "@/lib/storage";
import { generateSessionMatches } from "@/lib/scheduler";

type ScoreDraft = {
  scoreA: number | "";
  scoreB: number | "";
};

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params?.id;

  const [session, setSession] = useState<SessionRecord | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [savedMatches, setSavedMatches] = useState<MatchRecord[]>([]);
  const [scheduledMatches, setScheduledMatches] = useState<ScheduledMatch[]>([]);
  const [scoreMap, setScoreMap] = useState<Record<number, ScoreDraft>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    const foundSession = getSessionById(sessionId);
    if (!foundSession) {
      setLoaded(true);
      return;
    }

    const participantPlayers = getPlayersByIds(foundSession.participantIds);
    const existingMatches = getMatchesBySession(foundSession.id);

    setSession(foundSession);
    setPlayers(participantPlayers);
    setSavedMatches(existingMatches);

    const generated = generateSessionMatches(foundSession.participantIds);
    setScheduledMatches(generated);

    const initialScores: Record<number, ScoreDraft> = {};
    generated.forEach((m) => {
      const saved = existingMatches.find((x) => x.round === m.round);
      initialScores[m.round] = {
        scoreA: saved ? saved.scoreA : "",
        scoreB: saved ? saved.scoreB : "",
      };
    });

    setScoreMap(initialScores);
    setLoaded(true);
  }, [sessionId]);

  const playerMap = useMemo(() => {
    return new Map(players.map((p) => [p.id, p]));
  }, [players]);

  function getPlayerName(playerId: string) {
    return playerMap.get(playerId)?.name ?? "Unknown";
  }

  function formatTeam(playerIds: string[]) {
    return playerIds.map(getPlayerName).join(" / ");
  }

  function updateScore(round: number, side: "A" | "B", value: string) {
    const numeric =
      value.trim() === "" ? "" : Math.max(0, Number.parseInt(value, 10) || 0);

    setScoreMap((prev) => ({
      ...prev,
      [round]: {
        scoreA: side === "A" ? numeric : (prev[round]?.scoreA ?? ""),
        scoreB: side === "B" ? numeric : (prev[round]?.scoreB ?? ""),
      },
    }));
  }

  function saveMatch(match: ScheduledMatch) {
    if (!session) return;

    const draft = scoreMap[match.round];
    if (!draft) return;

    if (draft.scoreA === "" || draft.scoreB === "") {
      alert(`Vui lòng nhập đủ điểm cho trận ${match.round}.`);
      return;
    }

    upsertMatch({
      sessionId: session.id,
      round: match.round,
      teamA: { playerIds: match.teamA },
      teamB: { playerIds: match.teamB },
      scoreA: Number(draft.scoreA),
      scoreB: Number(draft.scoreB),
      createdAt: new Date().toISOString(),
    });

    const refreshed = getMatchesBySession(session.id);
    setSavedMatches(refreshed);

    alert(`Đã lưu kết quả trận ${match.round}.`);
  }

  function isSaved(round: number) {
    return savedMatches.some((m) => m.round === round);
  }

  if (!loaded) {
    return (
      <AppShell title="Buổi chơi" subtitle="Đang tải dữ liệu...">
        <div className="rounded-3xl bg-white p-6 shadow-card">
          Đang tải buổi chơi...
        </div>
      </AppShell>
    );
  }

  if (!session) {
    return (
      <AppShell title="Buổi chơi" subtitle="Không tìm thấy session">
        <SectionCard title="Không tìm thấy buổi chơi">
          <div className="space-y-3">
            <div className="text-sm text-slate-600">
              Session này không tồn tại hoặc đã bị xoá khỏi localStorage.
            </div>
            <Link
              href="/sessions"
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white"
            >
              <ArrowLeft size={16} />
              Quay lại danh sách buổi chơi
            </Link>
          </div>
        </SectionCard>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Buổi ${new Date(session.date).toLocaleDateString("vi-VN")}`}
      subtitle="Xếp trận và nhập kết quả"
    >
      <div className="space-y-4">
        <SectionCard
          title="Thông tin buổi chơi"
          action={
            <Link
              href="/sessions"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
            >
              <ArrowLeft size={16} />
              Quay lại
            </Link>
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <CalendarDays size={15} />
                Ngày chơi
              </div>
              <div className="mt-2 text-lg font-bold">
                {new Date(session.date).toLocaleDateString("vi-VN")}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Điểm chạm đích</div>
              <div className="mt-2 text-lg font-bold">{session.pointToWin}</div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
              <Users size={15} />
              Người tham gia ({players.length})
            </div>

            <div className="flex flex-wrap gap-2">
              {players.map((player) => (
                <span
                  key={player.id}
                  className="rounded-full bg-white px-3 py-1 text-sm text-slate-700"
                >
                  {player.name}
                </span>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Lịch trận tự động"
          action={
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
              <RefreshCcw size={14} />
              {scheduledMatches.length} trận
            </div>
          }
        >
          {scheduledMatches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">
              Chưa thể sinh lịch trận. Cần ít nhất 4 người tham gia.
            </div>
          ) : (
            <div className="space-y-4">
              {scheduledMatches.map((match) => {
                const draft = scoreMap[match.round] ?? {
                  scoreA: "",
                  scoreB: "",
                };

                const saved = isSaved(match.round);

                return (
                  <div
                    key={match.round}
                    className="rounded-3xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-base font-bold">
                          Trận {match.round}
                        </div>
                        <div className="text-xs text-slate-500">
                          {saved ? "Đã lưu kết quả" : "Chưa lưu kết quả"}
                        </div>
                      </div>

                      <div
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          saved
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {saved ? "Đã lưu" : "Nháp"}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-2xl bg-white p-3">
                        <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Team A
                        </div>
                        <div className="mt-1 text-base font-semibold">
                          {formatTeam(match.teamA)}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white p-3">
                        <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Team B
                        </div>
                        <div className="mt-1 text-base font-semibold">
                          {formatTeam(match.teamB)}
                        </div>
                      </div>

                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-500">
                            Điểm Team A
                          </label>
                          <input
                            inputMode="numeric"
                            value={draft.scoreA}
                            onChange={(e) =>
                              updateScore(match.round, "A", e.target.value)
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-lg font-bold outline-none"
                            placeholder="0"
                          />
                        </div>

                        <div className="pt-6 text-lg font-bold text-slate-400">
                          -
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-500">
                            Điểm Team B
                          </label>
                          <input
                            inputMode="numeric"
                            value={draft.scoreB}
                            onChange={(e) =>
                              updateScore(match.round, "B", e.target.value)
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-lg font-bold outline-none"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => saveMatch(match)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white"
                      >
                        <Save size={16} />
                        {saved ? "Cập nhật kết quả" : "Lưu kết quả"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Ghi chú Sprint 3">
          <div className="space-y-2 text-sm text-slate-600">
            <div>• Đây là bản Sprint 3 phase 2: đã có tạo buổi + lịch trận + nhập điểm.</div>
            <div>• Lịch trận hiện đang là bản auto cơ bản cho 1 sân.</div>
            <div>• Sprint tiếp theo mình sẽ làm bảng xếp hạng tự động từ các trận đã nhập.</div>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}