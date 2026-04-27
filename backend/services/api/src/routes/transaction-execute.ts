import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { saveChatMessage } from "../services/chat.js";

const executeBodySchema = z.object({
  walletAddress: z.string().optional(),
  transactionId: z.string(),
  txHash: z.string().optional(),
  signedTx: z.string().optional(),
});

export async function transactionExecuteRoutes(app: FastifyInstance) {
  app.post<{ Body: z.infer<typeof executeBodySchema> }>("/execute", {
    handler: async (request, reply) => {
      const parsed = executeBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Invalid request body",
          details: parsed.error.flatten(),
        });
      }

      const {
        walletAddress,
        transactionId,
        txHash: clientTxHash,
      } = parsed.data;

      const transaction = await prisma.transaction.findFirst({
        where: walletAddress
          ? { id: transactionId, user: { walletAddress } }
          : { id: transactionId },
      });
      if (!transaction) {
        return reply.status(404).send({ error: "Transaction not found" });
      }

      if (
        transaction.status === "submitted" ||
        transaction.status === "confirmed"
      ) {
        return reply.status(400).send({
          error: `Transaction already ${transaction.status}`,
        });
      }

      try {
        const txHash =
          clientTxHash ||
          "0x" +
            Array.from({ length: 64 }, () =>
              Math.floor(Math.random() * 16).toString(16),
            ).join("");

        const isMock = !clientTxHash;

        const explorerBase =
          transaction.chainId === 11155111
            ? "https://sepolia.etherscan.io/tx"
            : transaction.chainId === 8453
              ? "https://basescan.org/tx"
              : "https://etherscan.io/tx";

        const updatedTx = await prisma.transaction.update({
          where: { id: transactionId },
          data: {
            status: "submitted",
            txHash,
            submittedAt: new Date(),
            ...(isMock && { gasUsed: "150000", gasCostUsd: 2.5 }),
          },
        });

        const successMsg = isMock
          ? `✅ Transaction submitted (test mode)! TxHash: ${txHash}`
          : `✅ Transaction successful! View on explorer: ${explorerBase}/${txHash}`;

        await saveChatMessage(
          walletAddress || transaction.fromAddress,
          "agent",
          successMsg,
          transaction.sessionId,
        );

        return reply.send({
          status: "submitted",
          transaction: updatedTx,
          txHash,
          explorerUrl: `${explorerBase}/${txHash}`,
        });
      } catch (err) {
        request.log.error(err, "Transaction execution failed");

        await prisma.transaction.update({
          where: { id: transactionId },
          data: { status: "failed" },
        });

        await saveChatMessage(
          walletAddress || transaction.fromAddress,
          "agent",
          `❌ Transaction failed: ${err instanceof Error ? err.message : "Unknown error"}`,
          transaction.sessionId,
        );

        return reply.status(500).send({
          error: "Failed to execute transaction",
        });
      }
    },
  });
}
