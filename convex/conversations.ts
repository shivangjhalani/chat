import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./utils";
import { getAuthUserId } from "@convex-dev/auth/server";

// used to diaplay on left sidebar (lil bit complex db query, not linear for now)
export const listUserConversations = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("conversations"),
      _creationTime: v.number(),
      participants: v.array(v.id("users")),
      participantDetails: v.array(
        v.object({
          _id: v.id("users"),
          name: v.string(),
          email: v.string(),
        })
      ),
      name: v.optional(v.string()),
      type: v.union(v.literal("direct"), v.literal("group")),
      lastMessageTime: v.optional(v.number()),
    })
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    const userParticipations = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_userId_and_joinedAt", (q) => q.eq("userId", userId))
      .collect();

    if (userParticipations.length === 0) {
      return [];
    }

    const conversations = await Promise.all(
      userParticipations.map((p) => ctx.db.get(p.conversationId))
    );

    const validConversations = conversations.filter((c) => c !== null);

    // Get all other participants
    const allParticipantIds = [
      ...new Set(
        validConversations.flatMap((c) => c.participants).filter((p) => p !== userId)
      ),
    ];

    const participantDocs = await Promise.all(
      allParticipantIds.map((id) => ctx.db.get(id))
    );

    const participantsMap = new Map(
      participantDocs
        .filter((p) => p !== null)
        .map((p) => [p._id, p])
    );

    // Sort by last activity (most recent first)
    const sortedConversations = validConversations.sort((a, b) => {
      const aTime = a.lastMessageTime || a._creationTime;
      const bTime = b.lastMessageTime || b._creationTime;
      return bTime - aTime;
    });

    return sortedConversations.map((conversation) => {
      const participantDetails = conversation.participants
        .filter((p) => p !== userId)
        .map((participantId) => {
          const participant = participantsMap.get(participantId);
          if (!participant) {
            throw new Error(`Participant ${participantId} not found`);
          }
          return {
            _id: participant._id,
            name: participant.name,
            email: participant.email,
          };
        });

      return {
        ...conversation,
        participantDetails,
      };
    });
  },
});

export const findOrCreateConversation = mutation({
  args: {
    otherUserId: v.id("users"),
  },
  returns: v.id("conversations"),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);


    const otherUser = await ctx.db.get(args.otherUserId);
    if (!otherUser) {
      throw new Error("User not found");
    }

    // chumma sorting, will make lookup consistent
    const participants = [userId, args.otherUserId].sort();

    // existing convo exists?
    const existingConversation = await ctx.db
      .query("conversations")
      .withIndex("by_participants", (q) => q.eq("participants", participants))
      .first();

    if (existingConversation) {
      return existingConversation._id;
    }

    // If not exist : create new conv
    const conversationId = await ctx.db.insert("conversations", {
      participants,
      type: "direct",
    });

    // Create participant records
    await Promise.all(
      participants.map((participantId) =>
        ctx.db.insert("conversationParticipants", {
          conversationId,
          userId: participantId,
          joinedAt: Date.now(),
        })
      )
    );

    return conversationId;
  },
});

// update conversation time when message sent
export const updateConversationActivity = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    lastMessageTime: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      lastMessageTime: args.lastMessageTime,
    });
    return null;
  },
});
