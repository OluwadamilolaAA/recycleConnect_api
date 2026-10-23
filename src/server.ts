import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

try {
  await prisma.$connect();

  await prisma.$queryRaw`SELECT 1`;

  console.log("Connected to PostgreSQL.");
} catch (error) {
  console.error("Could not connect to PostgreSQL:", error);

  try {
    await prisma.$disconnect();
  } catch (disconnectError) {
    console.error("Failed to disconnect Prisma:", disconnectError);
  }

  process.exit(1);
}

const server = app.listen(env.PORT, () => {
  console.log(`RecycleConnect API is running at http://localhost:${env.PORT}`);
});

let isShuttingDown = false;

function shutdown(signal: string, exitCode = 0) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log(`${signal} received. Closing the HTTP server...`);

  const timeout = setTimeout(() => {
    console.error("Shutdown timed out. Forcing exit.");
    process.exit(1);
  }, 10_000);

  timeout.unref();

  server.close(async (error) => {
    let finalExitCode = exitCode;

    if (error) {
      console.error("Failed to close the HTTP server:", error.message);
      finalExitCode = 1;
    }

    try {
      await prisma.$disconnect();
      console.log("Database disconnected.");
    } catch (disconnectError) {
      console.error("Failed to disconnect Prisma:", disconnectError);
      finalExitCode = 1;
    }

    clearTimeout(timeout);

    process.exitCode = finalExitCode;
  });
}

server.on("error", (error) => {
  console.error("Failed to start the HTTP server:", error.message);

  shutdown("HTTP server error", 1);
});

process.on("SIGINT", () => shutdown("SIGINT"));

process.on("SIGTERM", () => shutdown("SIGTERM"));
