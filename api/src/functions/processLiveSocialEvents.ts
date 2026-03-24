import { app, InvocationContext, Timer } from "@azure/functions";
import { getDbPool } from "../shared/db";
import { ensureNext30DaysLiveSocialEvents, syncSpeedRoundEventStatuses } from "../shared/speedRoundEvents";

export async function processLiveSocialEvents(
  _timer: Timer,
  context: InvocationContext
): Promise<void> {
  context.log("Live social event processor tick.");

  try {
    const pool = await getDbPool();
    await ensureNext30DaysLiveSocialEvents(pool);
    await syncSpeedRoundEventStatuses(pool);
  } catch (error) {
    context.error("Live social event processor failed.", error);
  }
}

app.timer("process-live-social-events", {
  schedule: "0 0 * * * *",
  handler: processLiveSocialEvents
});
