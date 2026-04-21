"use client";

import { useEffect, useState } from "react";

export function LiveBadge({ label = "实时状态" }: { label?: string }) {
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNow(
        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(
          2,
          "0",
        )}:${String(d.getSeconds()).padStart(2, "0")}`,
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-center gap-2.5">
      <div className="pill bg-ok/10 text-ok ring-1 ring-ok/20">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inset-0 animate-ping rounded-full bg-ok/60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ok" />
        </span>
        <span className="font-medium">{label}</span>
      </div>
      <div className="num text-[12px] text-ink-mid">{now}</div>
    </div>
  );
}
