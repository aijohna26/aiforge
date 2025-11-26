/**
 * Expo Development Server Manager
 *
 * Manages spawning and lifecycle of Expo dev servers for generated apps.
 * Each preview gets its own workspace, dev server, and tunnel.
 */

import { spawn, ChildProcess } from "child_process";
import fs from "fs";
import path from "path";
import { EventEmitter } from "events";

export interface ExpoServerInstance {
  id: string;
  port: number;
  workspacePath: string;
  process: ChildProcess | null;
  tunnelUrl: string | null;
  localUrl: string;
  expUrl: string;
  status: "starting" | "running" | "stopped" | "error";
  createdAt: number;
  lastAccessedAt: number;
  error?: string;
}

interface ProjectFile {
  path: string;
  content: string;
}

interface GeneratedProject {
  projectName: string;
  files: ProjectFile[];
  dependencies?: Record<string, string>;
}

const WORKSPACES_DIR = path.join(process.cwd(), ".expo-workspaces");
const CACHE_DIR = path.join(process.cwd(), ".expo-cache");
const BASE_PORT = 8081;
const MAX_INSTANCES = 5;
const INSTANCE_TTL = 30 * 60 * 1000; // 30 minutes

class ExpoServerManager extends EventEmitter {
  private instances: Map<string, ExpoServerInstance> = new Map();
  private portInUse: Set<number> = new Set();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private cacheReady: boolean = false;
  private cacheInitPromise: Promise<void> | null = null;

  constructor() {
    super();
    this.ensureWorkspacesDir();
    this.startCleanupInterval();
    // Start warming cache in background
    this.cacheInitPromise = this.warmCache();
  }

  private ensureWorkspacesDir() {
    if (!fs.existsSync(WORKSPACES_DIR)) {
      fs.mkdirSync(WORKSPACES_DIR, { recursive: true });
    }
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
  }

  /**
   * Pre-install base dependencies to cache directory for faster workspace creation
   */
  private async warmCache(): Promise<void> {
    const cacheNodeModules = path.join(CACHE_DIR, "node_modules");
    const cachePackageJson = path.join(CACHE_DIR, "package.json");
    const expoPackageJson = path.join(cacheNodeModules, "expo", "package.json");

    // Check if cache already exists and is valid (has expo properly installed with package.json)
    if (fs.existsSync(cacheNodeModules) && fs.existsSync(cachePackageJson) && fs.existsSync(expoPackageJson)) {
      // Also check it's not a symlink (which can cause issues)
      try {
        const stat = fs.lstatSync(cacheNodeModules);
        if (!stat.isSymbolicLink()) {
          console.log("[ExpoManager] Cache already warm, skipping install");
          this.cacheReady = true;
          return;
        } else {
          console.log("[ExpoManager] Cache is a symlink, rebuilding...");
          fs.rmSync(cacheNodeModules, { recursive: true, force: true });
        }
      } catch {
        // Continue to rebuild cache
      }
    }

    // Cache is invalid or incomplete, remove and rebuild
    if (fs.existsSync(cacheNodeModules)) {
      console.log("[ExpoManager] Cache incomplete, removing...");
      fs.rmSync(cacheNodeModules, { recursive: true, force: true });
    }

    console.log("[ExpoManager] Warming node_modules cache (first run only)...");

    // Write base package.json to cache
    const basePackageJson = {
      name: "expo-cache",
      version: "1.0.0",
      main: "expo-router/entry",
      dependencies: {
        expo: "~53.0.0",
        "expo-router": "~5.0.0",
        "expo-status-bar": "~2.2.0",
        "expo-linking": "~7.0.0",
        "expo-constants": "~17.0.0",
        react: "19.0.0",
        "react-native": "0.79.3",
        "react-native-safe-area-context": "~5.3.0",
        "react-native-screens": "~4.9.0",
        "react-native-gesture-handler": "~2.24.0",
      },
      devDependencies: {
        "@babel/core": "^7.26.0",
        "@types/react": "~19.0.10",
        typescript: "~5.8.3",
      },
    };

    fs.writeFileSync(cachePackageJson, JSON.stringify(basePackageJson, null, 2));

    try {
      await this.runNpmInstall(CACHE_DIR);
      this.cacheReady = true;
      console.log("[ExpoManager] Cache warmed successfully!");
    } catch (err) {
      console.error("[ExpoManager] Failed to warm cache:", err);
      // Continue without cache - will fall back to normal install
    }
  }

  /**
   * Copy cached node_modules to workspace (much faster than npm install)
   */
  private async useCachedModules(workspacePath: string): Promise<boolean> {
    // Wait for cache to be ready if it's still initializing
    if (this.cacheInitPromise) {
      await this.cacheInitPromise;
    }

    const cacheNodeModules = path.join(CACHE_DIR, "node_modules");
    const targetNodeModules = path.join(workspacePath, "node_modules");

    if (!this.cacheReady || !fs.existsSync(cacheNodeModules)) {
      return false;
    }

    // Verify cache has expo properly installed (with package.json)
    const expoPackageJson = path.join(cacheNodeModules, "expo", "package.json");
    if (!fs.existsSync(expoPackageJson)) {
      console.log("[ExpoManager] Cache missing or corrupt expo module, will reinstall");
      this.cacheReady = false;
      return false;
    }

    try {
      console.log("[ExpoManager] Copying cached node_modules...");
      // Always copy instead of symlink to avoid module resolution issues
      fs.cpSync(cacheNodeModules, targetNodeModules, { recursive: true });
      console.log("[ExpoManager] Copied cached node_modules");
      return true;
    } catch (err) {
      console.error("[ExpoManager] Failed to use cache:", err);
      return false;
    }
  }

  private runNpmInstall(cwd: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const npmInstall = spawn("npm", ["install", "--legacy-peer-deps"], {
        cwd,
        stdio: "pipe",
        shell: true,
      });

      let stderr = "";
      npmInstall.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      npmInstall.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`npm install failed: ${stderr}`));
        }
      });

      npmInstall.on("error", (err) => {
        reject(new Error(`Failed to spawn npm: ${err.message}`));
      });

      // Timeout after 3 minutes
      setTimeout(() => {
        npmInstall.kill();
        reject(new Error("npm install timed out"));
      }, 180000);
    });
  }

  private startCleanupInterval() {
    // Clean up expired instances every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredInstances();
    }, 5 * 60 * 1000);
  }

  private cleanupExpiredInstances() {
    const now = Date.now();
    for (const [id, instance] of this.instances) {
      if (now - instance.lastAccessedAt > INSTANCE_TTL) {
        console.log(`[ExpoManager] Cleaning up expired instance: ${id}`);
        this.stopServer(id);
      }
    }
  }

  private getNextAvailablePort(): number {
    let port = BASE_PORT;
    while (this.portInUse.has(port) && port < BASE_PORT + 100) {
      port++;
    }
    return port;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 10);
  }

  /**
   * Create a new Expo dev server for a generated project
   */
  async createServer(project: GeneratedProject): Promise<ExpoServerInstance> {
    // Enforce max instances limit
    if (this.instances.size >= MAX_INSTANCES) {
      // Find and remove the oldest instance
      let oldest: ExpoServerInstance | null = null;
      for (const instance of this.instances.values()) {
        if (!oldest || instance.lastAccessedAt < oldest.lastAccessedAt) {
          oldest = instance;
        }
      }
      if (oldest) {
        console.log(`[ExpoManager] Max instances reached, removing oldest: ${oldest.id}`);
        await this.stopServer(oldest.id);
      }
    }

    const id = this.generateId();
    const port = this.getNextAvailablePort();
    const workspacePath = path.join(WORKSPACES_DIR, id);

    this.portInUse.add(port);

    const instance: ExpoServerInstance = {
      id,
      port,
      workspacePath,
      process: null,
      tunnelUrl: null,
      localUrl: `http://localhost:${port}`,
      expUrl: `exp://localhost:${port}`,
      status: "starting",
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
    };

    this.instances.set(id, instance);

    try {
      // Step 1: Create workspace with project files
      await this.createWorkspace(workspacePath, project);

      // Step 2: Install dependencies
      await this.installDependencies(workspacePath);

      // Step 3: Start Expo dev server
      await this.startExpoServer(instance);

      // Step 4: Start tunnel for remote access
      await this.startTunnel(instance);

      instance.status = "running";
      this.emit("serverStarted", instance);

      return instance;
    } catch (error) {
      instance.status = "error";
      instance.error = error instanceof Error ? error.message : "Unknown error";
      this.emit("serverError", instance, error);
      throw error;
    }
  }

  private async createWorkspace(workspacePath: string, project: GeneratedProject) {
    console.log(`[ExpoManager] Creating workspace at ${workspacePath}`);

    // Create workspace directory
    fs.mkdirSync(workspacePath, { recursive: true });

    // Write package.json
    const packageJson = {
      name: project.projectName.toLowerCase().replace(/\s+/g, "-"),
      version: "1.0.0",
      main: "expo-router/entry",
      scripts: {
        start: "expo start",
        android: "expo start --android",
        ios: "expo start --ios",
        web: "expo start --web",
      },
      dependencies: {
        // Project dependencies first (will be overwritten by our correct versions)
        ...project.dependencies,
        // Our SDK 53 compatible versions MUST come last to override project's incorrect versions
        expo: "~53.0.0",
        "expo-router": "~5.0.0",
        "expo-status-bar": "~2.2.0",
        "expo-linking": "~7.0.0",
        "expo-constants": "~17.0.0",
        react: "19.0.0",
        "react-native": "0.79.3",
        "react-native-safe-area-context": "~5.3.0",
        "react-native-screens": "~4.9.0",
        "react-native-gesture-handler": "~2.24.0",
      },
      devDependencies: {
        "@babel/core": "^7.26.0",
        "@types/react": "~19.0.10",
        typescript: "~5.8.3",
      },
      expo: {
        scheme: "appforge",
        web: {
          bundler: "metro",
        },
      },
    };

    fs.writeFileSync(
      path.join(workspacePath, "package.json"),
      JSON.stringify(packageJson, null, 2)
    );

    // Write app.json
    const appJson = {
      expo: {
        name: project.projectName,
        slug: project.projectName.toLowerCase().replace(/\s+/g, "-"),
        version: "1.0.0",
        orientation: "portrait",
        scheme: "appforge",
        platforms: ["ios", "android", "web"],
        web: {
          bundler: "metro",
        },
        plugins: ["expo-router"],
      },
    };

    fs.writeFileSync(
      path.join(workspacePath, "app.json"),
      JSON.stringify(appJson, null, 2)
    );

    // Write tsconfig.json
    const tsConfig = {
      extends: "expo/tsconfig.base",
      compilerOptions: {
        strict: true,
        paths: {
          "@/*": ["./*"],
        },
      },
      include: ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"],
    };

    fs.writeFileSync(
      path.join(workspacePath, "tsconfig.json"),
      JSON.stringify(tsConfig, null, 2)
    );

    // Write project files FIRST (so we can overwrite incomplete package.json/app.json)
    for (const file of project.files) {
      // Skip package.json and app.json from project - we'll write our own complete versions
      if (file.path === "package.json" || file.path === "app.json") {
        continue;
      }
      const filePath = path.join(workspacePath, file.path);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, file.content);
    }

    // Write babel.config.js
    fs.writeFileSync(
      path.join(workspacePath, "babel.config.js"),
      `module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};`
    );

    console.log(`[ExpoManager] Workspace created with ${project.files.length} files`);
  }

  private async installDependencies(workspacePath: string): Promise<void> {
    console.log(`[ExpoManager] Installing dependencies...`);

    // Try to use cached node_modules first (instant!)
    const usedCache = await this.useCachedModules(workspacePath);
    if (usedCache) {
      console.log(`[ExpoManager] Dependencies ready from cache!`);
      return;
    }

    // Fall back to npm install if cache unavailable
    console.log(`[ExpoManager] Cache miss, running npm install...`);
    await this.runNpmInstall(workspacePath);
    console.log(`[ExpoManager] Dependencies installed successfully`);
  }

  /**
   * Kill any process using the given port
   */
  private async killPortProcess(port: number): Promise<void> {
    return new Promise((resolve) => {
      try {
        console.log(`[ExpoManager] Checking port ${port} for existing processes...`);

        const lsof = spawn("lsof", ["-ti", `:${port}`], { shell: true });
        let pids = "";

        lsof.stdout?.on("data", (data) => {
          pids += data.toString();
        });

        lsof.on("close", () => {
          const pidList = pids.trim().split("\n").filter(Boolean);

          if (pidList.length > 0) {
            console.log(`[ExpoManager] Found ${pidList.length} process(es) on port ${port}: ${pidList.join(", ")}`);

            // Kill each process
            let killed = 0;
            for (const pid of pidList) {
              const killProc = spawn("kill", ["-9", pid.trim()], { shell: true });
              killProc.on("close", () => {
                killed++;
                if (killed === pidList.length) {
                  console.log(`[ExpoManager] Killed all processes on port ${port}`);
                  // Wait a moment for port to be released
                  setTimeout(() => resolve(), 500);
                }
              });
            }
          } else {
            console.log(`[ExpoManager] Port ${port} is free`);
            resolve();
          }
        });

        lsof.on("error", () => {
          // lsof not available or error, continue anyway
          resolve();
        });

        // Timeout after 3 seconds
        setTimeout(() => resolve(), 3000);
      } catch {
        // Any error, just continue
        resolve();
      }
    });
  }

  private startExpoServer(instance: ExpoServerInstance): Promise<void> {
    return new Promise(async (resolve, reject) => {
      console.log(`[ExpoManager] Starting Expo on port ${instance.port}...`);

      // Kill any existing process on this port first
      await this.killPortProcess(instance.port);

      const expoProcess = spawn(
        "npx",
        ["expo", "start", "--port", String(instance.port)],
        {
          cwd: instance.workspacePath,
          stdio: "pipe",
          shell: true,
          env: {
            ...process.env,
            CI: "1", // Prevent interactive prompts (must be "1", not "true")
            EXPO_NO_TELEMETRY: "1",
            EXPO_NO_UPDATE_CHECK: "1",
            EXPO_USE_FAST_RESOLVER: "1",
            RCT_NO_LAUNCH_PACKAGER: "1",
          },
        }
      );

      instance.process = expoProcess;

      let output = "";
      let resolved = false;

      const checkReady = (data: string) => {
        output += data;
        // Look for Metro bundler ready message
        if (
          !resolved &&
          (output.includes("Metro waiting on") ||
            output.includes("Logs for your project") ||
            output.includes("Starting Metro Bundler"))
        ) {
          resolved = true;
          console.log(`[ExpoManager] Expo server ready on port ${instance.port}`);
          resolve();
        }
      };

      expoProcess.stdout?.on("data", (data) => {
        const str = data.toString();
        console.log(`[Expo:${instance.id}] ${str}`);
        checkReady(str);
      });

      expoProcess.stderr?.on("data", (data) => {
        const str = data.toString();
        console.error(`[Expo:${instance.id}:err] ${str}`);
        checkReady(str);
      });

      expoProcess.on("close", (code) => {
        if (!resolved) {
          reject(new Error(`Expo process exited with code ${code}`));
        }
        instance.status = "stopped";
        this.portInUse.delete(instance.port);
      });

      expoProcess.on("error", (err) => {
        if (!resolved) {
          reject(new Error(`Failed to start Expo: ${err.message}`));
        }
      });

      // Timeout after 60 seconds
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          // Even if we don't see the ready message, the server might still work
          console.log(`[ExpoManager] Expo start timed out, assuming ready`);
          resolve();
        }
      }, 60000);
    });
  }

  private async startTunnel(instance: ExpoServerInstance): Promise<void> {
    // Use local network IP for Expo Go - most reliable for development
    // Phone must be on same WiFi network as the dev machine

    const localIp = this.getLocalIp();
    if (localIp) {
      instance.tunnelUrl = `http://${localIp}:${instance.port}`;
      instance.expUrl = `exp://${localIp}:${instance.port}`;
      console.log(`[ExpoManager] Using local network: ${instance.expUrl}`);
      console.log(`[ExpoManager] Make sure your phone is on the same WiFi network!`);
    } else {
      // Fall back to localhost if we can't detect local IP
      instance.expUrl = `exp://localhost:${instance.port}`;
      console.log(`[ExpoManager] Could not detect local IP, using localhost`);
      console.log(`[ExpoManager] Device preview may not work - use Web preview instead`);
    }
  }

  private getLocalIp(): string | null {
    try {
      const { networkInterfaces } = require("os");
      const nets = networkInterfaces();

      for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
          if (net.family === "IPv4" && !net.internal) {
            return net.address;
          }
        }
      }
    } catch {
      // Ignore errors
    }
    return null;
  }

  /**
   * Get an existing server instance
   */
  getServer(id: string): ExpoServerInstance | undefined {
    const instance = this.instances.get(id);
    if (instance) {
      instance.lastAccessedAt = Date.now();
    }
    return instance;
  }

  /**
   * Stop and cleanup a server instance
   */
  async stopServer(id: string): Promise<void> {
    const instance = this.instances.get(id);
    if (!instance) return;

    console.log(`[ExpoManager] Stopping server ${id}`);

    // Close tunnel if exists
    const instanceWithTunnel = instance as ExpoServerInstance & { tunnel?: { close: () => void } };
    if (instanceWithTunnel.tunnel) {
      try {
        instanceWithTunnel.tunnel.close();
        console.log(`[ExpoManager] Tunnel closed for ${id}`);
      } catch {
        // Ignore tunnel close errors
      }
    }

    // Kill Expo process
    if (instance.process) {
      instance.process.kill("SIGTERM");
      instance.process = null;
    }

    // Free up port
    this.portInUse.delete(instance.port);

    // Remove workspace (but not if using symlinked node_modules)
    try {
      // First remove symlink if it exists to avoid deleting cache
      const nodeModulesPath = path.join(instance.workspacePath, "node_modules");
      const stat = fs.lstatSync(nodeModulesPath);
      if (stat.isSymbolicLink()) {
        fs.unlinkSync(nodeModulesPath);
      }
    } catch {
      // Ignore - either doesn't exist or not a symlink
    }

    try {
      fs.rmSync(instance.workspacePath, { recursive: true, force: true });
    } catch (err) {
      console.error(`[ExpoManager] Failed to remove workspace: ${err}`);
    }

    // Remove from instances
    this.instances.delete(id);
    instance.status = "stopped";

    this.emit("serverStopped", instance);
  }

  /**
   * Stop all servers
   */
  async stopAll(): Promise<void> {
    for (const id of this.instances.keys()) {
      await this.stopServer(id);
    }
  }

  /**
   * Get all active instances
   */
  getActiveInstances(): ExpoServerInstance[] {
    return Array.from(this.instances.values()).filter(
      (i) => i.status === "running" || i.status === "starting"
    );
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.stopAll();
  }
}

// Singleton instance
export const expoManager = new ExpoServerManager();

// Handle process exit
process.on("exit", () => {
  expoManager.destroy();
});

process.on("SIGINT", () => {
  expoManager.destroy();
  process.exit();
});

process.on("SIGTERM", () => {
  expoManager.destroy();
  process.exit();
});
