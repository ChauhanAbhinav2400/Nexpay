import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";

const createContactSchema = z.object({
  name: z.string().min(1).max(100),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM address"),
});

const updateContactSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function contactRoutes(app: FastifyInstance) {
  app.post<{
    Body: z.infer<typeof createContactSchema>;
    Querystring: { walletAddress: string };
  }>("/", {
    handler: async (request, reply) => {
      const walletAddress = request.query.walletAddress as string;
      if (!walletAddress) {
        return reply
          .status(400)
          .send({ error: "walletAddress query param required" });
      }

      const user = await prisma.user.findUnique({
        where: { walletAddress },
      });
      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }

      const parsed = createContactSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Invalid request body",
          details: parsed.error.flatten(),
        });
      }

      const { name, walletAddress: contactAddress } = parsed.data;

      // Check for duplicate contact
      const existing = await prisma.contact.findFirst({
        where: { userId: user.id, walletAddress: contactAddress },
      });
      if (existing) {
        return reply.status(409).send({
          error: "Contact with this address already exists",
        });
      }

      const contact = await prisma.contact.create({
        data: {
          userId: user.id,
          name,
          walletAddress: contactAddress,
        },
      });

      return reply.status(201).send(contact);
    },
  });

  app.get<{
    Querystring: { walletAddress: string };
  }>("/", {
    handler: async (request, reply) => {
      const walletAddress = request.query.walletAddress as string;
      if (!walletAddress) {
        return reply
          .status(400)
          .send({ error: "walletAddress query param required" });
      }

      const user = await prisma.user.findUnique({
        where: { walletAddress },
      });
      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }

      const contacts = await prisma.contact.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });

      return reply.send(contacts);
    },
  });

  app.put<{
    Params: { id: string };
    Body: z.infer<typeof updateContactSchema>;
    Querystring: { walletAddress: string };
  }>("/:id", {
    handler: async (request, reply) => {
      const walletAddress = request.query.walletAddress as string;
      if (!walletAddress) {
        return reply
          .status(400)
          .send({ error: "walletAddress query param required" });
      }

      const user = await prisma.user.findUnique({
        where: { walletAddress },
      });
      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }

      const parsed = updateContactSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Invalid request body",
          details: parsed.error.flatten(),
        });
      }

      const contact = await prisma.contact.findFirst({
        where: { id: request.params.id, userId: user.id },
      });
      if (!contact) {
        return reply.status(404).send({ error: "Contact not found" });
      }

      const updated = await prisma.contact.update({
        where: { id: contact.id },
        data: { name: parsed.data.name },
      });

      return reply.send(updated);
    },
  });

  app.delete<{
    Params: { id: string };
    Querystring: { walletAddress: string };
  }>("/:id", {
    handler: async (request, reply) => {
      const walletAddress = request.query.walletAddress as string;
      if (!walletAddress) {
        return reply
          .status(400)
          .send({ error: "walletAddress query param required" });
      }

      const user = await prisma.user.findUnique({
        where: { walletAddress },
      });
      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }

      const contact = await prisma.contact.findFirst({
        where: { id: request.params.id, userId: user.id },
      });
      if (!contact) {
        return reply.status(404).send({ error: "Contact not found" });
      }

      await prisma.contact.delete({
        where: { id: contact.id },
      });

      return reply.send({ deleted: true });
    },
  });
}
