import { WholesaleHeader } from "@/components/WholesaleHeader";
import { Footer } from "@/components/Footer";
import { WholesaleCartDrawer } from "@/components/CartDrawer";
import { WholesaleCartProvider } from "@/lib/wholesale-cart-context";
import { MobileTabBar } from "@/components/MobileTabBar";

export default function WholesaleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <WholesaleCartProvider>
      <WholesaleHeader />
      <main className="flex-1 pb-24 md:pb-0">{children}</main>
      <Footer />
      <MobileTabBar />
      <WholesaleCartDrawer />
    </WholesaleCartProvider>
  );
}
