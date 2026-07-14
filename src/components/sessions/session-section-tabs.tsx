"use client";

import {
  BarChart3,
  CalendarRange,
  LayoutDashboard,
  Swords,
} from "lucide-react";

export type SessionSectionId =
  | "overview"
  | "play"
  | "analytics"
  | "schedule";

type SessionSectionTabsProps = {
  activeSection: SessionSectionId;

  onChange: (
    section: SessionSectionId
  ) => void;

  completedMatches?: number;

  totalMatches?: number;
};

type SessionSectionOption = {
  id: SessionSectionId;

  label: string;

  shortLabel: string;

  description: string;

  icon: React.ReactNode;
};

const SESSION_SECTIONS:
  SessionSectionOption[] = [
    {
      id: "overview",

      label: "Tổng quan",

      shortLabel: "Tổng quan",

      description:
        "Tiến độ và điểm nổi bật",

      icon: (
        <LayoutDashboard
          size={18}
        />
      ),
    },

    {
      id: "play",

      label: "Thi đấu",

      shortLabel: "Thi đấu",

      description:
        "Nhập và theo dõi tỷ số",

      icon: (
        <Swords
          size={18}
        />
      ),
    },

    {
      id: "analytics",

      label: "Phân tích",

      shortLabel: "Phân tích",

      description:
        "Chất lượng và cân bằng lịch",

      icon: (
        <BarChart3
          size={18}
        />
      ),
    },

    {
      id: "schedule",

      label: "Lịch & cài đặt",

      shortLabel: "Lịch",

      description:
        "Đóng băng và cấu hình lịch",

      icon: (
        <CalendarRange
          size={18}
        />
      ),
    },
  ];

export default function SessionSectionTabs({
  activeSection,
  onChange,
  completedMatches = 0,
  totalMatches = 0,
}: SessionSectionTabsProps) {
  const safeCompletedMatches =
    normalizeNonNegativeInteger(
      completedMatches
    );

  const safeTotalMatches =
    Math.max(
      safeCompletedMatches,
      normalizeNonNegativeInteger(
        totalMatches
      )
    );

  return (
    <div className="sticky top-2 z-20 rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur">
      <div className="grid grid-cols-4 gap-2">
        {SESSION_SECTIONS.map(
          (section) => {
            const active =
              activeSection ===
              section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() =>
                  onChange(
                    section.id
                  )
                }
                aria-pressed={
                  active
                }
                className={`relative min-w-0 rounded-2xl px-2 py-3 text-center transition ${
                  active
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <div className="flex justify-center">
                  {section.icon}
                </div>

                <div className="mt-1 truncate text-xs font-semibold sm:hidden">
                  {
                    section.shortLabel
                  }
                </div>

                <div className="mt-1 hidden truncate text-sm font-semibold sm:block">
                  {
                    section.label
                  }
                </div>

                <div
                  className={`mt-1 hidden truncate text-xs lg:block ${
                    active
                      ? "text-white/75"
                      : "text-slate-400"
                  }`}
                >
                  {
                    section.description
                  }
                </div>

                {section.id ===
                  "play" &&
                safeTotalMatches >
                  0 ? (
                  <div
                    className={`absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      active
                        ? "bg-white text-brand-700"
                        : safeCompletedMatches >=
                            safeTotalMatches
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {
                      safeCompletedMatches
                    }
                    /
                    {
                      safeTotalMatches
                    }
                  </div>
                ) : null}
              </button>
            );
          }
        )}
      </div>
    </div>
  );
}

function normalizeNonNegativeInteger(
  value: number
): number {
  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return 0;
  }

  return Math.floor(value);
}