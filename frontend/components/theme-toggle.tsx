"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-current/5 transition-colors"
    >
      {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
