import Link from "next/link";
import { Leaf, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-forest-900 text-cream-100/90">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-forest-900">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-bold text-white">
              Packaging Ambassadors
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm text-cream-100/70">
            Ghana&apos;s packaging partner — premium kraft cups, boxes, bags, and
            containers for businesses that care about how they show up.
          </p>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wide text-amber-400">
            Shop
          </h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/category/cups" className="hover:text-white">Cups</Link></li>
            <li><Link href="/category/boxes" className="hover:text-white">Boxes</Link></li>
            <li><Link href="/category/bags" className="hover:text-white">Bags</Link></li>
            <li><Link href="/shop" className="hover:text-white">All Products</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wide text-amber-400">
            Company
          </h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-white">Our Story</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wide text-amber-400">
            Get in Touch
          </h4>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              Accra, Ghana
            </li>
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              +233 XX XXX XXXX
            </li>
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              hello@packagingambassadors.com
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-6 py-5 text-center text-xs text-cream-100/60">
        © {new Date().getFullYear()} Packaging Ambassadors. Born in Ghana. Built for
        businesses.
      </div>
    </footer>
  );
}
