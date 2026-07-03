"use client";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Huỷ",
  danger = false,
  onCancel,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
        <h3 className="text-lg font-bold">{title}</h3>
        {description ? (
          <p className="mt-2 text-sm text-slate-600">{description}</p>
        ) : null}

        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 font-medium text-slate-700"
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