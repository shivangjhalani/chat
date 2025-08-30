import { internalAction, internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { CohereClient } from "cohere-ai";
import { internal } from "../_generated/api";
import { Doc, Id } from "../_generated/dataModel";

export const generateEmbeddingsAction = internalAction({
  args: {
    messageId: v.id("messages"),
    conversationId: v.id("conversations"),
    messageBody: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const cohere = new CohereClient({
        token: process.env.CO_API_KEY,
      });

      const result = await cohere.v2.embed({
        texts: [args.messageBody],
        model: "embed-v4.0",
        inputType: "search_document",
        embeddingTypes: ["float"],
      });

      const embedding = result.embeddings?.float?.[0];
      if (!embedding) {
        throw new Error("No embedding returned from Cohere API");
      }

      const message = await ctx.runQuery(internal.messages.embeddings.getMessage, {
        messageId: args.messageId,
      });

      if (message) {
        await ctx.runMutation(internal.messages.embeddings.storeEmbedding, {
          messageId: args.messageId,
          conversationId: args.conversationId,
          embedding: embedding,
          senderId: message.senderId,
        });
      }
    } catch (e) {
      console.error("Failed to generate embeddings:", e);
    }
    return null;
  },
});

export const getMessage = internalQuery({
  args: {
    messageId: v.id("messages"),
  },
  returns: v.union(
    v.object({
      _id: v.id("messages"),
      senderId: v.id("users"),
      conversationId: v.id("conversations"),
      body: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (message === null) {
      return null;
    }
    return {
      _id: message._id,
      senderId: message.senderId,
      conversationId: message.conversationId,
      body: message.body,
    };
  },
});

export const storeEmbedding = internalMutation({
  args: {
    messageId: v.id("messages"),
    conversationId: v.id("conversations"),
    embedding: v.array(v.float64()),
    senderId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("messageEmbeddings", {
      messageId: args.messageId,
      conversationId: args.conversationId,
      embedding: args.embedding,
      senderId: args.senderId,
    });
    return null;
  },
});

export const loadMessagesFromEmbeddings = internalQuery({
  args: {
    embeddingIds: v.array(v.id("messageEmbeddings")),
  },
  returns: v.array(
    v.object({
      embeddingId: v.id("messageEmbeddings"),
      messageId: v.id("messages"),
      message: v.string(),
      senderId: v.id("users"),
      timestamp: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    if (args.embeddingIds.length === 0) {
      return [];
    }

    const embeddingDocs = (
      await Promise.all(
        args.embeddingIds.map((embeddingId) => ctx.db.get(embeddingId))
      )
    ).filter((doc): doc is Doc<"messageEmbeddings"> => doc !== null);

    const messageIds = embeddingDocs.map((doc) => doc.messageId);
    const messages = (
      await Promise.all(messageIds.map((id) => ctx.db.get(id)))
    ).filter((doc): doc is Doc<"messages"> => doc !== null);

    const messagesById = new Map(messages.map((message) => [message._id, message]));

    const results: Array<{
      embeddingId: Id<"messageEmbeddings">;
      messageId: Id<"messages">;
      message: string;
      senderId: Id<"users">;
      timestamp: number;
    }> = [];

    for (const embeddingDoc of embeddingDocs) {
      const message = messagesById.get(embeddingDoc.messageId);
      if (!message) continue;

      results.push({
        embeddingId: embeddingDoc._id,
        messageId: message._id,
        message: message.body,
        senderId: message.senderId,
        timestamp: message._creationTime,
      });
    }

    return results;
  },
});
