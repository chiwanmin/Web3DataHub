"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/cn";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "flex items-center justify-center size-8 rounded-lg",
        "text-ink-mid hover:text-ink-high hover:bg-white/[0.05] transition-colors",
        className,
      )}
      title={theme === "dark" ? "切换到亮色模式" : "切换到暗色模式"}
    >
      {theme === "dark" ? (
        <Moon className="size-4" strokeWidth={1.8} />
      ) : (
        <Sun className="size-4" strokeWidth={1.8} />
      )}
    </button>
  );
}
