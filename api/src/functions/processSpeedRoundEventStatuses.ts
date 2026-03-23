import { app, InvocationContext, Timer } from "@azure/functions";
import { getDbPool } from "../shared/db";
import { syncSpeedRoundEventStatuses } from "../shared/speedRoundEvents";

export async function processSpeedRoundEventStatuses(
  _timer: Timer,
  context: InvocationContext
): Promise<void> {
  context.log("Speed round event status processor tick.");

  try {
    const pool = await getDbPool();
    await syncSpeedRoundEventStatuses(pool);
  } catch (error) {
    context.error("Speed round event status processor failed.", error);
  }
}

app.timer("process-speed-round-event-statuses", {
  schedule: "0 * * * * *",
  handler: processSpeedRoundEventStatuses
});
