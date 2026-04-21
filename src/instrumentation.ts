export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const [{ ensureBootstrap }, { startScheduler }] = await Promise.all([
    import("@/lib/bootstrap"),
    import("@/jobs/scheduler"),
  ]);
  await ensureBootstrap();
  startScheduler();
}
