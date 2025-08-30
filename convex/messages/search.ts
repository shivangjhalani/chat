import { action } from "../_generated/server";
import { v } from "convex/values";
import { CohereClient } from "cohere-ai";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

export const semanticSearch = action({
  args: {
    q: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      messageId: v.id("messages"),
      message: v.string(),
      senderId: v.id("users"),
      senderName: v.string(),
      timestamp: v.number(),
      score: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await (await import("../utils")).requireAuth(ctx);

    const userParticipations = await ctx.runQuery(
      internal.messages.access.getUserConversations,
      { userId }
    );

    if (userParticipations.length === 0) {
      return [];
    }

    const conversationIds = userParticipations.map((p: { conversationId: Id<"conversations"> }) => p.conversationId);

    const cohere = new CohereClient({ token: process.env.CO_API_KEY });
    const embedResult = await cohere.v2.embed({
      texts: [args.q],
      model: "embed-v4.0",
      inputType: "search_query",
      embeddingTypes: ["float"],
    });

    const queryEmbedding = embedResult.embeddings?.float?.[0];
    if (!queryEmbedding) {
      throw new Error("No embedding returned from Cohere API for query");
    }

    const limit = Math.min(Math.max(args.limit ?? 10, 1), 256); // 256 is max convex allowas

    const conversationFilter = conversationIds.length === 1
      ? (q: any) => q.eq("conversationId", conversationIds[0])
      : (q: any) => q.or(...conversationIds.map(id => q.eq("conversationId", id)));

    const vectorResults = await (ctx as any).vectorSearch(
      "messageEmbeddings",
      "by_embedding",
      {
        vector: queryEmbedding,
        limit,
        filter: conversationFilter,
      }
    );

    if (vectorResults.length === 0) return [];

    const embeddingsWithScores: Array<{
      embeddingId: Id<"messageEmbeddings">;
      score: number;
    }> = vectorResults.map(
      (r: { _id: Id<"messageEmbeddings">; _score: number }) => ({
        embeddingId: r._id,
        score: r._score,
      })
    );

    const embeddingIds = embeddingsWithScores.map((e) => e.embeddingId);
    const loaded = await ctx.runQuery(
      internal.messages.embeddings.loadMessagesFromEmbeddings,
      { embeddingIds }
    );

    const scoreByEmbeddingId = new Map<Id<"messageEmbeddings">, number>(
      embeddingsWithScores.map((e) => [e.embeddingId, e.score])
    );

    const loadedByEmbeddingId = new Map<Id<"messageEmbeddings">, {
      embeddingId: Id<"messageEmbeddings">;
      messageId: Id<"messages">;
      message: string;
      senderId: Id<"users">;
      timestamp: number;
    }>(loaded.map((row) => [row.embeddingId, row]));

    const baseResults: Array<{
      messageId: Id<"messages">;
      message: string;
      senderId: Id<"users">;
      timestamp: number;
      score: number;
    }> = [];

    for (const vr of embeddingsWithScores) {
      const row: any = loadedByEmbeddingId.get(vr.embeddingId);
      if (!row) continue;
      baseResults.push({
        messageId: row.messageId,
        message: row.message,
        senderId: row.senderId,
        timestamp: row.timestamp,
        score: scoreByEmbeddingId.get(vr.embeddingId) ?? 0,
      });
    }

    const uniqueSenderIds: Array<Id<"users"> > = [...new Set(baseResults.map((r) => r.senderId))];
    const senderDocs: Array<{ _id: Id<"users">; name: string }> = await ctx.runQuery(
      internal.users.getUsersNames,
      { userIds: uniqueSenderIds }
    );
    const nameById = new Map<Id<"users">, string>(senderDocs.map((u) => [u._id, u.name]));

    return baseResults.map((r) => ({
      ...r,
      senderName: nameById.get(r.senderId) ?? "Unknown User",
    }));
  },
});

