"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, Settings, Trophy, Users } from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/members", label: "Members", icon: Users },
  { href: "/sessions", label: "Session", icon: CalendarDays },
  { href: "/ranking", label: "Ranking", icon: Trophy },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-5 px-2 py-2">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-xs ${
                active ? "text-brand-600" : "text-slate-500"
              }`}
            >
              <Icon size={18} />
              <span className="mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
