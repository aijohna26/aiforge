/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as ai from "../ai.js";
import type * as apiKeys from "../apiKeys.js";
import type * as cleanup from "../cleanup.js";
import type * as compressMessages from "../compressMessages.js";
import type * as convexProjects from "../convexProjects.js";
import type * as crons from "../crons.js";
import type * as debugPrompt from "../debugPrompt.js";
import type * as deploy from "../deploy.js";
import type * as dev from "../dev.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as lz4 from "../lz4.js";
import type * as lz4Wasm from "../lz4Wasm.js";
import type * as messages from "../messages.js";
import type * as openaiProxy from "../openaiProxy.js";
import type * as projects from "../projects.js";
import type * as resendProxy from "../resendProxy.js";
import type * as sessions from "../sessions.js";
import type * as share from "../share.js";
import type * as snapshot from "../snapshot.js";
import type * as socialShare from "../socialShare.js";
import type * as subchats from "../subchats.js";
import type * as summarize from "../summarize.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  ai: typeof ai;
  apiKeys: typeof apiKeys;
  cleanup: typeof cleanup;
  compressMessages: typeof compressMessages;
  convexProjects: typeof convexProjects;
  crons: typeof crons;
  debugPrompt: typeof debugPrompt;
  deploy: typeof deploy;
  dev: typeof dev;
  files: typeof files;
  http: typeof http;
  lz4: typeof lz4;
  lz4Wasm: typeof lz4Wasm;
  messages: typeof messages;
  openaiProxy: typeof openaiProxy;
  projects: typeof projects;
  resendProxy: typeof resendProxy;
  sessions: typeof sessions;
  share: typeof share;
  snapshot: typeof snapshot;
  socialShare: typeof socialShare;
  subchats: typeof subchats;
  summarize: typeof summarize;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
