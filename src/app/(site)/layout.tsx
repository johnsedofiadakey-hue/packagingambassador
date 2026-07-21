import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PromoBar } from "@/components/PromoBar";
import { GrainOverlay } from "@/components/GrainOverlay";
import { SmoothScroll } from "@/components/SmoothScroll";
import { MobileTabBar } from "@/components/MobileTabBar";
import { CartProvider } from "@/lib/cart-context";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CartProvider>
      <SmoothScroll />
      <GrainOverlay />
      <PromoBar />
      <Header />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <Footer />
      <MobileTabBar />
    </CartProvider>
  );
}
