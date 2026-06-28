import { logger } from "./logger.js";
import { AttachmentWorker } from "./worker.js";

const worker = new AttachmentWorker();
let stopping = false;

process.on("SIGINT", () => {
  stopping = true;
});

process.on("SIGTERM", () => {
  stopping = true;
});

async function main(): Promise<void> {
  logger.info("Attachment summarizer worker started");
  while (!stopping) {
    const count = await worker.pollOnce();
    if (count === 0) {
      logger.debug("No SQS messages received");
    }
  }
  await worker.shutdown();
  logger.info("Attachment summarizer worker stopped");
}

main().catch(async (error) => {
  logger.fatal({ error }, "Fatal worker error");
  await worker.shutdown().catch(() => undefined);
  process.exitCode = 1;
});

