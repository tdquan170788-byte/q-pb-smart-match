"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/page-header";
import {
  ensureSeedData,
  getMatches,
  getPlayers,
  getSessions,
  savePlayers,
  upsertMatch,
} from "@/lib/storage";
import { buildSessionSchedule } from "@/lib/match-generator";
import { rebuildRankingData } from "@/lib/ranking";
import type {
  GeneratedSchedule,
  MatchRecord,
  Player,
  ScheduledMatch,
  SessionRecord,
} from "@/types";

type ScoreDraftMap = Record<
  string,
  {
    scoreA: string;
    scoreB: string;
  }
>;

function getPlayerName(playerMap: Map<string, Player>, id: string) {
  return playerMap.get(id)?.nickname?.trim() || playerMap.get(id)?.name || id;
}

function buildMatchKey(match: ScheduledMatch) {
  return `${match.round}_${match.court}_${match.teamA.join("-")}_${match.teamB.join("-")}`;
}

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const sessionId = String(params?.id ?? "");

  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [schedule, setSchedule] = useState<GeneratedSchedule | null>(null);
  const [savedMatches, setSavedMatches] = useState<MatchRecord[]>([]);
  const [scoreDrafts, setScoreDrafts] = useState<ScoreDraftMap>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    ensureSeedData();

    const allPlayers = getPlayers();
    const allSessions = getSessions();
    const allMatches = getMatches();

    const currentSession = allSessions.find((s) => s.id === sessionId) ?? null;
    if (!currentSession) {
      setLoading(false);
      return;
    }

    const generated = buildSessionSchedule(currentSession.id, currentSession.participantIds);

    const sessionMatches = allMatches.filter((m) => m.sessionId === currentSession.id);

    const drafts: ScoreDraftMap = {};
    for (const round of generated.rounds) {
      for (const match of round.matches) {
        const existed = sessionMatches.find(
          (m) =>
            m.round === match.round &&
            (m.court ?? 1) === match.court &&
            sameIds(m.teamA.playerIds, match.teamA) &&
            sameIds(m.teamB.playerIds, match.teamB)
        );

        const key = buildMatchKey(match);
        drafts[key] = {
          scoreA: existed ? String(existed.scoreA) : "",
          scoreB: existed ? String(existed.scoreB) : "",
        };
      }
    }

    setPlayers(allPlayers);
    setSession(currentSession);
    setSchedule(generated);
    setSavedMatches(sessionMatches);
    setScoreDrafts(drafts);
    setLoading(false);
  }, [sessionId]);

  const playerMap = useMemo(() => {
    return new Map(players.map((p) => [p.id, p]));
  }, [players]);

  const roundCompletion = useMemo(() => {
    if (!schedule) return new Map<number, boolean>();

    const map = new Map<number, boolean>();

    for (const round of schedule.rounds) {
      const done = round.matches.every((match) => {
        const key = buildMatchKey(match);
        const draft = scoreDrafts[key];
        if (!draft) return false;

        const scoreA = Number(draft.scoreA);
        const scoreB = Number(draft.scoreB);

        return Number.isFinite(scoreA) && Number.isFinite(scoreB);
      });

      map.set(round.round, done);
    }

    return map;
  }, [schedule, scoreDrafts]);

  const isRoundUnlocked = (roundNo: number) => {
    if (roundNo <= 1) return true;
    return roundCompletion.get(roundNo - 1) === true;
  };

  const handleChangeScore = (
    match: ScheduledMatch,
    field: "scoreA" | "scoreB",
    value: string
  ) => {
    const key = buildMatchKey(match);
    setScoreDrafts((prev) => ({
      ...prev,
      [key]: {
        scoreA: prev[key]?.scoreA ?? "",
        scoreB: prev[key]?.scoreB ?? "",
        [field]: value,
      },
    }));
  };

  const handleSaveMatch = (match: ScheduledMatch) => {
    if (!session || !schedule) return;

    if (!isRoundUnlocked(match.round)) {
      alert("Bạn cần nhập xong toàn bộ round trước đó trước khi sang round này.");
      return;
    }

    const key = buildMatchKey(match);
    const draft = scoreDrafts[key];

    const scoreA = Number(draft?.scoreA ?? "");
    const scoreB = Number(draft?.scoreB ?? "");

    if (!Number.isFinite(scoreA) || !Number.isFinite(scoreB)) {
      alert("Vui lòng nhập đủ điểm cho 2 đội.");
      return;
    }

    setSavingKey(key);

    upsertMatch({
      sessionId: session.id,
      round: match.round,
      court: match.court,
      teamA: { playerIds: match.teamA },
      teamB: { playerIds: match.teamB },
      scoreA,
      scoreB,
    });

    // reload matches + rebuild ranking
    const allPlayers = getPlayers();
    const allSessions = getSessions();
    const allMatches = getMatches();

    const ranking = rebuildRankingData({
      players: allPlayers,
      sessions: allSessions,
      matches: allMatches,
    });

    savePlayers(ranking.players);

    const refreshedSessionMatches = allMatches.filter((m) => m.sessionId === session.id);
    setSavedMatches(refreshedSessionMatches);
    setPlayers(ranking.players);
    setSavingKey(null);
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        Đang tải session...
      </div>
    );
  }

  if (!session || !schedule) {
    return (
      <div className="space-y-4">
        <PageHeader title="Chi tiết session" description="Không tìm thấy session." />
        <button
          type="button"
          onClick={() => router.push("/session")}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Session ${session.date}`}
        description={`Mode: ${session.mode ?? "normal"} • Điểm chạm: ${
          session.pointToWin
        } • Số người: ${session.participantIds.length}`}
        action={
          <button
            type="button"
            onClick={() => router.push("/session")}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Quay lại
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">Ngày</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {session.date}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">Mode</div>
          <div className="mt-1 text-lg font-semibold capitalize text-slate-900">
            {session.mode ?? "normal"}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">Điểm chạm</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {session.pointToWin}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">Tổng round</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {schedule.totalRounds}
          </div>
        </div>
      </div>

      {schedule.rounds.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800 shadow-sm">
          Session này hiện chưa sinh được lịch đấu. Hãy kiểm tra số người / mode / số sân.
        </div>
      ) : null}

      <div className="space-y-5">
        {schedule.rounds.map((round) => {
          const unlocked = isRoundUnlocked(round.round);
          const completed = roundCompletion.get(round.round) === true;

          return (
            <div
              key={round.round}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-bold text-slate-900">
                    Round {round.round}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {completed
                      ? "Đã nhập đủ kết quả round này"
                      : unlocked
                      ? "Round đang mở để nhập kết quả"
                      : "Bị khóa — cần hoàn thành round trước"}
                  </div>
                </div>

                <div
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    completed
                      ? "bg-emerald-100 text-emerald-700"
                      : unlocked
                      ? "bg-sky-100 text-sky-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {completed ? "Completed" : unlocked ? "Open" : "Locked"}
                </div>
              </div>

              {round.restingPlayerIds.length > 0 ? (
                <div className="mb-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">Nghỉ:</span>{" "}
                  {round.restingPlayerIds
                    .map((id) => getPlayerName(playerMap, id))
                    .join(", ")}
                </div>
              ) : null}

              <div className="space-y-4">
                {round.matches.map((match) => {
                  const key = buildMatchKey(match);
                  const draft = scoreDrafts[key] ?? { scoreA: "", scoreB: "" };
                  const disabled = !unlocked;
                  const alreadySaved = savedMatches.some(
                    (m) =>
                      m.round === match.round &&
                      (m.court ?? 1) === match.court &&
                      sameIds(m.teamA.playerIds, match.teamA) &&
                      sameIds(m.teamB.playerIds, match.teamB)
                  );

                  return (
                    <div
                      key={key}
                      className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="font-semibold text-slate-900">
                          Sân {match.court}
                        </div>
                        {alreadySaved ? (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            Đã lưu
                          </span>
                        ) : null}
                      </div>

                      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto] lg:items-center">
                        <div className="rounded-xl bg-white p-4">
                          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Team A
                          </div>
                          <div className="space-y-1 font-semibold text-slate-900">
                            {match.teamA.map((id) => (
                              <div key={id}>{getPlayerName(playerMap, id)}</div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 justify-center">
                          <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            value={draft.scoreA}
                            disabled={disabled}
                            onChange={(e) =>
                              handleChangeScore(match, "scoreA", e.target.value)
                            }
                            className="w-20 rounded-xl border border-slate-300 bg-white px-3 py-2 text-center font-semibold text-slate-900 outline-none focus:border-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
                          />
                          <span className="font-bold text-slate-500">-</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            value={draft.scoreB}
                            disabled={disabled}
                            onChange={(e) =>
                              handleChangeScore(match, "scoreB", e.target.value)
                            }
                            className="w-20 rounded-xl border border-slate-300 bg-white px-3 py-2 text-center font-semibold text-slate-900 outline-none focus:border-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
                          />
                        </div>

                        <div className="rounded-xl bg-white p-4">
                          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Team B
                          </div>
                          <div className="space-y-1 font-semibold text-slate-900">
                            {match.teamB.map((id) => (
                              <div key={id}>{getPlayerName(playerMap, id)}</div>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            disabled={disabled || savingKey === key}
                            onClick={() => handleSaveMatch(match)}
                            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            {savingKey === key ? "Đang lưu..." : "Lưu kết quả"}
                          </button>
                        </div>
                      </div>

                      {!unlocked ? (
                        <div className="mt-3 text-sm text-amber-700">
                          Bạn cần nhập xong kết quả của round trước rồi mới được sang round này.
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function sameIds(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const aa = [...a].sort();
  const bb = [...b].sort();
  return aa.every((id, idx) => id === bb[idx]);
}