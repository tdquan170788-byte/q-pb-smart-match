"use client";

type TabKey =
  | "play"
  | "overview"
  | "analytics"
  | "settings";

type Props = {
  active: TabKey;

  onChange: (
    tab: TabKey
  ) => void;
};

const tabs = [
  {
    key: "play",
    label: "Thi đấu",
  },
  {
    key: "overview",
    label: "Tổng quan",
  },
  {
    key: "analytics",
    label: "Phân tích",
  },
  {
    key: "settings",
    label: "Cài đặt",
  },
] satisfies {
  key: TabKey;

  label: string;
}[];

export default function SessionTabs({
  active,
  onChange,
}: Props) {
  return (
    <div className="rounded-2xl bg-slate-100 p-1">
      <div className="grid grid-cols-4 gap-1">
        {tabs.map((tab) => {
          const selected =
            active === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() =>
                onChange(tab.key)
              }
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                selected
                  ? "bg-white text-brand-700 shadow"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
