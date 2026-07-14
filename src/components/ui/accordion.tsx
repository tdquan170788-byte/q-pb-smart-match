"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

type Props = {
  title: React.ReactNode;

  subtitle?: React.ReactNode;

  defaultOpen?: boolean;

  children: React.ReactNode;

  right?: React.ReactNode;
};

export default function Accordion({
  title,
  subtitle,
  defaultOpen = false,
  children,
  right,
}: Props) {
  const [open, setOpen] =
    useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() =>
          setOpen(!open)
        }
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <div className="min-w-0">
          <div className="font-semibold text-slate-900">
            {title}
          </div>

          {subtitle ? (
            <div className="mt-1 text-xs text-slate-500">
              {subtitle}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          {right}

          <ChevronDown
            size={18}
            className={`transition ${
              open
                ? "rotate-180"
                : ""
            }`}
          />
        </div>
      </button>

      {open ? (
        <div className="border-t border-slate-200 p-4">
          {children}
        </div>
      ) : null}
    </div>
  );
}