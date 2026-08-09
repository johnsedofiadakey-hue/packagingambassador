import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AdminDataProvider } from "@/lib/store";
import { ThemeInjector } from "@/components/ThemeInjector";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Packaging Ambassadors — Ghana's Packaging Partner",
  description:
    "Premium kraft cups, boxes, bags, and containers — made from quality materials, delivered fast across Ghana.",
  // iOS "Add to Home Screen": open standalone with our own status bar treatment.
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PA Staff",
  },
  icons: { apple: "/icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#dd8f2e",
  // Let the app use the full screen (incl. notch area) when installed.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <AdminDataProvider>
          <ThemeInjector />
          {children}
        </AdminDataProvider>
      </body>
    </html>
  );
}
