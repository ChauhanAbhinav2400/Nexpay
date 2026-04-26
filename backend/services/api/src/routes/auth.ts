import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";

const authBodySchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM address"),
  walletType: z.enum(["metamask", "privy"]),
  email: z.string().email().optional(),
  privyUserId: z.string().optional(),
});

export async function authRoutes(app: FastifyInstance) {
  // POST /auth — wallet-centric login
  app.post<{ Body: z.infer<typeof authBodySchema> }>("/", {
    handler: async (request, reply) => {
      try {
        const parsed = authBodySchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: "Invalid request body",
            details: parsed.error.flatten(),
          });
        }

        const { walletAddress, walletType, email, privyUserId } = parsed.data;

        // Find user by walletAddress
        let user = await prisma.user.findUnique({
          where: { walletAddress },
        });

        if (user) {
          // User exists — update if privy
          if (walletType === "privy" && (email || privyUserId)) {
            user = await prisma.user.update({
              where: { walletAddress },
              data: {
                email: email || user.email,
                privyUserId: privyUserId || user.privyUserId,
              },
            });
          }
          // Return with existedUser flag
          return reply.send({ user, existedUser: true });
        }

        // User doesn't exist — create new user
        user = await prisma.user.create({
          data: {
            walletAddress,
            walletType,
            email: email || null,
            privyUserId: privyUserId || null,
          },
        });

        return reply.send({ user, existedUser: false });
      } catch (error: any) {
        console.error("[AUTH] Error:", error);
        return reply.status(500).send({
          error: "Authentication failed",
          message: error?.message || "Unknown error",
        });
      }
    },
  });
}
