import { Mail, MapPin, Phone } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { ProductArt } from "@/components/ProductArt";
import { ContactForm } from "@/components/ContactForm";

const CONTACT_INFO = [
  { icon: MapPin, label: "Location", value: "Accra, Ghana" },
  { icon: Phone, label: "Phone", value: "+233 XX XXX XXXX" },
  { icon: Mail, label: "Email", value: "hello@packagingambassadors.com" },
];

export default function ContactPage() {
  return (
    <div>
      <PageHero eyebrow="Get in Touch" title="We'd Love to Hear from You" />

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink-900">
              Contact Information
            </h2>
            <ul className="mt-6 space-y-5">
              {CONTACT_INFO.map((item) => (
                <li key={item.label} className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream-100 text-amber-700">
                    <item.icon className="h-5 w-5" strokeWidth={1.5} />
                  </span>
                  <div>
                    <p className="font-semibold text-ink-900">{item.label}</p>
                    <p className="text-sm text-ink-700/80">{item.value}</p>
                  </div>
                </li>
              ))}
            </ul>
            <ProductArt category="bags" className="mt-8 aspect-video w-full rounded-2xl" />
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-ink-900">
              Send a Message
            </h2>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
