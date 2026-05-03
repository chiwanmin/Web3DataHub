import { AlertTriangle, RefreshCw } from "lucide-react";
import { useSWRConfig } from "swr";

export function ErrorBanner({ message, url }: { message?: string; url?: string }) {
  const { mutate } = useSWRConfig();

  return (
    <div className="flex items-center gap-3 rounded-lg border border-bad/25 bg-bad/[0.03] px-4 py-3.5">
      <div className="flex size-8 items-center justify-center rounded bg-bad/12 text-bad shrink-0">
        <AlertTriangle className="size-3.5" strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold text-bad">数据加载失败</div>
        <div className="text-[13px] text-ink-mid mt-0.5 truncate">{message ?? "网络异常或服务不可用"}</div>
      </div>
      {url ? (
        <button
          onClick={() => mutate(url)}
          className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-[13px] text-ink-mid hover:text-ink-high hover:bg-white/[0.04] transition-colors"
        >
          <RefreshCw className="size-3" />
          重试
        </button>
      ) : null}
    </div>
  );
}
