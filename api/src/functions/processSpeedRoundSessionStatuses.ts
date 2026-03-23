import { app, InvocationContext, Timer } from "@azure/functions";
import { getDbPool } from "../shared/db";
import { syncSpeedRoundSessionStatuses } from "../shared/speedRoundSessions";

export async function processSpeedRoundSessionStatuses(
  _timer: Timer,
  context: InvocationContext
): Promise<void> {
  context.log("Speed round session status processor tick.");

  try {
    const pool = await getDbPool();
    await syncSpeedRoundSessionStatuses(pool);
  } catch (error) {
    context.error("Speed round session status processor failed.", error);
  }
}

app.timer("process-speed-round-session-statuses", {
  schedule: "0 * * * * *",
  handler: processSpeedRoundSessionStatuses
});
