import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { usePaddle } from "@/hooks/usePaddle";
import { usePolar } from "@/hooks/usePolar";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Smart Care" },
      { name: "description", content: "SmartCare TV is a premium media player for Android TV that lets you manage and play your own content." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Smart Care" },
      { property: "og:description", content: "SmartCare TV is a premium media player for Android TV that lets you manage and play your own content." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Smart Care" },
      { name: "twitter:description", content: "SmartCare TV is a premium media player for Android TV that lets you manage and play your own content." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8d97a494-e2a6-48ef-8d2f-57a2efa407ea/id-preview-6e3042f4--2f010635-504d-4165-b650-d7d3b7cbd961.lovable.app-1779567969253.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8d97a494-e2a6-48ef-8d2f-57a2efa407ea/id-preview-6e3042f4--2f010635-504d-4165-b650-d7d3b7cbd961.lovable.app-1779567969253.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
    scripts: [
      {
        src: "https://cdn.paddle.com/paddle/v2/paddle.js",
      },
      {
        src: "https://cdn.jsdelivr.net/npm/@polar-sh/checkout@0/dist/embed.global.js",
        defer: true,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  // This inline script runs synchronously before ANY paint.
  // It immediately hides the entire page if ?_ptxn= or ?polar_checkout= is in the URL,
  // preventing even a single frame of the website from being visible.
  const blockingScript = `
    (function(){
      var s = new URLSearchParams(location.search);
      if(s.get('_ptxn') || s.get('polar_checkout') || s.get('checkout_id')){
        document.documentElement.style.background='#0a0a0a';
        document.documentElement.style.visibility='hidden';
      }
    })();
  `;

  return (
    <html lang="en">
      <head>
        {/* MUST be first — blocks paint before anything else loads */}
        <script dangerouslySetInnerHTML={{ __html: blockingScript }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}


function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // Initialize Paddle globally and handle ?_ptxn= checkout links
  const { isCheckoutMode: isPaddleMode, checkoutClosed: paddleClosed } = usePaddle();

  // Initialize Polar globally and handle ?polar_checkout= / ?checkout_id= links
  const { isPolarCheckoutMode: isPolarMode, polarCheckoutClosed: polarClosed } = usePolar();

  // When a checkout link is opened (Paddle or Polar), show full-screen overlay immediately
  const showOverlay = (isPaddleMode && !paddleClosed) || (isPolarMode && !polarClosed);

  return (
    <QueryClientProvider client={queryClient}>
      {showOverlay && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background: "#0a0a0a",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "20px",
          }}
        >
          {/* Spinner */}
          <div
            style={{
              width: "48px",
              height: "48px",
              border: "3px solid rgba(255,255,255,0.1)",
              borderTop: "3px solid #e11d48",
              borderRadius: "50%",
              animation: "checkout-spin 0.8s linear infinite",
            }}
          />
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: 0 }}>
            Opening secure checkout…
          </p>
          <style>{`
            @keyframes checkout-spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
      {/* Always render Outlet but hide it behind the overlay when in checkout mode */}
      <div style={showOverlay ? { visibility: "hidden", pointerEvents: "none" } : undefined}>
        <Outlet />
      </div>
    </QueryClientProvider>
  );
}
