"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import type { Member, MemberForm } from "@/types";

type MemberFormSheetProps = {
  open: boolean;
  mode: "create" | "edit";
  member: Member | null;
  onClose: () => void;
  onSubmit: (form: MemberForm) => void;
};

const defaultForm: MemberForm = {
  name: "",
  nickname: "",
};

export default function MemberFormSheet({
  open,
  mode,
  member,
  onClose,
  onSubmit,
}: MemberFormSheetProps) {
  const [form, setForm] = useState<MemberForm>(defaultForm);

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && member) {
      setForm({
        name: member.name,
        nickname: member.nickname ?? "",
      });
    } else {
      setForm(defaultForm);
    }
  }, [open, mode, member]);

  if (!open) {
    return null;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const name = form.name.trim();

    if (!name) {
      return;
    }

    onSubmit({
      name,
      nickname: form.nickname?.trim() ?? "",
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/30 sm:items-center sm:justify-center">
      <div className="w-full rounded-t-3xl bg-white p-5 shadow-xl sm:max-w-md sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {mode === "create"
              ? "Thêm thành viên"
              : "Chỉnh sửa thành viên"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Tên thành viên
            </label>

            <input
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="Ví dụ: Quân"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nickname
            </label>

            <input
              value={form.nickname ?? ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  nickname: e.target.value,
                }))
              }
              placeholder="Ví dụ: Q"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 font-medium text-slate-700"
            >
              Huỷ
            </button>

            <button
              type="submit"
              className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white"
            >
              {mode === "create"
                ? "Tạo thành viên"
                : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
