import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  users: defineTable({
    name: v.string(),
    email: v.string(),
  }).index("by_email", ["email"]),

  conversations: defineTable({
    participants: v.array(v.id("users")),
    type: v.union(v.literal("direct"), v.literal("group")),
    lastMessageTime: v.optional(v.number()),
  })
    .index("by_participants", ["participants"])
    .index("by_last_activity", ["lastMessageTime"]),

  conversationParticipants: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    joinedAt: v.number(),
  })
    .index("by_userId_and_joinedAt", ["userId", "joinedAt"])
    .index("by_conversationId_and_userId", ["conversationId", "userId"]),

  messages: defineTable({
    senderId: v.id("users"),
    conversationId: v.id("conversations"),
    body: v.string(),
  })
    .index("by_conversation_time", ["conversationId"]),

  messageEmbeddings: defineTable({
    messageId: v.id("messages"),
    conversationId: v.id("conversations"), // used for filtering by conversation access before vector search
    embedding: v.array(v.float64()),
    senderId: v.id("users"),
  })
    .vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 1536,
    filterFields: ["conversationId"],
    staged: false,
  }),
});
