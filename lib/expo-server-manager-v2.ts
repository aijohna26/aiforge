import { spawn, ChildProcess } from "child_process";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import os from "os";

export interface ExpoServerInstance {
    id: string;
    port: number;
    workspacePath: string;
    process: ChildProcess | null;
    tunnelUrl: string | null;
    localUrl: string;
    webUrl: string;
    expUrl: string;
    status: "starting" | "running" | "stopped" | "error";
    createdAt: number;
    lastAccessedAt: number;
    error?: string;
    connectedDevices: number;
}

class ExpoServerManagerV2 {
    private servers = new Map<string, ExpoServerInstance>();
    private baseDir: string;
    private portInUse = new Set<number>();
    private startingPorts = new Set<number>();

    constructor() {
        this.baseDir = path.join(process.cwd(), ".expo-workspaces");
        // Ensure base directory exists
        if (!existsSync(this.baseDir)) {
            require("fs").mkdirSync(this.baseDir, { recursive: true });
        }
    }

    private async getFreePort(): Promise<number> {
        let port = 8081;
        while (this.portInUse.has(port) || this.startingPorts.has(port)) {
            port++;
        }
        this.startingPorts.add(port);
        return port;
    }


    async createServer(projectId: string, files: any[]): Promise<ExpoServerInstance> {
        // Stop existing server if running
        const existing = this.servers.get(projectId);
        if (existing) {
            console.log(`[ExpoManager] Stopping existing server for ${projectId}`);
            await this.stopServer(projectId);
        }

        const port = await this.getFreePort();
        const workspacePath = path.join(this.baseDir, projectId);

        const instance: ExpoServerInstance = {
            id: projectId,
            port,
            workspacePath,
            process: null,
            tunnelUrl: null,
            localUrl: `http://localhost:${port}`,
            webUrl: `http://localhost:${port}`,
            expUrl: `exp://localhost:${port}`,
            status: "starting",
            createdAt: Date.now(),
            lastAccessedAt: Date.now(),
            connectedDevices: 0,
        };

        this.servers.set(projectId, instance);

        try {
            await this.setupWorkspace(instance, files);
            await this.startExpoServer(instance);
            this.startingPorts.delete(port);
            this.portInUse.add(port);
            return instance;
        } catch (error) {
            this.startingPorts.delete(port);
            instance.status = "error";
            instance.error = error instanceof Error ? error.message : "Unknown error";
            throw error;
        }
    }


    private async setupWorkspace(instance: ExpoServerInstance, files: any[]) {
        // Create directory
        await fs.mkdir(instance.workspacePath, { recursive: true });

        // Write files
        for (const file of files) {
            const filePath = path.join(instance.workspacePath, file.path);
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, file.content);
        }

        // Write package.json if not exists
        const packageJsonPath = path.join(instance.workspacePath, "package.json");
        if (!files.find(f => f.path === "package.json")) {
            const packageJson = {
                name: "appforge-project",
                version: "1.0.0",
                main: "index.js",
                dependencies: {
                    "expo": "~54.0.25",
                    "expo-router": "~6.0.15",
                    "expo-status-bar": "~3.0.8",
                    "expo-linking": "~8.0.9",
                    "expo-constants": "~18.0.10",
                    "@expo/metro-runtime": "~3.2.3",
                    "@expo/ngrok": "^4.1.3",
                    "react": "19.1.0",
                    "react-native": "0.81.5",
                    "react-dom": "19.1.0",
                    "react-native-web": "~0.21.0",
                    "react-native-safe-area-context": "~5.5.0",
                    "react-native-screens": "~4.12.0",
                    "react-native-gesture-handler": "~2.24.0",
                    "@react-navigation/native": "^7.0.0",
                },
                devDependencies: {
                    "@babel/core": "^7.20.0",
                    "@types/react": "~18.3.12"
                }
            };
            await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
        }

        // Write app.json if not exists
        if (!files.find(f => f.path === "app.json")) {
            const appJson = {
                expo: {
                    name: "AppForge Project",
                    slug: "appforge-project",
                    version: "1.0.0",
                    orientation: "portrait",
                    userInterfaceStyle: "light",
                    newArchEnabled: true,
                    web: {
                        bundler: "metro",
                        output: "static",
                        favicon: "./assets/images/favicon.png"
                    }
                }
            };
            await fs.writeFile(path.join(instance.workspacePath, "app.json"), JSON.stringify(appJson, null, 2));
        }

        // Install dependencies (using cache if possible)
        console.log(`[ExpoManager] Installing dependencies for ${instance.id}...`);
        await this.installDependencies(instance.workspacePath);
    }

    private async installDependencies(workspacePath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const npmInstall = spawn("npm", ["install", "--legacy-peer-deps"], {
                cwd: workspacePath,
                stdio: "pipe",
                shell: true,
            });

            npmInstall.stdout?.on("data", (data) => {
                console.log(`[npm install] ${data.toString()}`);
            });

            npmInstall.stderr?.on("data", (data) => {
                console.error(`[npm install:err] ${data.toString()}`);
            });

            npmInstall.on("close", (code) => {
                if (code === 0) {
                    console.log(`[npm install] Dependencies installed successfully`);
                    resolve();
                } else {
                    reject(new Error(`npm install failed with code ${code}`));
                }
            });
        });
    }

    private async startExpoServer(instance: ExpoServerInstance) {
        return new Promise<void>((resolve, reject) => {
            console.log(`[ExpoManager] Starting Expo in web mode on port ${instance.port}...`);

            const expoProcess = spawn(
                "npx",
                ["expo", "start", "--web", "--port", String(instance.port)],
                {
                    cwd: instance.workspacePath,
                    stdio: "pipe",
                    shell: true,
                    env: {
                        ...(() => {
                            const env = { ...process.env };
                            delete env.CI;
                            return env;
                        })(),
                        EXPO_NO_TELEMETRY: "1",
                        EXPO_NO_UPDATE_CHECK: "1",
                        RCT_NO_LAUNCH_PACKAGER: "1",
                        EXPO_USE_FAST_RESOLVER: "1",
                        CI: "1",
                    },
                }
            );

            instance.process = expoProcess;
            let outputBuffer = "";

            expoProcess.stdout?.on("data", (data) => {
                const output = data.toString();
                outputBuffer += output;
                console.log(`[Expo:${instance.id}] ${output}`);

                // Parse localhost URL
                // Expo web mode outputs something like "Metro waiting on exp://192.168.x.x:8081"
                const urlMatch = output.match(/https?:\/\/localhost:\d+/i) ||
                    output.match(/http:\/\/127\.0\.0\.1:\d+/i);
                if (urlMatch) {
                    const url = urlMatch[0];
                    instance.webUrl = url;
                    instance.localUrl = url;
                    console.log(`[ExpoManager] Web URL: ${url}`);
                }

                // Check if server is ready
                if (output.includes("Metro waiting") || output.includes("Web is waiting") || output.includes("Webpack compiled")) {
                    instance.status = "running";
                    // Set default URLs if not captured
                    if (!instance.webUrl) {
                        instance.webUrl = `http://localhost:${instance.port}`;
                        instance.localUrl = `http://localhost:${instance.port}`;
                    }
                    instance.expUrl = `exp://localhost:${instance.port}`;
                    resolve();
                }
            });

            expoProcess.stderr?.on("data", (data) => {
                const output = data.toString();
                console.error(`[Expo:${instance.id}:err] ${output}`);
            });

            expoProcess.on("close", (code) => {
                if (instance.status === "starting") {
                    reject(new Error(`Expo process exited with code ${code}`));
                }
                instance.status = "stopped";
                this.portInUse.delete(instance.port);
            });

            // Timeout for web mode (should be faster than tunnel)
            setTimeout(() => {
                if (instance.status === "starting") {
                    console.log(`[ExpoManager] Expo start timed out, setting default URLs`);
                    instance.status = "running";
                    instance.webUrl = `http://localhost:${instance.port}`;
                    instance.localUrl = `http://localhost:${instance.port}`;
                    instance.expUrl = `exp://localhost:${instance.port}`;
                    resolve();
                }
            }, 45000); // 45 seconds for webpack compilation
        });
    }

    getServer(projectId: string): ExpoServerInstance | undefined {
        return this.servers.get(projectId);
    }

    async stopServer(projectId: string) {
        const server = this.servers.get(projectId);
        if (server && server.process) {
            server.process.kill();
            this.servers.delete(projectId);
            this.portInUse.delete(server.port);
        }
    }
}

export const expoServerManager = new ExpoServerManagerV2();
