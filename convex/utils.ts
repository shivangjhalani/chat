import { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

export const requireAuth = async (
  ctx: QueryCtx | MutationCtx | ActionCtx
): Promise<Id<"users">> => {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new Error("Not authenticated");
  }
  return userId;
};
