import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { getChatHistory, saveChatMessage } from "../services/chat.js";

export async function chatRoutes(app: FastifyInstance) {
  // GET /chat/history — get user's chat history
  app.get<{
    Querystring: { walletAddress: string; sessionId?: string };
  }>("/history", {
    handler: async (request, reply) => {
      const { walletAddress, sessionId } = request.query;

      if (!walletAddress) {
        return reply
          .status(400)
          .send({ error: "walletAddress query param required" });
      }

      const chats = await getChatHistory(walletAddress, sessionId);
      return reply.send(chats);
    },
  });

  app.post<{
    Body: {
      walletAddress: string;
      role: string;
      message: string;
      sessionId: string;
    };
  }>("/save", {
    handler: async (request, reply) => {
      const { walletAddress, role, message, sessionId } = request.body;
      if (!walletAddress || !role || !message || !sessionId) {
        return reply.status(400).send({ error: "Missing required fields" });
      }
      const chat = await saveChatMessage(
        walletAddress,
        role,
        message,
        sessionId,
      );
      return reply.send(chat);
    },
  });

  // GET /chat/sessions — get all unique sessions for a user
  app.get<{
    Querystring: { walletAddress: string };
  }>("/sessions", {
    handler: async (request, reply) => {
      const { walletAddress } = request.query;

      if (!walletAddress) {
        return reply
          .status(400)
          .send({ error: "walletAddress query param required" });
      }

      const user = await prisma.user.findUnique({ where: { walletAddress } });
      if (!user) return reply.status(404).send({ error: "User not found" });

      // Get all unique sessions with their first and last message
      const sessions = await prisma.chat.groupBy({
        by: ["sessionId"],
        where: { userId: user.id },
        _max: { createdAt: true },
        _min: { createdAt: true },
        orderBy: { _max: { createdAt: "desc" } },
      });

      // Get first user message for each session as preview
      const sessionsWithPreview = await Promise.all(
        sessions.map(async (s) => {
          const firstMessage = await prisma.chat.findFirst({
            where: { sessionId: s.sessionId, userId: user.id, role: "user" },
            orderBy: { createdAt: "asc" },
          });
          return {
            sessionId: s.sessionId,
            preview: firstMessage?.message?.substring(0, 50) || "Untitled",
            timestamp: s._max.createdAt,
          };
        }),
      );

      return reply.send(sessionsWithPreview);
    },
  });
}
