"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/page-header";
import SectionCard from "@/components/section-card";
import Button from "@/components/button";
import {
  createSession,
  ensureSeedData,
  getPlayers,
} from "@/lib/storage";
import type { Player, SessionFormValues } from "@/types";

const defaultForm: SessionFormValues = {
  date: new Date().toISOString().slice(0, 10),
  pointToWin: 11,
  participantIds: [],
  mode: "normal",
  courtCount: 1,
};

export default function SessionPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [form, setForm] = useState<SessionFormValues>(defaultForm);
  const [teamA, setTeamA] = useState<string[]>([]);
  const [teamB, setTeamB] = useState<string[]>([]);

  useEffect(() => {
    ensureSeedData();
    setPlayers(getPlayers());
  }, []);

  const selectedPlayers = useMemo(
    () => players.filter((p) => form.participantIds.includes(p.id)),
    [players, form.participantIds]
  );

  function toggleParticipant(playerId: string) {
    setForm((prev) => {
      const exists = prev.participantIds.includes(playerId);

      let nextIds = exists
        ? prev.participantIds.filter((id) => id !== playerId)
        : [...prev.participantIds, playerId];

      // nếu bỏ player khỏi participant thì cũng bỏ khỏi team A/B
      if (exists) {
        setTeamA((old) => old.filter((id) => id !== playerId));
        setTeamB((old) => old.filter((id) => id !== playerId));
      }

      return {
        ...prev,
        participantIds: nextIds,
      };
    });
  }

  function toggleTeamPlayer(side: "A" | "B", playerId: string) {
    if (!form.participantIds.includes(playerId)) return;

    if (side === "A") {
      setTeamA((prev) => {
        const exists = prev.includes(playerId);
        const next = exists
          ? prev.filter((id) => id !== playerId)
          : [...prev, playerId];

        if (!exists) {
          setTeamB((old) => old.filter((id) => id !== playerId));
        }

        return next;
      });
      return;
    }

    setTeamB((prev) => {
      const exists = prev.includes(playerId);
      const next = exists
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId];

      if (!exists) {
        setTeamA((old) => old.filter((id) => id !== playerId));
      }

      return next;
    });
  }

  function handleCreateSession() {
    if (!form.date) {
      alert("Vui lòng chọn ngày.");
      return;
    }

    if (form.participantIds.length < 4) {
      alert("Cần ít nhất 4 người để tạo session.");
      return;
    }

    if (form.mode === "team") {
      if (teamA.length === 0 || teamB.length === 0) {
        alert("Team mode cần chia đủ Team A và Team B.");
        return;
      }

      const totalAssigned = teamA.length + teamB.length;
      if (totalAssigned !== form.participantIds.length) {
        alert("Trong Team mode, tất cả người chơi phải được xếp vào Team A hoặc Team B.");
        return;
      }

      createSession({
        date: form.date,
        pointToWin: form.pointToWin,
        participantIds: form.participantIds,
        mode: "team",
        courtCount: form.courtCount,
        teamConfig: {
          teamAPlayerIds: teamA,
          teamBPlayerIds: teamB,
        },
      });

      alert("Đã tạo session Team mode.");
    } else {
      createSession({
        date: form.date,
        pointToWin: form.pointToWin,
        participantIds: form.participantIds,
        mode: "normal",
        courtCount: form.courtCount,
      });

      alert("Đã tạo session normal mode.");
    }

    setForm({
      ...defaultForm,
      date: new Date().toISOString().slice(0, 10),
    });
    setTeamA([]);
    setTeamB([]);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tạo buổi chơi"
        description="Chọn người chơi, chế độ đấu và số sân."
      />

      <SectionCard title="Thông tin session">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <div className="text-sm font-medium text-slate-700">Ngày chơi</div>
            <input
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, date: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
            />
          </label>

          <label className="space-y-2">
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
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
            />
          </label>

          <label className="space-y-2">
            <div className="text-sm font-medium text-slate-700">Chế độ</div>
            <select
              value={form.mode}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  mode: e.target.value as "normal" | "team",
                }))
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
            >
              <option value="normal">Normal mode</option>
              <option value="team">Team mode</option>
            </select>
          </label>

          <label className="space-y-2">
            <div className="text-sm font-medium text-slate-700">Số sân</div>
            <input
              type="number"
              min={1}
              max={8}
              value={form.courtCount}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  courtCount: Math.max(1, Number(e.target.value) || 1),
                }))
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
            />
          </label>
        </div>
      </SectionCard>

      <SectionCard
        title={`Chọn người chơi (${form.participantIds.length}/${players.length})`}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((player) => {
            const checked = form.participantIds.includes(player.id);

            return (
              <label
                key={player.id}
                className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 transition ${
                  checked
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white hover:border-slate-400"
                }`}
              >
                <div>
                  <div className="font-semibold">{player.name}</div>
                  <div
                    className={`text-sm ${
                      checked ? "text-slate-200" : "text-slate-500"
                    }`}
                  >
                    {player.nickname || "—"}
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
      </SectionCard>

      {form.mode === "team" && (
        <SectionCard title="Chia team">
          <div className="mb-4 text-sm text-slate-600">
            Mỗi người chỉ được thuộc <strong>1 team</strong>. Team mode sẽ ghép
            cặp sao cho <strong>Team A đấu Team B</strong>, không có chuyện người
            cùng team đánh với nhau.
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <div className="mb-3 font-semibold text-blue-900">
                Team A ({teamA.length})
              </div>

              <div className="space-y-2">
                {selectedPlayers.map((player) => {
                  const checked = teamA.includes(player.id);

                  return (
                    <label
                      key={`A_${player.id}`}
                      className="flex items-center justify-between rounded-xl bg-white px-3 py-2"
                    >
                      <span>{player.name}</span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTeamPlayer("A", player.id)}
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <div className="mb-3 font-semibold text-rose-900">
                Team B ({teamB.length})
              </div>

              <div className="space-y-2">
                {selectedPlayers.map((player) => {
                  const checked = teamB.includes(player.id);

                  return (
                    <label
                      key={`B_${player.id}`}
                      className="flex items-center justify-between rounded-xl bg-white px-3 py-2"
                    >
                      <span>{player.name}</span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTeamPlayer("B", player.id)}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      <SectionCard title="Tóm tắt">
        <div className="space-y-2 text-sm text-slate-700">
          <div>Ngày: {form.date || "-"}</div>
          <div>Điểm chạm: {form.pointToWin}</div>
          <div>Mode: {form.mode}</div>
          <div>Số sân: {form.courtCount}</div>
          <div>Số người chơi: {form.participantIds.length}</div>
          {form.mode === "team" && (
            <>
              <div>Team A: {teamA.length} người</div>
              <div>Team B: {teamB.length} người</div>
            </>
          )}
        </div>

        <div className="mt-4">
          <Button onClick={handleCreateSession}>Tạo session</Button>
        </div>
      </SectionCard>
    </div>
  );
}