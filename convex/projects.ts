import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * AppForge Projects - Simplified project management for Expo apps
 */

// Get a project by ID
export const get = query({
  args: { projectId: v.id("chats") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    return project;
  },
});

// List all projects for a session
export const list = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    // Query all chats for this creator and filter out deleted ones
    const allProjects = await ctx.db
      .query("chats")
      .withIndex("byCreatorAndId", (q) =>
        q.eq("creatorId", args.sessionId)
      )
      .order("desc")
      .collect();

    // Filter out deleted projects
    const projects = allProjects.filter(p => !p.isDeleted).slice(0, 100);

    return projects;
  },
});

// Create a new Expo project
export const create = mutation({
  args: {
    sessionId: v.id("sessions"),
    name: v.string(),
    description: v.optional(v.string()),
    initialPrompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const chatId = await ctx.db.insert("chats", {
      creatorId: args.sessionId,
      initialId: crypto.randomUUID(),
      description: args.description || args.name,
      timestamp: new Date().toISOString(),
      lastSubchatIndex: 0,
    });

    return chatId;
  },
});

// Update project metadata
export const update = mutation({
  args: {
    projectId: v.id("chats"),
    description: v.optional(v.string()),
    urlId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { projectId, ...updates } = args;
    await ctx.db.patch(projectId, updates);
  },
});

// Delete a project (soft delete)
export const deleteProject = mutation({
  args: { projectId: v.id("chats") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, {
      isDeleted: true,
    });
  },
});
