Test : https://chat-ten-puce-83.vercel.app/
Start a conversation with : shivang2004jhalani@gmail.com
Deployed backend on railway

# Setup
```
git clone https://github.com/shivangjhalani/chat.git
cd chat

# install node
curl -fsSL https://deb.nodesource.com/setup_current.x | sudo -E bash -
sudo apt-get install -y nodejs

# install docker
sudo apt install docker-compose-v2

docker compose up # Opens up convex backend connected to postgres
cp .env.local.example .env.local # Update cohere api key
docker compose exec backend ./generate_admin_key.sh # Get the key and put in .env.local
npx convex dev # start new project if prompted
node setup.mjs

npm install -g pnpm

pnpm run dev
```

Dashboard : http://localhost:6791
App : http://localhost:5173

---

<img width="1920" height="479" alt="image" src="https://github.com/user-attachments/assets/21157b21-90cc-4f4d-a53a-775bd7f01d17" />
<img width="1920" height="479" alt="image" src="https://github.com/user-attachments/assets/30653e80-f966-475f-8d05-6900b5577ff1" />

---

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
  - Or Railwiy
5. DB Host
	- Self Host convex
	- Use convex cloud
6. Analytics (if)
	- PostHog : OSS
7. Captcha / Ratelimiting (if)
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

- Scaling : Convex is scalable, we can shard the vectordb. Convex doesn't seem to support sharding. 2 options, either use a seperate vectordb like qdrant, or can hack it and logically split data across multiple Convex tables/deployments.

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


---

## Part 3
This architecture, although is very abstracted away, is similar to a backend connected to postgres. The abstraction has very minimal performance overhead compared to if we built an express backend. But this comes with a bunch of QOL improvements, esp for an app like this which requires real time features.

### Break point estimation

The most critical part of the app : Database Connection & Query Performance.

#### Primary Limiting Factor: CPU

process data, auth check, DB queries, websocket push etc a lot of work

- Let's assume x ms of CPU time per message consumed
- Since 2vCPU => 2 * 1000 = 2000 cpu time (ms) / second we have
- That means our server can serve 2000/x messages a second
- A decent assumption might be the CPU takes `5ms per message` => `400 messages a second`
- Assuming 1 person sends 2 messages a sec. => `200 concurrent users`

#### Other parts
1. Network : Datacenters have fast internet, even if it is a very conservative 100Mbps, and assuming one message with all protocol overhead is about 1KB, thats a lot of network bandwidth, other parts will bottleneck early.

2. Disk : Assume 3000 IOPS and 2 IOPS/message: 3000 ÷ 2 = 1500 msg/sec

3. Sockets : depends on system how many open files it allows : ❯ ulimit -n = 1024

### Bottleneck Identification

Tools -> Prometheus + Grafana: To collect and visualize metrics like request duration, memory usage, and CPU utilization

Application profiling tools also might help reveal bottleneck functions (more cpu time spent on them)

Considering for our app CPU is probably the best guess for bottlneck

Monitor

1. cpu_usage_percent for all cores
2. load_average_1m/5m/15m
3. iowait

/proc/stat exposes these 3

#### Scaling
Horizontal scaling is the straight and easy solution.

Could go either serverless(might not be good for long lived websockets) or servers with load balancers (Cool paper : https://www.usenix.org/conference/nsdi24/presentation/wydrowski)



On application logic layer, heavy loads are already async.
