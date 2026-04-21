import { Cron } from "croner";
import { CHAINS } from "@/lib/chains/registry";
import { collectBlocksFor } from "./collectBlocks";
import { collectAllGas } from "./collectGas";
import { collectAllMempool } from "./collectMempool";
import { collectAllNodeVersions } from "./collectNodeVersions";
import { runAlertEvaluation } from "./evaluateAlerts";

let started = false;

export function startScheduler(): void {
  if (started) return;
  if (process.env.WEB3VIEW_DISABLE_SCHEDULER === "true") {
    console.log("[scheduler] disabled via env");
    return;
  }
  started = true;

  for (const chain of CHAINS) {
    /**
     * Interval policy for sampling block headers:
     *   - Floor at 10s (avoid public-RPC throttling for fast chains)
     *   - Cap at 5 min (we don't need higher latency for slow chains either)
     *   - Snap to 15/30/60 to stay cron-friendly
     */
    const desired = Math.max(10, Math.min(300, Math.round(chain.normalBlockTime)));
    let pattern: string;
    if (desired >= 60) {
      const m = Math.max(1, Math.min(5, Math.round(desired / 60)));
      pattern = `0 */${m} * * * *`;
    } else if (desired >= 30) {
      pattern = `*/30 * * * * *`;
    } else if (desired >= 15) {
      pattern = `*/15 * * * * *`;
    } else {
      pattern = `*/10 * * * * *`;
    }
    new Cron(pattern, { name: `blocks:${chain.id}` }, () => {
      collectBlocksFor(chain.id).catch((e) =>
        console.warn(`[blocks ${chain.id}]`, e),
      );
    });
  }

  new Cron("*/30 * * * * *", { name: "gas" }, () => {
    collectAllGas().catch((e) => console.warn("[gas]", e));
  });

  new Cron("0 * * * * *", { name: "mempool" }, () => {
    collectAllMempool().catch((e) => console.warn("[mempool]", e));
  });

  new Cron("0 0 */1 * * *", { name: "nodeVersions" }, () => {
    collectAllNodeVersions().catch((e) => console.warn("[nodeVersions]", e));
  });

  new Cron("0 */1 * * * *", { name: "alerts" }, () => {
    runAlertEvaluation().catch((e) => console.warn("[alerts]", e));
  });

  console.log(
    `[scheduler] started: ${CHAINS.length} block collectors + gas/mempool/versions/alerts`,
  );

  setTimeout(() => {
    Promise.all(CHAINS.map((c) => collectBlocksFor(c.id))).catch(() => {});
    collectAllGas().catch(() => {});
    collectAllNodeVersions().catch(() => {});
  }, 1500);
}
