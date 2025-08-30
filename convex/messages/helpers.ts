import { Doc, Id } from "../_generated/dataModel";
import { QueryCtx } from "../_generated/server";

// Helper to fetch sender documents and return a map for efficient lookup.
export async function getSendersMap(
  ctx: Pick<QueryCtx, "db">,
  messages: Doc<"messages">[]
): Promise<Map<Id<"users">, Doc<"users">>> {
  const senderIds = [...new Set(messages.map((m) => m.senderId))];
  if (senderIds.length === 0) {
    return new Map();
  }
  const senders = await Promise.all(senderIds.map((senderId) => ctx.db.get(senderId)));
  return new Map(
    senders
      .filter((s): s is Doc<"users"> => s !== null)
      .map((s) => [s._id, s])
  );
}

