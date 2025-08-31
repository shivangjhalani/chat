# Architecting
## Tech stack choice (Tentative)
Keep in mind for tools : prevent vendor lock in for future, use only open-source
1. DB
	- Convex (Postgres) : OSS (both selfhostable and DBaaS (offers much more than just DB)) and Built on top of planetscale postgres
	- Vector DB : Convex
2. Backend
	- Convex : Convex is a reactive backend/database where server logic, data schema and API surface live together as TypeScript functions. So no need for a backend yet, will need if workload becomes waayy too much (billions of vectors), not needed rn ig...
	- I will also not have to deal with websockets since convex provides real time sync using either websockets or optimized HTTP polling.
	- Expose the required API endpoints via Convex HTTP actions
	- tRPC if needed
3. VectorDB
  - Cohere Embeddings
3. Auth (not yet decided)
	- Not setting up my own auth
	- Convex Auth : Inbuilt auth, easiest (Using this)
	- BetterAuth : OSS, convex integration is in very alpha stage right now, dont know if ill run into issues
	- Clerk : Managed, easy compared to other options, convex has nice integration with clerk
4. Backend Host
	- Vercel : love fluid compute
  - Or Fly.io
5. DB Host
	- Self Host convex
	- Use convex cloud (for now use convex cloud, will self host later)
6. Analytics (not to be included right now)
	- PostHog : OSS
7. Captcha / Ratelimiting (not to be included right now)
	- Vercel Bot ID
8. FrontEnd
	- ReactJS + Vite
9. Deployment (Will handle in the end)
	- Docker compose

---

> Keeping scope limited to 1:1 conversations (no groups) and text only messages (no file uploads) although the design allows easy implementation

## Schema
4 entities : User, Messages, Conversation and MessageEmbeddings
```typescript
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
```

Both embedding generation (staged) and vector searches are implemented as Convex actions (asynchronous)

---

## Backend

- All query/mutation/action start with `requireAuth()`
- User-facing mutations like `sendMessage` are fast - Expensive stuff (in terms of time) (embedding generation etc.) happens async in bkg.
- All the heavy queries use indexes - user lookup by email, conversations by participants, messages by conversation+time.
- Vector searches filtered by conversation for security + speed.
- Workflow : `sendMessage` -> quick insert + schedule background job -> `handleSentMessage` workflow -> update conversation activity + generate embeddings.

---

## Vector
- Chose convex vector storage, since everything convex this also convex, it currently efficiently supports vectors in the order of millions, more than enough for school chats + we are never vector searching through the whole vector db.
- Used cohere API and typescript SDK for generating embeddings at time of storing messages and vector ann (cosine similarity) search.
- Vector search and storage pretty much follows the convex docs.

- Scaling : Convex is very serverless friendly, we can shard the vectordb. Convex doesn't seem to support sharding. 2 options, either use a seperate vectordb like qdrant, or can hack it and logically split data across multiple Convex tables/deployments.

---

## Auth Setup
- Convex password auth setup, have only email & password (have many more options like oauth, magic links etc...)
- Convex Auth issues JWT access tokens and refresh tokens (one refresh token used once. On reissue of JWT, another pair of JWT and refresh is sent). The access token is sent over the WebSocket connection to the backend for authentication. Are stored in localStorage for persistence.
- Wrapped main.tsx (frontend) in ConvexAuthProvider
- Added authtables in schema (authtables is provided by convex)
- Added auth checks in queries and mutations

---

## All functions
<img width="653" height="1500" alt="image" src="https://github.com/user-attachments/assets/b6d96c5e-7ff5-4968-8fa8-001909e46b03" />


