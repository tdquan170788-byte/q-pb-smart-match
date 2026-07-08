"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ensureSeedData, createSession, getPlayers } from "@/lib/storage";
import type { Player, SessionMode } from "@/types";

type SessionFormState = {
  date: string;
  pointToWin: number;
  participantIds: string[];
  mode: SessionMode;
  courtCount: number;
};

export default function SessionPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [form, setForm] = useState<SessionFormState>({
    date: new Date().toISOString().slice(0, 10),
    pointToWin: 11,
    participantIds: [],
    mode: "normal",
    courtCount: 1,
  });

  const [teamA, setTeamA] = useState<string[]>([]);
  const [teamB, setTeamB] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null);

  useEffect(() => {
    ensureSeedData();
    setPlayers(getPlayers());
  }, []);

  const selectedPlayers = useMemo(
    () => players.filter((p) => form.participantIds.includes(p.id)),
    [players, form.participantIds]
  );

  function toggleParticipant(playerId: string) {
    setCreatedSessionId(null);
    setError("");

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

    setTeamA((prev) => prev.filter((id) => id !== playerId));
    setTeamB((prev) => prev.filter((id) => id !== playerId));
  }

  function toggleTeamPlayer(team: "A" | "B", playerId: string) {
    if (!form.participantIds.includes(playerId)) return;

    if (team === "A") {
      setTeamA((prev) => {
        const exists = prev.includes(playerId);
        const next = exists ? prev.filter((id) => id !== playerId) : [...prev, playerId];
        return next;
      });
      setTeamB((prev) => prev.filter((id) => id !== playerId));
      return;
    }

    setTeamB((prev) => {
      const exists = prev.includes(playerId);
      const next = exists ? prev.filter((id) => id !== playerId) : [...prev, playerId];
      return next;
    });
    setTeamA((prev) => prev.filter((id) => id !== playerId));
  }

  function handleCreateSession() {
    setError("");
    setCreatedSessionId(null);

    const participantIds = [...new Set(form.participantIds)];

    if (!form.date) {
      setError("Vui lòng chọn ngày.");
      return;
    }

    if (participantIds.length < 4) {
      setError("Cần ít nhất 4 người để tạo session.");
      return;
    }

    if (form.pointToWin < 1) {
      setError("Điểm chạm phải lớn hơn 0.");
      return;
    }

    if (form.courtCount < 1) {
      setError("Số sân phải từ 1 trở lên.");
      return;
    }

    if (form.mode === "team") {
      const validTeamA = teamA.filter((id) => participantIds.includes(id));
      const validTeamB = teamB.filter((id) => participantIds.includes(id));

      if (validTeamA.length < 2 || validTeamB.length < 2) {
        setError("Team mode cần ít nhất 2 người mỗi team.");
        return;
      }

      if (validTeamA.length + validTeamB.length !== participantIds.length) {
        setError("Trong team mode, toàn bộ người chơi phải được chia hết vào Team A hoặc Team B.");
        return;
      }

      const session = createSession({
        date: form.date,
        pointToWin: form.pointToWin,
        participantIds,
        mode: "team",
        courtCount: form.courtCount,
        teamConfig: {
          teamAPlayerIds: validTeamA,
          teamBPlayerIds: validTeamB,
        },
      });

      setCreatedSessionId(session.id);
      return;
    }

    const session = createSession({
      date: form.date,
      pointToWin: form.pointToWin,
      participantIds,
      mode: "normal",
      courtCount: form.courtCount,
    });

    setCreatedSessionId(session.id);
  }

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tạo session</h1>
          <p className="mt-1 text-sm text-slate-500">
            Chọn người chơi, chế độ, số sân và tạo lịch thi đấu.
          </p>
        </div>

        <Link
          href="/session/history"
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Lịch sử session
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Thiết lập session</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
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
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Điểm chạm
              </label>
              <input
                type="number"
                min={1}
                value={form.pointToWin}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    pointToWin: Number(e.target.value || 11),
                  }))
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Chế độ
              </label>
              <select
                value={form.mode}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    mode: e.target.value as SessionMode,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              >
                <option value="normal">Normal mode</option>
                <option value="team">Team mode</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Số sân
              </label>
              <input
                type="number"
                min={1}
                value={form.courtCount}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    courtCount: Math.max(1, Number(e.target.value || 1)),
                  }))
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              />
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-800">
                Chọn người tham gia ({form.participantIds.length})
              </h3>
              <span className="text-xs text-slate-500">
                Cần tối thiểu 4 người
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {players.map((player) => {
                const checked = form.participantIds.includes(player.id);
                return (
                  <label
                    key={player.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition ${
                      checked
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleParticipant(player.id)}
                      className="mt-1 h-4 w-4"
                    />

                    <div>
                      <div className="font-medium text-slate-900">
                        {player.name}
                      </div>
                      <div className="text-sm text-slate-500">
                        {player.nickname || "-"}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {form.mode === "team" && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Chia team
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Trong team mode, người cùng team sẽ không đấu với nhau. Hệ thống
                sẽ chỉ ghép Team A vs Team B.
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-blue-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-semibold text-blue-700">Team A</h4>
                    <span className="text-sm text-slate-500">
                      {teamA.length} người
                    </span>
                  </div>

                  <div className="space-y-2">
                    {selectedPlayers.map((player) => {
                      const checked = teamA.includes(player.id);
                      return (
                        <label
                          key={`A_${player.id}`}
                          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTeamPlayer("A", player.id)}
                          />
                          <span className="text-sm text-slate-800">
                            {player.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-rose-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-semibold text-rose-700">Team B</h4>
                    <span className="text-sm text-slate-500">
                      {teamB.length} người
                    </span>
                  </div>

                  <div className="space-y-2">
                    {selectedPlayers.map((player) => {
                      const checked = teamB.includes(player.id);
                      return (
                        <label
                          key={`B_${player.id}`}
                          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTeamPlayer("B", player.id)}
                          />
                          <span className="text-sm text-slate-800">
                            {player.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleCreateSession}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Tạo session
            </button>

            {createdSessionId && (
              <Link
                href={`/session/${createdSessionId}`}
                className="rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-700"
              >
                Mở session vừa tạo
              </Link>
            )}
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Tóm tắt</h2>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-slate-500">Số người chơi</span>
              <span className="font-semibold text-slate-900">
                {form.participantIds.length}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-slate-500">Mode</span>
              <span className="font-semibold text-slate-900">
                {form.mode === "team" ? "Team mode" : "Normal mode"}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-slate-500">Số sân</span>
              <span className="font-semibold text-slate-900">
                {form.courtCount}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-slate-500">Điểm chạm</span>
              <span className="font-semibold text-slate-900">
                {form.pointToWin}
              </span>
            </div>
          </div>

          <div className="mt-5">
            <h3 className="mb-2 text-sm font-semibold text-slate-800">
              Danh sách đã chọn
            </h3>

            <div className="space-y-2">
              {selectedPlayers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500">
                  Chưa chọn người chơi nào.
                </div>
              ) : (
                selectedPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="rounded-xl border border-slate-200 px-4 py-3"
                  >
                    <div className="font-medium text-slate-900">
                      {player.name}
                    </div>
                    <div className="text-sm text-slate-500">
                      {player.nickname || "-"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}