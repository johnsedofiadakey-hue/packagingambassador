import type { MetadataRoute } from "next";

/**
 * Web app manifest — makes the staff console installable ("Add to Home Screen") and opens it
 * standalone/full-screen so it feels native. Next auto-links this at /manifest.webmanifest.
 * start_url points at the staff login so an installed icon drops staff straight into their app
 * (already-signed-in staff are forwarded on to their POS/home from there).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Packaging Ambassadors — Staff Console",
    short_name: "PA Staff",
    description: "Point of sale, orders, and inventory for Packaging Ambassadors staff.",
    start_url: "/admin/login",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fffbf4",
    theme_color: "#dd8f2e",
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
