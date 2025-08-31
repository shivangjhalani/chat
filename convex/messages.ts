import {
  query,
  mutation,
} from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { requireAuth } from "./utils";

import { getSendersMap } from "./messages/helpers";
import * as workflows from "./messages/workflows";
import * as embeddings from "./messages/embeddings";
import * as access from "./messages/access";
import * as search from "./messages/search";

// listing and checking access efficientlyy
export const listMessages = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("messages"),
      _creationTime: v.number(),
      senderId: v.id("users"),
      conversationId: v.id("conversations"),
      body: v.string(),
      senderName: v.string(),
      type: v.optional(v.union(v.literal("text"), v.literal("system"))),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    // check access
    const participation = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_conversationId_and_userId", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", userId)
      )
      .first();
    if (!participation) {
      throw new Error("Access denied: not a participant in this conversation");
    }

    // get messages using index
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_time", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("desc")
      .take(args.limit ?? 100); // display 100 messages, should implement whatsapp like feature to load older messages

    const sendersMap = await getSendersMap(ctx, messages);

    return messages.map((message) => ({
      ...message,
      senderName: sendersMap.get(message.senderId)?.name ?? "Unknown User",
    }));
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    body: v.string(),
    type: v.optional(v.union(v.literal("text"), v.literal("system"))),
  },
  returns: v.id("messages"),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const participation = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_conversationId_and_userId", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", userId)
      )
      .first();

    if (!participation) {
      throw new Error("Access denied: not a participant in this conversation");
    }

    const messageId = await ctx.db.insert("messages", {
      senderId: userId,
      conversationId: args.conversationId,
      body: args.body,
    });

    // run embeddings generation action (async)
    await ctx.scheduler.runAfter(
      0,
      internal.messages.handleSentMessage,
      {
        messageId,
        conversationId: args.conversationId,
        messageBody: args.body,
        messageTime: Date.now(),
      }
    );

    return messageId;
  },
});


export const handleSentMessage = workflows.handleSentMessage;

export const generateEmbeddingsAction = embeddings.generateEmbeddingsAction;

export const getMessage = embeddings.getMessage;

export const storeEmbedding = embeddings.storeEmbedding;

export const loadMessagesFromEmbeddings = embeddings.loadMessagesFromEmbeddings;

export const semanticSearch = search.semanticSearch;

export const getUserConversations = access.getUserConversations;
