import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { saveChatMessage, getChatHistory } from "../services/chat.js";
import {
  callClaude,
  buildSystemPrompt,
} from "../services/ai/intent-processor.js";
import { v4 as uuidv4 } from "uuid";
import {
  getUniswapQuote,
  buildSwapCalldata
  SWAP_ROUTER_ADDRESS,
} from "../services/swap/uniswap.js";

const processBodySchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM address"),
  message: z.string().min(1).max(500),
  sessionId: z.string().uuid().optional(),
});

export async function intentRoutes(app: FastifyInstance) {
  app.post<{ Body: z.infer<typeof processBodySchema> }>("/process", {
    handler: async (request, reply) => {
      const parsed = processBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid request body" });
      }

      const {
        walletAddress,
        message,
        sessionId: existingSessionId,
      } = parsed.data;

      const user = await prisma.user.findUnique({ where: { walletAddress } });
      if (!user) return reply.status(404).send({ error: "User not found" });

      try {
        const sessionId = existingSessionId || uuidv4();

        await saveChatMessage(walletAddress, "user", message, sessionId);

        const chatHistory = await getChatHistory(walletAddress, sessionId);
        const systemPrompt = await buildSystemPrompt(user.id);
        const messages = chatHistory.map((chat) => ({
          role:
            chat.role === "agent"
              ? "assistant"
              : (chat.role as "user" | "assistant"),
          content: chat.message,
        }));

        const claudeResponse = await callClaude(systemPrompt, messages);

        let transactionData: Record<string, any> | null = null;
        let agentMessage: string | null = null;

        try {
          transactionData = JSON.parse(claudeResponse);
          const type = transactionData?.type;

          if (type === "transfer") {
            let validContactId = null;
            let toAddress = transactionData.toAddress || null;

            if (transactionData.toContactId) {
              const contact = await prisma.contact.findFirst({
                where: { id: transactionData.toContactId, userId: user.id },
              });
              if (!contact) {
                const msg = `I couldn't find "${transactionData.toContactName}" in your contacts. Please add them first.`;
                await saveChatMessage(walletAddress, "agent", msg, sessionId);
                return reply.send({
                  status: "needs_clarification",
                  sessionId,
                  message: msg,
                });
              }
              validContactId = contact.id;
              toAddress = contact.walletAddress;
            }

            if (!validContactId && !toAddress) {
              const msg =
                "Who do you want to send to? Please provide a name from your contacts or a wallet address.";
              await saveChatMessage(walletAddress, "agent", msg, sessionId);
              return reply.send({
                status: "needs_clarification",
                sessionId,
                message: msg,
              });
            }

            const transaction = await prisma.transaction.create({
              data: {
                userId: user.id,
                sessionId,
                mode: type,
                status: "pending_confirmation",
                fromAddress: user.walletAddress,
                toAddress,
                toContactId: validContactId,
                tokenSymbol: transactionData.fromToken || "",
                tokenAddress: "",
                amount: transactionData.amount || "0",
                amountHuman: transactionData.amount || "0",
                chainId: transactionData.chainId || 8453,
              },
            });

            const msg = `Ready to transfer ${transactionData.amount} ${transactionData.fromToken} to ${transactionData.toContactName || toAddress}. Please confirm.`;
            await saveChatMessage(walletAddress, "agent", msg, sessionId);
            return reply.send({
              status: "ready_for_confirmation",
              sessionId,
              transaction,
            });
          } else if (type === "swap") {
            try {
              const quote = await getUniswapQuote(
                transactionData.fromToken,
                transactionData.toToken,
                transactionData.amount,
                transactionData.chainId || 11155111,
              );

              const swapCalldata = buildSwapCalldata(
                transactionData.fromToken,
                transactionData.toToken,
                quote.amountInWei,
                quote.amountOutWei,
                user.walletAddress,
                transactionData.slippagePercent,
              );

              const transaction = await prisma.transaction.create({
                data: {
                  userId: user.id,
                  sessionId,
                  mode: "swap",
                  status: "pending_confirmation",
                  fromAddress: user.walletAddress,
                  toAddress: SWAP_ROUTER_ADDRESS,
                  tokenSymbol: transactionData.fromToken,
                  tokenAddress: "",
                  amount: quote.amountInWei,
                  amountHuman: transactionData.amount,
                  fromTokenSymbol: transactionData.fromToken,
                  toTokenSymbol: transactionData.toToken,
                  fromAmount: transactionData.amount,
                  toAmountMin: quote.amountOutWei,
                  swapRoute: {
                    amountIn: quote.amountIn,
                    amountOut: quote.amountOut,
                    tokenInAddress: quote.tokenInAddress,
                    tokenOutAddress: quote.tokenOutAddress,
                    amountInWei: quote.amountInWei,
                    amountOutWei: quote.amountOutWei,
                    to: swapCalldata.to,
                    data: swapCalldata.data,
                    value: swapCalldata.value,
                    amountOutMin: swapCalldata.amountOutMin,
                  } as any,
                  chainId: transactionData.chainId || 11155111,
                },
              });

              const msg = `Ready to swap ${transactionData.amount} ${transactionData.fromToken} → ~${Number(quote.amountOut).toFixed(4)} ${transactionData.toToken}. Please confirm.`;
              await saveChatMessage(walletAddress, "agent", msg, sessionId);
              return reply.send({
                status: "ready_for_confirmation",
                sessionId,
                transaction,
                quote,
              });
            } catch (swapErr: any) {
              const errMsg = `I couldn't get a swap quote. The ${transactionData.fromToken}/${transactionData.toToken} pool may not have enough liquidity on Sepolia. Try a smaller amount or different token pair.`;
              await saveChatMessage(walletAddress, "agent", errMsg, sessionId);
              return reply.send({
                status: "needs_clarification",
                sessionId,
                message: errMsg,
              });
            }
          }

          if (type === "NEEDS_MORE_INFO") {
            agentMessage = transactionData.clarificationQuestion;
          } else if (type === "UNSUPPORTED") {
            agentMessage = transactionData.userMessage;
          } else {
            agentMessage = claudeResponse;
          }
        } catch (e) {
          agentMessage = claudeResponse;
        }

        await saveChatMessage(walletAddress, "agent", agentMessage, sessionId);
        return reply.send({
          status: "needs_clarification",
          sessionId,
          message: agentMessage,
        });
      } catch (err) {
        request.log.error(err, "Intent processing failed");
        return reply.status(500).send({ error: "Failed to process intent" });
      }
    },
  });
}
