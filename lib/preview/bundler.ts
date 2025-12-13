import type { GeneratedFile } from "@/lib/types";

const REACT_VERSION = "18.3.1";

const CDN_SCRIPTS = [
  `https://unpkg.com/react@${REACT_VERSION}/umd/react.development.js`,
  `https://unpkg.com/react-dom@${REACT_VERSION}/umd/react-dom.development.js`,
  "https://unpkg.com/@babel/standalone/babel.min.js",
];

const PHONE_RESET_STYLES = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #070b16; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; }
  #app-root { width: 100%; height: 100%; }
  .phone-shell {
    width: 390px;
    height: 100%;
    max-height: 844px;
    background: linear-gradient(180deg, #0f172a, #020617);
    border-radius: 32px;
    padding: 22px 12px 14px;
    position: relative;
    box-shadow: 0 30px 80px rgba(15, 23, 42, 0.4);
  }
  .phone-notch {
    width: 180px;
    height: 32px;
    background: rgba(2, 6, 23, 0.95);
    border-radius: 0 0 22px 22px;
    position: absolute;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
  }
  iframe, canvas { border: none; }
  #error-overlay {
    position: absolute;
    inset: 16px;
    border-radius: 24px;
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.4);
    padding: 16px;
    font-family: 'JetBrains Mono', Menlo, Consolas, monospace;
    color: #fecaca;
    font-size: 12px;
    overflow: auto;
    display: none;
    white-space: pre-wrap;
  }
`;

export function generatePreviewHTML(files: GeneratedFile[], projectName: string) {
  const serialized = JSON.stringify(
    files.map((file) => ({
      path: file.path,
      content: file.content,
    }))
  ).replace(/<\/script/gi, "<\\/script");

  const scripts = CDN_SCRIPTS.map((src) => `<script crossorigin src="${src}"></script>`).join("\n");

  return /* html */ `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <title>${escapeHtml(projectName)} Preview</title>
    <style>${PHONE_RESET_STYLES}</style>
    ${scripts}
    <script>
      // Create a minimal React Native Web shim
      window.ReactNativeWeb = {
        View: React.forwardRef(function(props, ref) {
          const { style = {}, ...rest } = props;
          return React.createElement('div', { ref: ref, style: { display: 'flex', flexDirection: 'column', ...style }, ...rest });
        }),
        Text: React.forwardRef(function(props, ref) {
          const { style = {}, ...rest } = props;
          return React.createElement('span', { ref: ref, style: style, ...rest });
        }),
        TextInput: React.forwardRef(function(props, ref) {
          const { style = {}, value, onChangeText, placeholder, ...rest } = props;
          return React.createElement('input', {
            ref: ref,
            type: 'text',
            style: style,
            value: value,
            placeholder: placeholder,
            onChange: function(e) { if (onChangeText) onChangeText(e.target.value); },
            ...rest
          });
        }),
        Button: function(props) {
          const { title, onPress, color } = props;
          return React.createElement('button', {
            onClick: onPress,
            style: { backgroundColor: color || '#007AFF', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }
          }, title);
        },
        ScrollView: React.forwardRef(function(props, ref) {
          const { style = {}, ...rest } = props;
          return React.createElement('div', { ref: ref, style: { overflow: 'auto', ...style }, ...rest });
        }),
        StyleSheet: {
          create: function(styles) { return styles; },
          flatten: function(style) { return style; }
        },
        Platform: {
          OS: 'web',
          select: function(obj) { return obj.web || obj.default; }
        }
      };
    </script>
  </head>
  <body>
    <div class="phone-shell">
      <div class="phone-notch"></div>
      <div id="app-root"></div>
      <div id="error-overlay"></div>
    </div>
    <script>
      const PROJECT_FILES = ${serialized};
      const MODULE_CACHE = {};
      const MODULE_CODE = new Map();

      const BABEL_OPTIONS = {
        presets: [
          ["react", { runtime: "classic" }],
          "typescript"
        ],
        plugins: ["transform-modules-commonjs"],
      };

      const RN_ALIAS = ["react-native", "react-native-web"];

      const normalizePath = (path) => path.replace(/^\\.\\//, "").replace(/\\\\+/g, "/");

      const joinPath = (base, relative) => {
        if (!relative.startsWith(".")) return normalizePath(relative);
        const baseParts = base.split("/");
        baseParts.pop();
        const relativeParts = relative.split("/");
        for (const part of relativeParts) {
          if (part === "." || part === "") continue;
          if (part === "..") baseParts.pop();
          else baseParts.push(part);
        }
        return normalizePath(baseParts.join("/"));
      };

      const errorOverlay = document.getElementById("error-overlay");

      function reportError(message) {
        errorOverlay.style.display = "block";
        errorOverlay.textContent = message;
        console.error(message);
      }

      try {
        PROJECT_FILES.forEach((file) => {
          // Skip non-JS/TS files (JSON, images, etc.)
          const ext = file.path.split('.').pop().toLowerCase();
          if (!['js', 'jsx', 'ts', 'tsx'].includes(ext)) {
            return;
          }

          try {
            const result = Babel.transform(file.content, { ...BABEL_OPTIONS, filename: file.path });
            MODULE_CODE.set(normalizePath(file.path), result.code);
          } catch (error) {
            reportError("Failed to compile " + file.path + "\\n\\n" + error.message);
          }
        });

        const EXTENSIONS = ["", ".tsx", ".ts", ".jsx", ".js"];

        const resolveModule = (request, importer) => {
          if (RN_ALIAS.includes(request)) return "react-native-web";
          if (request === "react") return "react";
          if (request === "react-dom") return "react-dom";
          if (request.startsWith("@/")) return normalizePath(request.slice(2));
          if (request.startsWith(".")) {
            for (const ext of EXTENSIONS) {
              const candidate = joinPath(importer, request.endsWith(ext) ? request : request + ext);
              if (MODULE_CODE.has(normalizePath(candidate))) return normalizePath(candidate);
            }
            return joinPath(importer, request);
          }
          for (const ext of EXTENSIONS) {
            const absolute = request.endsWith(ext) ? request : request + ext;
            if (MODULE_CODE.has(normalizePath(absolute))) return normalizePath(absolute);
          }
          return normalizePath(request);
        };

        const requireModule = (moduleId, importer = "") => {
          if (moduleId === "react") return React;
          if (moduleId === "react-dom") return ReactDOM;
          if (moduleId === "react-native-web") return ReactNativeWeb;

          const normalizedId = normalizePath(moduleId);
          if (MODULE_CACHE[normalizedId]) return MODULE_CACHE[normalizedId];
          const code = MODULE_CODE.get(normalizedId);
          if (!code) {
            throw new Error("Module not found: " + normalizedId + "\\nImported from: " + importer);
          }

          const module = { exports: {} };
          const fn = new Function("require", "module", "exports", code);
          const localRequire = (request) => requireModule(resolveModule(request, normalizedId), normalizedId);
          fn(localRequire, module, module.exports);
          MODULE_CACHE[normalizedId] = module.exports;
          return module.exports;
        };

        const entryFile = MODULE_CODE.has("app/index.tsx")
          ? "app/index.tsx"
          : MODULE_CODE.keys().next().value;

        if (!entryFile) {
          reportError("No entry file found. Please make sure you have at least one .tsx or .ts file.");
          throw new Error("No entry file found");
        }

        const AppModule = requireModule(entryFile);
        // Handle both ES6 (default export) and CommonJS exports
        let App;
        if (AppModule && typeof AppModule === 'object') {
          // Check for default export (Babel adds __esModule marker)
          if (AppModule.__esModule && AppModule.default) {
            App = AppModule.default;
          } else if (AppModule.default) {
            App = AppModule.default;
          } else if (AppModule.App) {
            App = AppModule.App;
          } else {
            // Try to find the first function export
            const keys = Object.keys(AppModule).filter(k => k !== '__esModule');
            App = keys.length > 0 ? AppModule[keys[0]] : AppModule;
          }
        } else {
          App = AppModule;
        }

        if (!App || typeof App !== 'function') {
          reportError("No valid component exported from " + entryFile + ".\\n\\nMake sure to export default a component or export a component named 'App'.\\n\\nReceived: " + JSON.stringify(Object.keys(AppModule || {})));
          throw new Error("Invalid component export");
        }

        const root = ReactDOM.createRoot(document.getElementById("app-root"));
        root.render(React.createElement(App));
      } catch (error) {
        reportError(error.stack || error.message);
      }
    </script>
  </body>
</html>
  `.trim();
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
