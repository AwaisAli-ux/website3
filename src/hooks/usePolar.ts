import { useEffect, useState } from "react";

// Extend window type to include Polar JS SDK if loaded
declare global {
  interface Window {
    Polar?: {
      init?: (options?: { token?: string }) => void;
      open?: (options: { checkoutId?: string; url?: string }) => void;
      Checkout?: {
        open?: (options: { checkoutId?: string; url?: string }) => void;
      };
    };
    PolarEmbed?: {
      open?: (url: string) => void;
    };
  }
}

/**
 * usePolar – Initializes Polar.sh embed SDK globally and automatically opens
 * the checkout modal when `?polar_checkout=` or `?checkout_id=` parameter is in the URL.
 *
 * Returns `isPolarCheckoutMode: true` immediately (synchronously) when the parameter
 * is detected, blocking the page render until Polar checkout is triggered.
 */
export function usePolar() {
  // Detect ?polar_checkout= or ?checkout_id= synchronously on first render
  const checkoutId =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("polar_checkout") ||
        new URLSearchParams(window.location.search).get("checkout_id")
      : null;

  const isPolarCheckoutMode = Boolean(checkoutId);
  const [polarCheckoutClosed, setPolarCheckoutClosed] = useState(false);

  useEffect(() => {
    if (!checkoutId) return;

    const token = import.meta.env.VITE_POLAR_TOKEN as string | undefined;

    const initPolar = () => {
      // Restore visibility so the modal/overlay can be seen
      document.documentElement.style.visibility = "visible";

      // If full Polar checkout URL or slug was passed, redirect or embed
      const targetUrl = checkoutId.startsWith("http")
        ? checkoutId
        : `https://buy.polar.sh/${checkoutId}`;

      // Check if Polar JS SDK is available for modal embed
      if (window.Polar?.open) {
        window.Polar.open({ url: targetUrl });
      } else if (window.Polar?.Checkout?.open) {
        window.Polar.Checkout.open({ url: targetUrl });
      } else if (window.PolarEmbed?.open) {
        window.PolarEmbed.open(targetUrl);
      } else {
        // Fallback: If SDK isn't available or modal is blocked, redirect to Polar checkout URL
        window.location.href = targetUrl;
      }
    };

    // Small timeout to allow Polar JS script to load if injected
    const timer = setTimeout(initPolar, 100);

    // Listen for close/escape message if iframe overlay posts message
    const handleMessage = (event: MessageEvent) => {
      if (
        event.data === "polar:checkout:closed" ||
        event.data?.type === "polar:checkout:closed"
      ) {
        setPolarCheckoutClosed(true);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("message", handleMessage);
    };
  }, [checkoutId]);

  return { isPolarCheckoutMode, polarCheckoutClosed };
}
