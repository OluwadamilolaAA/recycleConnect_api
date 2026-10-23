import { Queue, Worker, UnrecoverableError } from "bullmq";
import { Redis } from "ioredis";
import { Resend } from "resend";

import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

import { decryptEmailPayload } from "../modules/emails/email.payload.js";

type EmailJobData = {
  outboxId: string;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

const connection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

connection.on("error", (error) => {
  console.error("Email worker Redis connection error:", error.message);
});

const emailQueue = new Queue<EmailJobData>("emails", {
  connection,
});

emailQueue.on("error", (error) => {
  console.error("Email queue error:", error.message);
});

const resend = new Resend(env.RESEND_API_KEY);

const worker = new Worker<EmailJobData>(
  "emails",

  async (job) => {
    const email = await prisma.emailOutbox.findUnique({
      where: {
        id: job.data.outboxId,
      },
    });

    // Skip missing, already-sent, or cleared records.
    if (!email || email.sentAt || !email.encryptedPayload) {
      return;
    }

    // Never send an expired message.
    if (email.expiresAt <= new Date()) {
      await prisma.emailOutbox.update({
        where: {
          id: email.id,
        },
        data: {
          encryptedPayload: null,
        },
      });

      return;
    }

    const payload = decryptEmailPayload(email.encryptedPayload);

    const { data, error } = await resend.emails.send(payload, {
      idempotencyKey: `email/${email.id}`,
    });

    if (error) {
      const status = error.statusCode;

      console.error("Resend rejected an email request:", {
        outboxId: email.id,
        statusCode: status,
        errorName: error.name,
      });

      const permanentFailure =
        typeof status === "number" &&
        status >= 400 &&
        status < 500 &&
        ![408, 409, 429].includes(status);

      if (permanentFailure) {
        throw new UnrecoverableError(
          "Email request rejected. Check Resend configuration.",
        );
      }

      throw new Error("Email sending failed. The job can be retried.");
    }

    if (!data) {
      throw new Error("Email provider returned no confirmation.");
    }

    await prisma.emailOutbox.update({
      where: {
        id: email.id,
      },
      data: {
        sentAt: new Date(),
        encryptedPayload: null,
      },
    });

    console.log("Email accepted by Resend:", {
      outboxId: email.id,
    });
  },

  {
    connection,
    concurrency: 1,

    limiter: {
      max: 2,
      duration: 1000,
    },
  },
);

worker.on("failed", (job, error) => {
  console.error("Email job failed:", {
    jobId: job?.id,
    attemptsMade: job?.attemptsMade,
    message: error.message,
  });
});

worker.on("error", (error) => {
  console.error("Email worker processing error:", error.message);
});

let isDispatching = false;
let isStopping = false;

async function dispatchPendingEmails() {
  if (isDispatching || isStopping) {
    return;
  }

  isDispatching = true;

  try {
    // Clear sensitive contents from expired messages.
    await prisma.emailOutbox.updateMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
        encryptedPayload: {
          not: null,
        },
      },
      data: {
        encryptedPayload: null,
      },
    });

    let cursor: string | undefined;

    while (!isStopping) {
      const emails = await prisma.emailOutbox.findMany({
        where: {
          sentAt: null,

          encryptedPayload: {
            not: null,
          },

          expiresAt: {
            gt: new Date(),
          },

          ...(cursor
            ? {
                id: {
                  gt: cursor,
                },
              }
            : {}),
        },

        orderBy: {
          id: "asc",
        },

        take: 100,
      });

      for (const email of emails) {
        if (isStopping) {
          break;
        }

        await emailQueue.add(
          "send-email",

          {
            outboxId: email.id,
          },

          {
            jobId: email.id,

            attempts: 5,

            backoff: {
              type: "exponential",
              delay: 2000,
            },

            removeOnComplete: {
              age: 3600,
              count: 1000,
            },

            removeOnFail: {
              age: 7 * 24 * 60 * 60,
              count: 1000,
            },
          },
        );
      }

      if (emails.length < 100) {
        break;
      }

      cursor = emails[emails.length - 1]!.id;
    }
  } catch (error: unknown) {
    console.error(
      "Email dispatcher failed. It will try again:",
      getErrorMessage(error),
    );
  } finally {
    isDispatching = false;
  }
}

try {
  await prisma.$connect();
  console.log("Email worker connected to PostgreSQL.");

  await connection.ping();
  console.log("Email worker connected to Redis.");

  await dispatchPendingEmails();
} catch (error: unknown) {
  console.error("Email worker startup failed:", getErrorMessage(error));

  process.exit(1);
}

const dispatcherTimer = setInterval(() => {
  void dispatchPendingEmails();
}, 5000);

console.log("Email worker is running.");

async function shutdown(signal: string) {
  if (isStopping) {
    return;
  }

  isStopping = true;

  console.log(`${signal} received. Closing email worker...`);

  clearInterval(dispatcherTimer);

  const timeout = setTimeout(() => {
    console.error("Email worker shutdown timed out. Forcing exit.");

    process.exit(1);
  }, 15_000);

  timeout.unref();

  try {
    // Finish the current dispatch before closing its queue.
    while (isDispatching) {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 100);
      });
    }

    await worker.close();
    await emailQueue.close();
    await connection.quit();
    await prisma.$disconnect();

    clearTimeout(timeout);

    console.log("Email worker closed.");

    process.exit(0);
  } catch (error: unknown) {
    console.error("Email worker shutdown failed:", getErrorMessage(error));

    process.exit(1);
  }
}

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});

process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});
