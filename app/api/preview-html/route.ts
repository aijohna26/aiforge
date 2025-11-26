import { NextRequest } from "next/server";

// Helper function to generate HTML
function generatePreviewHtml(code: string, name: string): string {
  console.log('[PreviewHTML] Generating preview for:', name);
  console.log('[PreviewHTML] Original code length:', code.length);

  // Minimal transformation - only remove imports and exports
  // Babel will handle TypeScript transformation in the browser
  let transformedCode = code;

  // Remove all import statements (Babel can't resolve external modules)
  transformedCode = transformedCode.replace(/import\s+[\s\S]*?from\s+["'][^"']+["'];?\s*/g, "");
  transformedCode = transformedCode.replace(/import\s+["'][^"']+["'];?\s*/g, "");
  transformedCode = transformedCode.replace(/import\s+type\s+[\s\S]*?;/g, "");

  // Handle export default
  transformedCode = transformedCode.replace(/export\s+default\s+function\s+(\w+)/, "function $1");
  transformedCode = transformedCode.replace(/export\s+default\s+/, "const App = ");

  console.log('[PreviewHTML] Transformed code length:', transformedCode.length);
  console.log('[PreviewHTML] Note: Babel will handle TypeScript transformation in browser');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <title>${name}</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script crossorigin src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root {
      height: 100%;
      width: 100%;
      overflow: hidden;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
      background: #0f172a;
    }
    /* React Native Web polyfills */
    .rn-view { display: flex; flex-direction: column; position: relative; }
    .rn-text { font-size: 14px; color: #000; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="react,typescript" data-type="module">
    // React Native Web primitives implemented with React DOM
    const View = ({ style, children, ...props }) => {
      const baseStyle = {
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxSizing: 'border-box',
      };
      return React.createElement('div', { style: { ...baseStyle, ...flattenStyle(style) }, ...props }, children);
    };

    const Text = ({ style, children, ...props }) => {
      const baseStyle = {
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
        fontSize: 14,
      };
      return React.createElement('span', { style: { ...baseStyle, ...flattenStyle(style) }, ...props }, children);
    };

    const TouchableOpacity = ({ style, onPress, children, ...props }) => {
      const [pressed, setPressed] = React.useState(false);
      return React.createElement('div', {
        style: { ...flattenStyle(style), cursor: 'pointer', opacity: pressed ? 0.7 : 1, transition: 'opacity 0.1s' },
        onClick: onPress,
        onMouseDown: () => setPressed(true),
        onMouseUp: () => setPressed(false),
        onMouseLeave: () => setPressed(false),
        ...props
      }, children);
    };

    const Pressable = TouchableOpacity;

    const ScrollView = ({ style, children, ...props }) => {
      return React.createElement('div', {
        style: { ...flattenStyle(style), overflow: 'auto', WebkitOverflowScrolling: 'touch' },
        ...props
      }, children);
    };

    const FlatList = ({ data, renderItem, keyExtractor, style, ...props }) => {
      return React.createElement('div', {
        style: { ...flattenStyle(style), overflow: 'auto', WebkitOverflowScrolling: 'touch' },
        ...props
      }, data?.map((item, index) => {
        const key = keyExtractor ? keyExtractor(item, index) : index;
        return React.createElement('div', { key }, renderItem({ item, index }));
      }));
    };

    const Modal = ({ visible, children, transparent, animationType, onRequestClose, ...props }) => {
      if (!visible) return null;
      return React.createElement('div', {
        style: {
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: transparent ? 'rgba(0,0,0,0.5)' : '#fff',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        },
        onClick: onRequestClose,
        ...props
      }, React.createElement('div', { onClick: e => e.stopPropagation() }, children));
    };

    const Alert = {
      alert: (title, message, buttons) => {
        if (buttons && buttons.length > 0) {
          const result = window.confirm(title + (message ? '\\n' + message : ''));
          const btn = result ? buttons.find(b => b.style !== 'cancel') : buttons.find(b => b.style === 'cancel');
          btn?.onPress?.();
        } else {
          window.alert(title + (message ? '\\n' + message : ''));
        }
      }
    };

    const TextInput = ({ style, value, onChangeText, placeholder, placeholderTextColor, multiline, onSubmitEditing, ...props }) => {
      const flatStyle = flattenStyle(style);
      const baseStyle = {
        ...flatStyle,
        outline: 'none',
        border: flatStyle.borderWidth ? undefined : '1px solid #ccc',
        padding: flatStyle.padding || '8px',
        fontFamily: 'inherit',
        fontSize: flatStyle.fontSize || 14,
        color: flatStyle.color || '#000',
        backgroundColor: flatStyle.backgroundColor || '#fff',
        borderRadius: flatStyle.borderRadius || 0,
      };

      if (multiline) {
        return React.createElement('textarea', {
          style: { ...baseStyle, resize: 'none' },
          value,
          onChange: (e) => onChangeText?.(e.target.value),
          placeholder,
          ...props
        });
      }

      return React.createElement('input', {
        type: 'text',
        style: baseStyle,
        value,
        onChange: (e) => onChangeText?.(e.target.value),
        onKeyDown: (e) => e.key === 'Enter' && onSubmitEditing?.(),
        placeholder,
        ...props
      });
    };

    const Image = ({ source, style, ...props }) => {
      const src = typeof source === 'string' ? source : source?.uri;
      return React.createElement('img', { src, style: flattenStyle(style), ...props });
    };

    const StyleSheet = {
      create: (styles) => styles,
      flatten: (style) => flattenStyle(style),
    };

    // Helper to flatten style arrays
    function flattenStyle(style) {
      if (!style) return {};
      if (Array.isArray(style)) {
        return style.reduce((acc, s) => ({ ...acc, ...flattenStyle(s) }), {});
      }
      // Convert React Native style names to web
      const webStyle = { ...style };
      if (webStyle.marginHorizontal !== undefined) {
        webStyle.marginLeft = webStyle.marginHorizontal;
        webStyle.marginRight = webStyle.marginHorizontal;
        delete webStyle.marginHorizontal;
      }
      if (webStyle.marginVertical !== undefined) {
        webStyle.marginTop = webStyle.marginVertical;
        webStyle.marginBottom = webStyle.marginVertical;
        delete webStyle.marginVertical;
      }
      if (webStyle.paddingHorizontal !== undefined) {
        webStyle.paddingLeft = webStyle.paddingHorizontal;
        webStyle.paddingRight = webStyle.paddingHorizontal;
        delete webStyle.paddingHorizontal;
      }
      if (webStyle.paddingVertical !== undefined) {
        webStyle.paddingTop = webStyle.paddingVertical;
        webStyle.paddingBottom = webStyle.paddingVertical;
        delete webStyle.paddingVertical;
      }
      return webStyle;
    }

    const { useState, useEffect, useCallback, useMemo, useRef, useReducer } = React;

    // Define common variables that generated code might reference
    let container, root, element, node, ref;

    // User's app code wrapped in try-catch
    try {
      ${transformedCode}
    } catch (error) {
      console.error('Error loading app code:', error);
    }

    // Render the app
    const AppComponent = typeof App !== 'undefined' ? App :
                         typeof Index !== 'undefined' ? Index :
                         () => React.createElement(View, {
                           style: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a'}
                         }, React.createElement(Text, {style: {color: '#fff', fontSize: 18}}, '${name}'));

    try {
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(AppComponent));
    } catch (error) {
      console.error('Error rendering app:', error);
      document.getElementById('root').innerHTML = '<div style="color: white; padding: 20px; text-align: center;">Error rendering app. Check console for details.</div>';
    }
  </script>
</body>
</html>`;

  return html;
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code") || "";
  const name = searchParams.get("name") || "App Preview";

  const html = generatePreviewHtml(code, name);

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code = body.code || "";
    const name = body.name || "App Preview";

    const html = generatePreviewHtml(code, name);

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Preview generation error:", error);
    return new Response("Failed to generate preview", { status: 500 });
  }
}
