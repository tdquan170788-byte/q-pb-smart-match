"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, RotateCcw, Trash2, Users } from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import PlayerFormSheet from "@/components/player-form-sheet";
import ConfirmDialog from "@/components/confirm-dialog";
import type { Player, PlayerForm } from "@/types";
import {
  createPlayer,
  deletePlayer,
  ensureSeedData,
  getPlayers,
  resetSeedPlayers,
  updatePlayer,
} from "@/lib/storage";

export default function MembersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Player | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    ensureSeedData();
    setPlayers(getPlayers());
    setLoaded(true);
  }, []);

  const playerCount = players.length;

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [players]);

  function refreshPlayers() {
    setPlayers(getPlayers());
  }

  function openCreate() {
    setEditingPlayer(null);
    setSheetMode("create");
    setSheetOpen(true);
  }

  function openEdit(player: Player) {
    setEditingPlayer(player);
    setSheetMode("edit");
    setSheetOpen(true);
  }

  function handleSubmit(form: PlayerForm) {
    if (!form.name.trim()) return;

    if (sheetMode === "create") {
      createPlayer(form);
    } else if (editingPlayer) {
      updatePlayer(editingPlayer.id, form);
    }

    refreshPlayers();
    setSheetOpen(false);
    setEditingPlayer(null);
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deletePlayer(deleteTarget.id);
    refreshPlayers();
    setDeleteTarget(null);
  }

  function handleResetSeed() {
    resetSeedPlayers();
    refreshPlayers();
    setResetOpen(false);
  }

  return (
    <AppShell
      title="Thành viên"
      subtitle="Quản lý danh sách người chơi cho Q-PB Smart Match"
    >
      <div className="space-y-4">
        <SectionCard
          title="Tổng quan thành viên"
          action={
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white"
            >
              <Plus size={16} />
              Thêm
            </button>
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Số thành viên</div>
              <div className="mt-2 text-3xl font-bold">{playerCount}</div>
              <div className="mt-1 text-xs text-slate-400">
                Dùng cho xếp cặp và thống kê
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Dữ liệu hiện tại</div>
              <div className="mt-2 text-lg font-bold">
                {loaded ? "Đã tải" : "Đang tải..."}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Lưu cục bộ trên iPhone
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={openCreate}
              className="flex-1 rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white"
            >
              + Thêm thành viên
            </button>

            <button
              onClick={() => setResetOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700"
            >
              <RotateCcw size={16} />
              Seed lại
            </button>
          </div>
        </SectionCard>

        <SectionCard title="Danh sách thành viên">
          {sortedPlayers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Users className="text-slate-500" size={22} />
              </div>
              <div className="text-base font-semibold">Chưa có thành viên</div>
              <div className="mt-1 text-sm text-slate-500">
                Hãy thêm người chơi đầu tiên cho nhóm pickleball của bạn.
              </div>
              <button
                onClick={openCreate}
                className="mt-4 rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white"
              >
                Thêm thành viên đầu tiên
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-base font-semibold">
                            {player.name}
                          </div>
                          <div className="text-sm text-slate-500">
                            {player.nickname?.trim()
                              ? `Biệt danh: ${player.nickname}`
                              : "Chưa có biệt danh"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-white px-3 py-1 text-slate-600">
                          Rating: {player.rating}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-slate-600">
                          W: {player.wins}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-slate-600">
                          L: {player.losses}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-slate-600">
                          M: {player.matches}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => openEdit(player)}
                        className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700"
                        aria-label={`Sửa ${player.name}`}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        onClick={() => setDeleteTarget(player)}
                        className="rounded-xl border border-red-200 bg-white p-2 text-red-600"
                        aria-label={`Xóa ${player.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Ghi chú Sprint 6A">
          <div className="space-y-2 text-sm text-slate-600">
            <div>• Thành viên được lưu bằng localStorage trên máy hiện tại.</div>
            <div>• Có thể thêm / sửa / xóa / reset dữ liệu mẫu.</div>
            <div>• Sprint tiếp theo sẽ dùng danh sách này để tạo session và xếp lịch.</div>
          </div>
        </SectionCard>
      </div>

      <PlayerFormSheet
        open={sheetOpen}
        mode={sheetMode}
        player={editingPlayer}
        onClose={() => {
          setSheetOpen(false);
          setEditingPlayer(null);
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xoá thành viên?"
        description={
          deleteTarget
            ? `Bạn có chắc muốn xoá ${deleteTarget.name} khỏi danh sách thành viên không?`
            : ""
        }
        confirmText="Xoá"
        cancelText="Huỷ"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />

      <ConfirmDialog
        open={resetOpen}
        title="Seed lại dữ liệu mẫu?"
        description="Thao tác này sẽ thay toàn bộ danh sách hiện tại bằng 8 thành viên mẫu ban đầu."
        confirmText="Seed lại"
        cancelText="Huỷ"
        onCancel={() => setResetOpen(false)}
        onConfirm={handleResetSeed}
      />
    </AppShell>
  );
}