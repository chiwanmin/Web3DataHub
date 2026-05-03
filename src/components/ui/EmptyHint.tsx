import { Loader2 } from "lucide-react";

export function EmptyHint({
  loading,
  empty,
  message,
  loadingText = "正在采集中…",
  emptyText = "暂无数据，等待下一个采集周期",
}: {
  loading?: boolean;
  empty?: boolean;
  message?: string;
  loadingText?: string;
  emptyText?: string;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-[14px] text-ink-mid">
        <Loader2 className="size-3.5 animate-spin text-brand" />
        {loadingText}
      </div>
    );
  }
  if (empty) {
    return (
      <div className="py-10 text-center text-[14px] text-ink-low">
        {message ?? emptyText}
      </div>
    );
  }
  return null;
}
