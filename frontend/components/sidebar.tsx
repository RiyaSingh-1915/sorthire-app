"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, FileUser, Briefcase, BarChart3, Radar } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/profile", label: "Resume", icon: FileUser },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="glass-strong fixed left-0 top-0 h-screen w-60 flex flex-col justify-between p-5 z-20">
      <div>
        <div className="flex items-center gap-2 mb-10 px-1">
          <Radar className="text-signal" size={22} />
          <span className="font-display font-bold text-lg">SortHire</span>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-signal/15 text-signal" : "hover:bg-current/5 opacity-80"
                )}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
      <ThemeToggle />
    </aside>
  );
}
