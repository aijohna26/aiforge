import { json, type LinksFunction, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData, useRevalidator } from '@remix-run/react';
import tailwindReset from '@unocss/reset/tailwind-compat.css?url';
import { themeStore } from './lib/stores/theme';
import { stripIndents } from './utils/stripIndent';
import { createHead } from 'remix-island';
import { useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ClientOnly } from 'remix-utils/client-only';
import { cssTransition, ToastContainer } from 'react-toastify';
import { createClient as createServerClient } from './lib/supabase/server';
import { createClient as createBrowserClient } from './lib/supabase/browser';
import { alertStore, hideAlert } from './lib/stores/alertStore';
import { CreditAlert } from './components/workbench/design/CreditAlert';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const response = new Headers();
  const supabase = createServerClient(request, response);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return json(
    {
      session,
      env: {
        VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
    },
    {
      headers: response,
    },
  );
};

import reactToastifyStyles from 'react-toastify/dist/ReactToastify.css?url';
import globalStyles from './styles/index.scss?url';
import xtermStyles from '@xterm/xterm/css/xterm.css?url';
import fontsStyles from './styles/fonts.css?url';

import 'virtual:uno.css';

const toastAnimation = cssTransition({
  enter: 'animated fadeInRight',
  exit: 'animated fadeOutRight',
});

export const links: LinksFunction = () => [
  {
    rel: 'icon',
    href: '/favicon.svg',
    type: 'image/svg+xml',
  },
  // Preload critical resources
  {
    rel: 'preload',
    href: fontsStyles,
    as: 'style'
  },
  {
    rel: 'preload',
    href: globalStyles,
    as: 'style'
  },
  // Load stylesheets in order of importance
  { rel: 'stylesheet', href: tailwindReset },
  { rel: 'stylesheet', href: fontsStyles },
  { rel: 'stylesheet', href: globalStyles },
  { rel: 'stylesheet', href: reactToastifyStyles },
  { rel: 'stylesheet', href: xtermStyles },
];

const inlineThemeCode = stripIndents`
  setTutorialKitTheme();

  function setTutorialKitTheme() {
    let theme = localStorage.getItem('bolt_theme');

    if (!theme) {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    document.querySelector('html')?.setAttribute('data-theme', theme);
  }
`;

export const Head = createHead(() => (
  <>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <Meta />
    <Links />
    <script dangerouslySetInnerHTML={{ __html: inlineThemeCode }} />
  </>
));

export function Layout({ children }: { children: React.ReactNode }) {
  const theme = useStore(themeStore);

  useEffect(() => {
    document.querySelector('html')?.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <>
      <ClientOnly>{() => <DndProvider backend={HTML5Backend}>{children}</DndProvider>}</ClientOnly>
      <ToastContainer
        closeButton={({ closeToast }) => {
          return (
            <button className="Toastify__close-button" onClick={closeToast}>
              <div className="i-ph:x text-lg" />
            </button>
          );
        }}
        icon={({ type }) => {
          switch (type) {
            case 'success': {
              return <div className="i-ph:check-bold text-bolt-elements-icon-success text-2xl" />;
            }
            case 'error': {
              return <div className="i-ph:warning-circle-bold text-bolt-elements-icon-error text-2xl" />;
            }
          }

          return undefined;
        }}
        position="bottom-right"
        pauseOnFocusLoss
        transition={toastAnimation}
        autoClose={3000}
      />
      <ScrollRestoration />
      <Scripts />
      <GlobalAlert />
    </>
  );
}

function GlobalAlert() {
  const alert = useStore(alertStore);

  if (!alert) {
    return null;
  }

  return (
    <CreditAlert
      message={alert.message}
      description={alert.description}
      onClose={hideAlert}
    />
  );
}

import { useStore } from '@nanostores/react';
import { logStore } from './lib/stores/logs';

export default function App() {
  const { session, env } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const theme = useStore(themeStore);
  const [supabase] = useState(() => createBrowserClient());

  const serverUserId = session?.user?.id;

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.id !== serverUserId) {
        revalidator.revalidate();
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, serverUserId, revalidator]);

  useEffect(() => {
    logStore.logSystem('Application initialized', {
      theme,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      user: session?.user?.email,
    });

    // Initialize debug logging with improved error handling
    import('./utils/debugLogger')
      .then(({ debugLogger }) => {
        const status = debugLogger.getStatus();
        logStore.logSystem('Debug logging ready', {
          initialized: status.initialized,
          capturing: status.capturing,
          enabled: status.enabled,
        });
      })
      .catch((error) => {
        logStore.logError('Failed to initialize debug logging', error);
      });
  }, []);

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
