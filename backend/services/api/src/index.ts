import "dotenv/config.js";

import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";

import { authRoutes } from "./routes/auth.js";
import { contactRoutes } from "./routes/contacts.js";
import { chatRoutes } from "./routes/chat.js";
import { intentRoutes } from "./routes/intent.js";
import { transactionExecuteRoutes } from "./routes/transaction-execute.js";
import { prisma } from "./db.js";

const app = Fastify({
  logger: true,
});

// Plugins
await app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
});

await app.register(cors, {
  origin: process.env.CORS_ORIGIN?.split(",") ?? [
    "http://localhost:3000",
    "http://localhost:5173",
  ],
  credentials: true,
});

await app.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute",
});

// Health check
app.get("/health", async () => {
  return { status: "ok" };
});

// Routes
await app.register(authRoutes, { prefix: "/api/auth" });
await app.register(contactRoutes, { prefix: "/api/contacts" });
await app.register(chatRoutes, { prefix: "/api/chat" });
await app.register(intentRoutes, { prefix: "/api/intent" });
await app.register(transactionExecuteRoutes, { prefix: "/api/transactions" });

// Error handler
app.setErrorHandler(
  async (error: Error & { statusCode?: number }, request, reply) => {
    request.log.error(error);
    return reply.status(error.statusCode ?? 500).send({
      error: error.message ?? "Internal Server Error",
    });
  },
);

// Graceful shutdown
const shutdown = async () => {
  await prisma.$disconnect();
  await app.close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Start
const port = parseInt(process.env.PORT!, 10);
const host = "0.0.0.0";

try {
  await app.listen({ port, host });
  app.log.info(`Server running on ${host}:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

export { app };
