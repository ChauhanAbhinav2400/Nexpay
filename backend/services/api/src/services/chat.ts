import { prisma } from "../db.js";

export async function saveChatMessage(
  walletAddress: string,
  role: "user" | "agent",
  message: string,
  sessionId: string,
) {
  const user = await prisma.user.findUnique({
    where: { walletAddress },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const chat = await prisma.chat.create({
    data: {
      userId: user.id,
      role,
      message,
      sessionId,
    },
  });

  return chat;
}

export async function getChatHistory(
  walletAddress: string,
  sessionId?: string,
) {
  const user = await prisma.user.findUnique({
    where: { walletAddress },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const chats = await prisma.chat.findMany({
    where: {
      userId: user.id,
      ...(sessionId && { sessionId }),
    },
    orderBy: { createdAt: "asc" },
  });

  return chats;
}
