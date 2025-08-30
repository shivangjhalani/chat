# Architecting
## Tech stack choice (Tentative)
Keep in mind for tools : prevent vendor lock in for future, use only open-source
1. DB
	- Convex (Postgres) : OSS (both selfhostable and DBaaS (offers much more than just DB)) and Built on top of planetscale postgres
	- Vector DB : Convex
2. Backend
	- Convex : Convex is a reactive backend/database where server logic, data schema and API surface live together as TypeScript functions. So no need for a backend yet, will need if workload becomes waayy too much (billions of vectors), not needed rn ig...
  - I will also not have to deal with websockets since convex provides real time sync using optimized HTTP polling. HTTP long polling has several benifits : Serverless compatibility, Built in reconnection - no need to write disconnection logic for websockets. Websockets is lighter and less latency, but convex should work just fine for chat app.
  - Expose the required API endpoints via Convex HTTP actions
	- tRPC if needed
3. VectorDB
  - Convex vector db, Cohere Embeddings
3. Auth (not yet decided)
	- Not setting up my own auth
	- Convex Auth : Inbuilt auth, easiest (Use this)
	- BetterAuth : OSS, convex integration is in very alpha stage right now, dont know if ill run into issues
	- Clerk : Managed, easy compared to other options, convex has nice integration with clerk
4. Backend Host
	- Vercel : love fluid compute
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
