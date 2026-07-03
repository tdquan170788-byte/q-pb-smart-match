"use client";

import { useEffect, useState } from "react";
import type { Player, PlayerForm } from "@/types";

type PlayerFormSheetProps = {
  open: boolean;
  mode: "create" | "edit";
  player: Player | null;
  onClose: () => void;
  onSubmit: (form: PlayerForm) => void;
};

export default function PlayerFormSheet({
  open,
  mode,
  player,
  onClose,
  onSubmit,
}: PlayerFormSheetProps) {
  const [form, setForm] = useState<PlayerForm>({
    name: "",
    nickname: "",
  });

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && player) {
      setForm({
        name: player.name ?? "",
        nickname: player.nickname ?? "",
      });
    } else {
      setForm({
        name: "",
        nickname: "",
      });
    }
  }, [open, mode, player]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit({
      name: form.name.trim(),
      nickname: form.nickname.trim(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40">
      <div className="w-full rounded-t-3xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-bold">
              {mode === "create" ? "Thêm thành viên" : "Sửa thành viên"}
            </div>
            <div className="text-sm text-slate-500">
              Nhập tên và biệt danh người chơi
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600"
          >
            Đóng
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Tên thành viên
            </label>
            <input
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Ví dụ: Quân"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Biệt danh
            </label>
            <input
              value={form.nickname}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, nickname: e.target.value }))
              }
              placeholder="Ví dụ: Quân trái"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700"
            >
              Huỷ
            </button>

            <button
              type="submit"
              className="flex-1 rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white"
            >
              {mode === "create" ? "Tạo thành viên" : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}