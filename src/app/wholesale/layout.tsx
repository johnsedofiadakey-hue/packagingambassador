import { WholesaleHeader } from "@/components/WholesaleHeader";
import { Footer } from "@/components/Footer";
import { WholesaleCartDrawer } from "@/components/CartDrawer";
import { WholesaleCartProvider } from "@/lib/wholesale-cart-context";

// Deliberately a fresh top-level route, not nested inside (site) — it needs its own cart
// provider and header, the same reasoning the codebase already applies to `admin`. Footer has
// no cart dependency, so it's reused as-is; retail's CartProvider/Header never mount here.
export default function WholesaleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <WholesaleCartProvider>
      <WholesaleHeader />
      <main className="flex-1">{children}</main>
      <Footer />
      <WholesaleCartDrawer />
    </WholesaleCartProvider>
  );
}
