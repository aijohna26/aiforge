import { v } from "convex/values";
import { mutation, query, action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";

/**
 * AppForge File Management
 * Handles file operations for Expo projects
 */

// Get all files for a project (from snapshot)
// This is an action because we need to fetch the storage URL
export const getProjectFiles = action({
  args: { projectId: v.id("chats") },
  handler: async (ctx, args) => {
    const project = await ctx.runQuery(api.projects.get, { projectId: args.projectId });

    if (!project?.snapshotId) {
      // Return default Expo template files
      return getDefaultExpoFiles();
    }

    // Load files from storage
    const snapshotUrl = await ctx.storage.getUrl(project.snapshotId);
    if (!snapshotUrl) {
      return getDefaultExpoFiles();
    }

    // Fetch the blob content
    const response = await fetch(snapshotUrl);
    const snapshotText = await response.text();
    const files = JSON.parse(snapshotText);
    return files;
  },
});

// Internal mutation to update project with storage ID
export const updateProjectSnapshot = internalMutation({
  args: {
    projectId: v.id("chats"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, {
      snapshotId: args.storageId,
    });
  },
});

// Save files to storage (action because it needs ctx.storage.store)
export const saveProjectFiles = action({
  args: {
    projectId: v.id("chats"),
    files: v.any(), // FileMap object
  },
  handler: async (ctx, args) => {
    // Store files as JSON in storage
    const storageId = await ctx.storage.store(
      new Blob([JSON.stringify(args.files)], {
        type: "application/json",
      })
    );

    // Update project with new snapshot
    await ctx.runMutation(internal.files.updateProjectSnapshot, {
      projectId: args.projectId,
      storageId,
    });

    return storageId;
  },
});

// Update a single file (action because it needs ctx.storage.store)
export const updateFile = action({
  args: {
    projectId: v.id("chats"),
    filePath: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Get project to find current snapshot
    const project = await ctx.runQuery(api.projects.get, { projectId: args.projectId });
    let files: any = {};

    // Load existing files
    if (project?.snapshotId) {
      const snapshotUrl = await ctx.storage.getUrl(project.snapshotId);
      if (snapshotUrl) {
        const response = await fetch(snapshotUrl);
        const snapshotText = await response.text();
        files = JSON.parse(snapshotText);
      }
    } else {
      files = getDefaultExpoFiles();
    }

    // Update the specific file
    files[args.filePath] = {
      type: "file",
      content: args.content,
    };

    // Save back to storage
    const storageId = await ctx.storage.store(
      new Blob([JSON.stringify(files)], {
        type: "application/json",
      })
    );

    // Update project with new snapshot
    await ctx.runMutation(internal.files.updateProjectSnapshot, {
      projectId: args.projectId,
      storageId,
    });

    return { success: true, storageId };
  },
});

// Helper function to get default Expo template
function getDefaultExpoFiles() {
  return {
    "/package.json": {
      type: "file",
      content: JSON.stringify(
        {
          name: "my-expo-app",
          version: "1.0.0",
          main: "expo/AppEntry.js",
          scripts: {
            start: "expo start",
            android: "expo start --android",
            ios: "expo start --ios",
            web: "expo start --web",
          },
          dependencies: {
            expo: "~49.0.0",
            react: "18.2.0",
            "react-native": "0.72.0",
            "expo-status-bar": "~1.6.0",
          },
          devDependencies: {
            "@babel/core": "^7.20.0",
          },
        },
        null,
        2
      ),
    },
    "/App.tsx": {
      type: "file",
      content: `import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Your Expo App!</Text>
      <Text style={styles.subtitle}>Start editing to see changes</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});
`,
    },
    "/app.json": {
      type: "file",
      content: JSON.stringify(
        {
          expo: {
            name: "my-expo-app",
            slug: "my-expo-app",
            version: "1.0.0",
            orientation: "portrait",
            icon: "./assets/icon.png",
            userInterfaceStyle: "light",
            splash: {
              image: "./assets/splash.png",
              resizeMode: "contain",
              backgroundColor: "#ffffff",
            },
            assetBundlePatterns: ["**/*"],
            ios: {
              supportsTablet: true,
            },
            android: {
              adaptiveIcon: {
                foregroundImage: "./assets/adaptive-icon.png",
                backgroundColor: "#ffffff",
              },
            },
            web: {
              favicon: "./assets/favicon.png",
            },
          },
        },
        null,
        2
      ),
    },
    "/README.md": {
      type: "file",
      content: `# My Expo App

This is a new Expo app created with AppForge AI.

## Get Started

1. Install dependencies

   \`\`\`bash
   npm install
   \`\`\`

2. Start the app

   \`\`\`bash
   npx expo start
   \`\`\`

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go)

You can start developing by editing the files inside the **app** directory.
`,
    },
  };
}
