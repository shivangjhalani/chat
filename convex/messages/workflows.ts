import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

export const handleSentMessage = internalMutation({
  args: {
    messageId: v.id("messages"),
    conversationId: v.id("conversations"),
    messageBody: v.string(),
    messageTime: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.conversations.updateConversationActivity, {
      conversationId: args.conversationId,
      lastMessageTime: args.messageTime,
    });

    await ctx.scheduler.runAfter(0, internal.messages.embeddings.generateEmbeddingsAction, {
      messageId: args.messageId,
      conversationId: args.conversationId,
      messageBody: args.messageBody,
    });

    return null;
  },
});

