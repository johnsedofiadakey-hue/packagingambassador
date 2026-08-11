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

export default function PrivacyPage() {
  const { settings } = useAdminData();
  const name = settings.storeName || "Packaging Ambassadors";
  const email = settings.storeEmail || "hello@packagingambassadors.com";
  const phone = settings.storePhone || "+233 XX XXX XXXX";
  const address = settings.storeAddress || "Accra, Ghana";

  return (
    <div>
      <PageHero eyebrow="Legal" title="Privacy Policy" />

      <article className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm text-ink-700/60">Last updated: {LAST_UPDATED}</p>

        <Section title="1. Introduction">
          <p>
            {name} (&quot;we&quot;, &quot;us&quot;) respects your privacy. This policy explains what
            personal information we collect when you use our website or buy from us, how we use it, who
            we share it with, and the choices you have. We are based in {address}.
          </p>
        </Section>

        <Section title="2. Information we collect">
          <p>When you place an order or contact us, we may collect:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Your name and business name (for wholesale)</li>
            <li>Contact details — phone number and email address</li>
            <li>Delivery and billing address</li>
            <li>Order details and purchase history</li>
            <li>Messages you send us through the contact form or by email</li>
          </ul>
          <p>
            We do <strong>not</strong> collect or store your full card or mobile-money details — those
            are handled directly by our payment processor (see below).
          </p>
        </Section>

        <Section title="3. How we use your information">
          <ul className="list-disc space-y-1 pl-5">
            <li>To process, fulfil, and deliver your orders</li>
            <li>To send order confirmations and delivery status updates by email and SMS</li>
            <li>To respond to your enquiries and provide customer support</li>
            <li>To keep records for accounting, and to prevent fraud</li>
            <li>To improve our products and service</li>
          </ul>
        </Section>

        <Section title="4. Who we share it with">
          <p>We share personal information only with the service providers we rely on to run the
            store, and only as needed:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <a href="https://paystack.com" target="_blank" rel="noopener noreferrer">Paystack</a> —
              to process card and mobile-money payments securely.
            </li>
            <li>
              <a href="https://www.brevo.com" target="_blank" rel="noopener noreferrer">Brevo</a> —
              to send transactional emails such as order confirmations.
            </li>
            <li>Our SMS provider — to send order and delivery notifications by text.</li>
            <li>
              Google Firebase — for secure website hosting and database storage.
            </li>
            <li>Delivery partners — to deliver your order to you.</li>
          </ul>
          <p>We do not sell your personal information to anyone.</p>
        </Section>

        <Section title="5. Cookies">
          <p>
            Our site uses essential cookies and similar technologies needed to keep the site working —
            for example, to remember the items in your cart and to keep staff signed in to the admin
            area. We do not use them to build advertising profiles.
          </p>
        </Section>

        <Section title="6. Data retention">
          <p>
            We keep order and customer records for as long as needed to fulfil your order, provide
            support, and meet our legal, tax, and accounting obligations. When information is no longer
            needed, we delete or anonymise it.
          </p>
        </Section>

        <Section title="7. Security">
          <p>
            We take reasonable technical and organisational measures to protect your information,
            including access controls and encrypted connections. No method of transmission over the
            internet is completely secure, but we work to safeguard your data.
          </p>
        </Section>

        <Section title="8. Your rights">
          <p>
            You may ask us to access, correct, or delete the personal information we hold about you, or
            to stop sending you notifications. To make a request, contact us using the details below.
          </p>
        </Section>

        <Section title="9. Children">
          <p>Our site and products are intended for businesses and adults. We do not knowingly collect
            personal information from children.</p>
        </Section>

        <Section title="10. Changes to this policy">
          <p>We may update this policy from time to time. The &quot;last updated&quot; date above shows
            when it was last revised.</p>
        </Section>

        <Section title="11. Contact us">
          <p>To ask about this policy or exercise your rights, contact:</p>
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
