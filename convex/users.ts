import { query, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import { requireAuth } from "./utils";
import { getAuthUserId } from "@convex-dev/auth/server";

// Reusable user object validator for public-facing data
const publicUserObject = {
  _id: v.id("users"),
  name: v.string(),
  email: v.string(),
};

const publicUserObjectWithCreationTime = {
  ...publicUserObject,
  _creationTime: v.number(),
};

// Helper function to format user for public consumption
const formatPublicUser = (user: Doc<"users">) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
});

const formatPublicUserWithCreationTime = (user: Doc<"users">) => ({
  _id: user._id,
  _creationTime: user._creationTime,
  name: user.name,
  email: user.email,
});

// get current authed user
export const viewer = query({
  args: {},
  returns: v.union(v.object(publicUserObjectWithCreationTime), v.null()),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (user === null) {
      return null;
    }
    return formatPublicUserWithCreationTime(user);
  },
});

// to be used for searching users to start new convo, all users are email indexed, so this is efficient
export const searchUsersByEmail = query({
  args: {
    email: v.string(),
  },
  returns: v.array(v.object(publicUserObject)),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const users = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();

    return users
      .filter((user) => user._id !== userId)
      .map(formatPublicUser);
  },
});

// used for displaying usernames in semantic search results in frontend
export const getUsersNames = internalQuery({
  args: {
    userIds: v.array(v.id("users")),
  },
  returns: v.array(
    v.object({
      _id: v.id("users"),
      name: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const users = await Promise.all(args.userIds.map((id) => ctx.db.get(id)));
    return users
      .filter((u): u is Doc<"users"> => u !== null)
      .map((u) => ({ _id: u._id, name: u.name }));
  },
});
