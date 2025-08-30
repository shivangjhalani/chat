import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

export const getUserConversations = internalQuery({
  args: {
    userId: v.id("users"),
  },
  returns: v.array(
    v.object({
      conversationId: v.id("conversations"),
    })
  ),
  handler: async (ctx, args) => {
    const participations = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_userId_and_joinedAt", (q) => q.eq("userId", args.userId))
      .collect();

    return participations.map((p) => ({
      conversationId: p.conversationId,
    }));
  },
});

