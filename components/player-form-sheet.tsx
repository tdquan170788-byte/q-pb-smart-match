"use client";

import { useEffect, useState } from "react";
import type { Player, PlayerForm } from "@/types";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  player: Player | null;
  onClose: () => void;
  onSubmit: (form: PlayerForm) => void;
};

const defaultForm: PlayerForm = {
  name: "",
  nickname: "",
};

export default function PlayerFormSheet({
  open,
  mode,
  player,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<PlayerForm>(defaultForm);

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && player) {
      setForm({
        name: player.name,
        nickname: player.nickname ?? "",
      });
      return;
    }

    setForm(defaultForm);
  }, [open, mode, player]);

  if (!open) return null;

  function handleSubmit() {
    if (!form.name.trim()) return;
    onSubmit({
      name: form.name.trim(),
      nickname: form.nickname.trim(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl">
        <div className="mb-4">
          <h3 className="text-lg font-bold">
            {mode === "create" ? "Thêm thành viên" : "Sửa thành viên"}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Nhập tên và biệt danh nếu có.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Tên
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
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Biệt danh
            </label>
            <input
              value={form.nickname}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, nickname: e.target.value }))
              }
              placeholder="Ví dụ: Quân Lì"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700"
          >
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white"
          >
            {mode === "create" ? "Tạo" : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}