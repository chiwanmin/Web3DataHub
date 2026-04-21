import { evaluateAllAlerts, persistAlerts } from "@/lib/alerts/rules";

export async function runAlertEvaluation(): Promise<number> {
  const candidates = await evaluateAllAlerts();
  return persistAlerts(candidates);
}
