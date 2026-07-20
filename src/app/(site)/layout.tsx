import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PromoBar } from "@/components/PromoBar";
import { CartProvider } from "@/lib/cart-context";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CartProvider>
      <PromoBar />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </CartProvider>
  );
}
