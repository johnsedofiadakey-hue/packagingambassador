"use client";

import { PageHero } from "@/components/PageHero";
import { useAdminData } from "@/lib/store";

const LAST_UPDATED = "11 August 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="font-display text-xl font-bold text-ink-900">{title}</h2>
      <div className="mt-3 space-y-3 text-ink-700/85 [&_a]:font-medium [&_a]:text-amber-700 [&_a:hover]:underline [&_li]:ml-1">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  const { settings } = useAdminData();
  const name = settings.storeName || "Packaging Ambassadors";
  const email = settings.storeEmail || "hello@packagingambassadors.com";
  const phone = settings.storePhone || "+233 XX XXX XXXX";
  const address = settings.storeAddress || "Accra, Ghana";

  return (
    <div>
      <PageHero eyebrow="Legal" title="Terms of Service" />

      <article className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm text-ink-700/60">Last updated: {LAST_UPDATED}</p>

        <Section title="1. Introduction">
          <p>
            These Terms of Service (&quot;Terms&quot;) govern your access to and use of the {name}{" "}
            website and your purchase of products from us. By browsing this site or placing an order,
            you agree to these Terms. If you do not agree, please do not use the site. {name} is a
            packaging supply business based in {address}.
          </p>
        </Section>

        <Section title="2. Products and pricing">
          <p>
            We supply packaging products including paper cups, boxes, bags, wraps, and food-grade
            containers. All prices are listed in Ghana Cedis (GH₵) and, where a product is offered in
            multiple sizes, the price shown updates to reflect the size you select.
          </p>
          <p>
            We work to keep product descriptions, images, availability, and prices accurate, but
            errors can occur. We reserve the right to correct any errors and to change prices or
            product availability at any time before you place an order. Colours shown on screen may
            vary slightly from the physical product.
          </p>
        </Section>

        <Section title="3. Orders and acceptance">
          <p>
            Placing an order is an offer to purchase. An order is confirmed once payment is
            successfully received and you receive an order confirmation with a tracking number.
            We may decline or cancel an order — for example, if a product is out of stock, if there
            was a pricing error, or if we cannot verify payment — in which case we will arrange a
            refund of any amount charged.
          </p>
          <p>
            Wholesale orders may be subject to a minimum order quantity, currently {settings.wholesaleMOQ}{" "}
            items, and may be invoiced separately.
          </p>
        </Section>

        <Section title="4. Payment">
          <p>
            Online payments are processed securely by <a href="https://paystack.com" target="_blank" rel="noopener noreferrer">Paystack</a>,
            our third-party payment provider. We do not collect or store your full card details on our
            servers. In-store point-of-sale purchases may be paid by cash, mobile money, or card.
          </p>
        </Section>

        <Section title="5. Delivery">
          <p>
            We deliver across Ghana. Delivery times and fees depend on your location and order size,
            and will be confirmed with you after your order is placed. Risk in the products passes to
            you on delivery. Please inspect your order on receipt and contact us promptly if anything
            is missing or damaged.
          </p>
        </Section>

        <Section title="6. Returns and refunds">
          <p>
            If a product is defective, damaged, or not what you ordered, contact us within 7 days of
            receipt with your order number and, where possible, your receipt. We will arrange a
            replacement, exchange, or refund as appropriate. Custom or made-to-order items, and items
            that have been used, may not be eligible for return except where faulty. Approved refunds
            are issued to your original payment method.
          </p>
        </Section>

        <Section title="7. Your responsibilities">
          <p>You agree to provide accurate order and delivery information, and not to misuse the site,
            attempt to disrupt it, or use it for any unlawful purpose.</p>
        </Section>

        <Section title="8. Intellectual property">
          <p>
            All content on this site — including the {name} name, logo, text, and images — is owned by
            or licensed to us and may not be copied or reused without our written permission.
          </p>
        </Section>

        <Section title="9. Limitation of liability">
          <p>
            To the fullest extent permitted by law, {name} is not liable for indirect or consequential
            losses arising from your use of the site or products. Nothing in these Terms limits any
            rights you have under applicable Ghanaian consumer law.
          </p>
        </Section>

        <Section title="10. Governing law">
          <p>These Terms are governed by the laws of the Republic of Ghana, and any disputes are
            subject to the jurisdiction of the Ghanaian courts.</p>
        </Section>

        <Section title="11. Changes to these Terms">
          <p>We may update these Terms from time to time. The &quot;last updated&quot; date above shows when
            they were last revised. Continued use of the site after changes means you accept the
            updated Terms.</p>
        </Section>

        <Section title="12. Contact us">
          <p>
            Questions about these Terms? Reach us at:
          </p>
          <ul className="list-none space-y-1">
            <li>Email: <a href={`mailto:${email}`}>{email}</a></li>
            <li>Phone: <a href={`tel:${phone.replace(/[^\d+]/g, "")}`}>{phone}</a></li>
            <li>Address: {address}</li>
          </ul>
        </Section>
      </article>
    </div>
  );
}
