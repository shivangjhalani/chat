/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as conversations from "../conversations.js";
import type * as http from "../http.js";
import type * as messages_access from "../messages/access.js";
import type * as messages_embeddings from "../messages/embeddings.js";
import type * as messages_helpers from "../messages/helpers.js";
import type * as messages_search from "../messages/search.js";
import type * as messages_workflows from "../messages/workflows.js";
import type * as messages from "../messages.js";
import type * as users from "../users.js";
import type * as utils from "../utils.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  conversations: typeof conversations;
  http: typeof http;
  "messages/access": typeof messages_access;
  "messages/embeddings": typeof messages_embeddings;
  "messages/helpers": typeof messages_helpers;
  "messages/search": typeof messages_search;
  "messages/workflows": typeof messages_workflows;
  messages: typeof messages;
  users: typeof users;
  utils: typeof utils;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
