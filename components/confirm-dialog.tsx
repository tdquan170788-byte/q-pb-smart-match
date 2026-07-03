"use client";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Huỷ",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-xl">
        <div className="text-lg font-bold text-slate-900">{title}</div>

        {description ? (
          <div className="mt-2 text-sm leading-6 text-slate-600">
            {description}
          </div>
        ) : null}

        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            className={`flex-1 rounded-2xl px-4 py-3 font-semibold text-white ${
              danger ? "bg-red-600" : "bg-brand-600"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}