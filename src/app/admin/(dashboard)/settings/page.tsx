"use client";

import { useState } from "react";
import { AlertTriangle, Check, X } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { storage } from "@/lib/firebase";
import {
  useAdminData,
  DEFAULT_THEME,
  type HeroSettings,
  type ThemeSettings,
  type PageContentSettings,
  type WhyUsCard,
} from "@/lib/store";
import { PasswordForm } from "@/app/admin/(dashboard)/settings/PasswordForm";
import { cn } from "@/lib/utils";

const TABS = [
  "General",
  "Hero & Homepage",
  "Page Content",
  "Colors & Branding",
  "Promotion",
  "Payment",
  "Notifications",
  "Account",
] as const;
type Tab = (typeof TABS)[number];

function SecretWarning({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-ink-800">
      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
      <p>{children}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  rows = 3,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  hint?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
        {label}
      </label>
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
      />
      {hint && <p className="mt-1 text-xs text-ink-700/50">{hint}</p>}
    </div>
  );
}

function SaveButton({ saved }: { saved: boolean }) {
  return (
    <button
      type="submit"
      className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-amber-600"
    >
      {saved ? <Check className="h-4 w-4" /> : null}
      {saved ? "Saved" : "Save Changes"}
    </button>
  );
}

function HeroForm({ hero, onSave }: { hero: HeroSettings; onSave: (hero: HeroSettings) => Promise<void> }) {
  const [values, setValues] = useState<HeroSettings>(hero);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof HeroSettings>(key: K, value: HeroSettings[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const addSlides = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const path = `hero/${crypto.randomUUID()}-${file.name}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        urls.push(await getDownloadURL(storageRef));
      }
      setValues((prev) => ({ ...prev, slides: [...prev.slides, ...urls] }));
    } catch {
      setError("Couldn't upload one or more slides. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removeSlide = (index: number) =>
    setValues((prev) => ({ ...prev, slides: prev.slides.filter((_, i) => i !== index) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSave(values);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Couldn't save the hero section. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <p className="text-sm text-ink-700/70">
        Controls the full-screen homepage hero. Add background slides — they crossfade behind the
        headline. Leave them empty to use the branded gradient. The Shop Now and Track Your Order
        buttons are fixed.
      </p>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
          Hero Background Slides
        </label>
        {values.slides.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {values.slides.map((src, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-20 w-28 rounded-xl object-cover" />
                <button
                  type="button"
                  onClick={() => removeSlide(i)}
                  aria-label="Remove slide"
                  className="absolute -right-2 -top-2 rounded-full bg-red-600 p-1 text-white shadow"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => addSlides(e.target.files)}
          className="mt-3 block text-xs text-ink-700/70 file:mr-3 file:rounded-full file:border-0 file:bg-amber-500 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
        />
        {uploading && <p className="mt-1 text-xs text-ink-700/60">Uploading…</p>}
        <p className="mt-1 text-xs text-ink-700/50">
          Full-bleed background photos. Multiple slides crossfade automatically. Empty = branded
          gradient.
        </p>
      </div>

      <Field label="Badge Text" value={values.badgeText} onChange={(v) => set("badgeText", v)} />
      <Field label="Headline (line 1)" value={values.headline} onChange={(v) => set("headline", v)} />
      <TextareaField
        label="Headline Accent"
        value={values.headlineAccent}
        onChange={(v) => set("headlineAccent", v)}
        rows={2}
        hint="Rendered in amber below the headline. Use a new line to wrap onto two lines."
      />
      <TextareaField label="Subtext" value={values.subtext} onChange={(v) => set("subtext", v)} />

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-60"
      >
        {saved ? <Check className="h-4 w-4" /> : null}
        {saving ? "Saving…" : saved ? "Saved" : "Save Changes"}
      </button>
    </form>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
        {label}
      </label>
      <div className="mt-2 flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 shrink-0 cursor-pointer rounded-lg border border-cream-200 bg-white p-1"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm uppercase focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
        />
      </div>
    </div>
  );
}

function ThemeForm({
  theme,
  defaultTheme,
  onSave,
}: {
  theme: ThemeSettings;
  defaultTheme: ThemeSettings;
  onSave: (theme: ThemeSettings) => Promise<void>;
}) {
  const [values, setValues] = useState<ThemeSettings>(theme);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(values);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
      <p className="text-sm text-ink-700/70">
        Controls the site&apos;s core brand colors — every button, badge, and heading across both
        the storefront and this admin portal derives its shades from these five values.
      </p>
      <ColorField
        label="Primary (main buttons, links)"
        value={values.primaryColor}
        onChange={(v) => set("primaryColor", v)}
      />
      <ColorField
        label="Secondary (footer, eco badge)"
        value={values.secondaryColor}
        onChange={(v) => set("secondaryColor", v)}
      />
      <ColorField
        label="Accent (logo mark, “New” badge)"
        value={values.accentColor}
        onChange={(v) => set("accentColor", v)}
      />
      <ColorField
        label="Text"
        value={values.textColor}
        onChange={(v) => set("textColor", v)}
      />
      <ColorField
        label="Background"
        value={values.backgroundColor}
        onChange={(v) => set("backgroundColor", v)}
      />
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-60"
        >
          {saved ? <Check className="h-4 w-4" /> : null}
          {saving ? "Saving…" : saved ? "Saved" : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => setValues(defaultTheme)}
          className="rounded-full border border-ink-900/15 px-6 py-3 font-semibold text-ink-800 transition-colors hover:bg-ink-900/5"
        >
          Reset to Default
        </button>
      </div>
    </form>
  );
}

function PageContentForm({
  content,
  onSave,
}: {
  content: PageContentSettings;
  onSave: (content: PageContentSettings) => Promise<void>;
}) {
  const [values, setValues] = useState<PageContentSettings>(content);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof PageContentSettings>(key: K, value: PageContentSettings[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const setCard = <K extends keyof WhyUsCard>(index: number, key: K, value: WhyUsCard[K]) =>
    setValues((prev) => ({
      ...prev,
      whyUsCards: prev.whyUsCards.map((card, i) => (i === index ? { ...card, [key]: value } : card)),
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(values);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
      <div className="space-y-4">
        <h3 className="font-display font-semibold text-ink-900">About Page</h3>
        <TextareaField
          label="Intro Paragraph"
          value={values.aboutIntro}
          onChange={(v) => set("aboutIntro", v)}
        />
        <Field
          label="Story Title"
          value={values.aboutStoryTitle}
          onChange={(v) => set("aboutStoryTitle", v)}
        />
        <TextareaField
          label="Story Paragraph 1"
          value={values.aboutStoryParagraph1}
          onChange={(v) => set("aboutStoryParagraph1", v)}
        />
        <TextareaField
          label="Story Paragraph 2"
          value={values.aboutStoryParagraph2}
          onChange={(v) => set("aboutStoryParagraph2", v)}
        />
      </div>

      <div className="space-y-4 border-t border-cream-200 pt-6">
        <h3 className="font-display font-semibold text-ink-900">
          Homepage &ldquo;Why Us&rdquo; Cards
        </h3>
        {values.whyUsCards.map((card, i) => (
          <div key={i} className="space-y-2 rounded-xl border border-cream-200 p-4">
            <Field label={`Card ${i + 1} Title`} value={card.title} onChange={(v) => setCard(i, "title", v)} />
            <TextareaField
              label={`Card ${i + 1} Description`}
              value={card.description}
              onChange={(v) => setCard(i, "description", v)}
              rows={2}
            />
          </div>
        ))}
      </div>

      <div className="space-y-4 border-t border-cream-200 pt-6">
        <h3 className="font-display font-semibold text-ink-900">Footer</h3>
        <TextareaField
          label="Tagline (under the logo)"
          value={values.footerTagline}
          onChange={(v) => set("footerTagline", v)}
          rows={2}
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-60"
      >
        {saved ? <Check className="h-4 w-4" /> : null}
        {saving ? "Saving…" : saved ? "Saved" : "Save Changes"}
      </button>
    </form>
  );
}

export default function AdminSettingsPage() {
  const { settings, updateSettings } = useAdminData();
  const [tab, setTab] = useState<Tab>("General");
  const [saved, setSaved] = useState(false);

  const [general, setGeneral] = useState({
    storeName: settings.storeName,
    storePhone: settings.storePhone,
    storeEmail: settings.storeEmail,
    storeAddress: settings.storeAddress,
    checkoutLocked: settings.checkoutLocked,
    checkoutLockMessage: settings.checkoutLockMessage,
    wholesaleCheckoutLocked: settings.wholesaleCheckoutLocked,
    wholesaleCheckoutLockMessage: settings.wholesaleCheckoutLockMessage,
    wholesaleMOQ: settings.wholesaleMOQ,
    lowStockThreshold: settings.lowStockThreshold,
  });
  const [notifications, setNotifications] = useState({
    smsProvider: settings.smsProvider,
    smsSenderId: settings.smsSenderId,
    emailProvider: settings.emailProvider,
    emailFromAddress: settings.emailFromAddress,
  });
  const [promotion, setPromotion] = useState(settings.promotion);

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <AdminPageHeader title="Settings" description="Store configuration and account security." />

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-full border border-ink-900/8 bg-cream-50 p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              tab === t ? "bg-amber-500 text-white" : "text-ink-700 hover:bg-ink-900/5"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-ink-900/8 bg-cream-50 p-6">
        {tab === "General" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const update = { ...general, wholesaleMOQ: Number(general.wholesaleMOQ) || 1, lowStockThreshold: Number(general.lowStockThreshold) || 1 };
              updateSettings(update);
              flashSaved();
            }}
            className="max-w-sm space-y-4"
          >
            <Field
              label="Store Name"
              value={general.storeName}
              onChange={(v) => setGeneral((s) => ({ ...s, storeName: v }))}
            />
            <Field
              label="Store Phone"
              value={general.storePhone}
              onChange={(v) => setGeneral((s) => ({ ...s, storePhone: v }))}
            />
            <Field
              label="Store Email"
              type="email"
              value={general.storeEmail}
              onChange={(v) => setGeneral((s) => ({ ...s, storeEmail: v }))}
            />

            <div className="border-t border-ink-900/8 pt-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-ink-900">
                <input
                  type="checkbox"
                  checked={general.checkoutLocked}
                  onChange={(e) =>
                    setGeneral((s) => ({ ...s, checkoutLocked: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-ink-900/20 text-amber-600 focus:ring-amber-500/40"
                />
                Pause checkout
              </label>
              <p className="mt-1 text-xs text-ink-700/60">
                Hides the storefront&apos;s Checkout button and shows the message below instead.
                Existing carts stay intact — customers just can&apos;t pay until this is unchecked.
              </p>
              {general.checkoutLocked && (
                <div className="mt-3">
                  <Field
                    label="Message shown to customers"
                    value={general.checkoutLockMessage}
                    onChange={(v) =>
                      setGeneral((s) => ({ ...s, checkoutLockMessage: v }))
                    }
                  />
                </div>
              )}
            </div>

            <div className="border-t border-ink-900/8 pt-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-ink-900">
                <input
                  type="checkbox"
                  checked={general.wholesaleCheckoutLocked}
                  onChange={(e) =>
                    setGeneral((s) => ({ ...s, wholesaleCheckoutLocked: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-ink-900/20 text-forest-600 focus:ring-forest-600/40"
                />
                Pause wholesale checkout
              </label>
              <p className="mt-1 text-xs text-ink-700/60">
                Independent of the retail pause above — hides only the wholesale storefront&apos;s
                Checkout button.
              </p>
              {general.wholesaleCheckoutLocked && (
                <div className="mt-3">
                  <Field
                    label="Message shown to wholesale customers"
                    value={general.wholesaleCheckoutLockMessage}
                    onChange={(v) =>
                      setGeneral((s) => ({ ...s, wholesaleCheckoutLockMessage: v }))
                    }
                  />
                </div>
              )}
            </div>

            <div className="border-t border-ink-900/8 pt-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
                Wholesale Minimum Order Quantity (MOQ)
              </label>
              <input
                type="number"
                min="1"
                value={general.wholesaleMOQ}
                onChange={(e) => setGeneral((s) => ({ ...s, wholesaleMOQ: parseInt(e.target.value, 10) || 1 }))}
                className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
              />
              <p className="mt-1 text-xs text-ink-700/60">
                Minimum total number of items required in the cart to check out on the wholesale storefront.
              </p>
            </div>

            <div className="border-t border-ink-900/8 pt-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
                Low Stock Alert Threshold
              </label>
              <input
                type="number"
                min="1"
                value={general.lowStockThreshold}
                onChange={(e) => setGeneral((s) => ({ ...s, lowStockThreshold: parseInt(e.target.value, 10) || 1 }))}
                className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
              />
              <p className="mt-1 text-xs text-ink-700/60">
                Products with stock at or below this number will be flagged as &ldquo;Low Stock&rdquo; in the admin product list.
              </p>
            </div>

            <div className="border-t border-ink-900/8 pt-4">
              <Field
                label="Store Address"
                value={general.storeAddress}
                onChange={(v) => setGeneral((s) => ({ ...s, storeAddress: v }))}
              />
              <p className="mt-1 text-xs text-ink-700/60">
                Shown on invoices and receipts.
              </p>
            </div>

            <SaveButton saved={saved} />
          </form>
        )}

        {tab === "Hero & Homepage" && (
          <HeroForm hero={settings.hero} onSave={(hero) => updateSettings({ hero })} />
        )}

        {tab === "Page Content" && (
          <PageContentForm
            content={settings.pageContent}
            onSave={(pageContent) => updateSettings({ pageContent })}
          />
        )}

        {tab === "Colors & Branding" && (
          <ThemeForm
            theme={settings.theme}
            defaultTheme={DEFAULT_THEME}
            onSave={(theme) => updateSettings({ theme })}
          />
        )}

        {tab === "Promotion" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateSettings({ promotion });
              flashSaved();
            }}
            className="max-w-sm space-y-4"
          >
            <p className="text-sm text-ink-700/70">
              A slim banner shown above the header on every storefront page. Leave it off until you
              have a real offer to announce.
            </p>
            <label className="flex items-center gap-3 text-sm font-semibold text-ink-900">
              <input
                type="checkbox"
                checked={promotion.enabled}
                onChange={(e) => setPromotion((p) => ({ ...p, enabled: e.target.checked }))}
                className="h-4 w-4 rounded border-cream-200 accent-amber-500"
              />
              Show promotion banner on the storefront
            </label>
            <TextareaField
              label="Banner Text"
              value={promotion.text}
              onChange={(v) => setPromotion((p) => ({ ...p, text: v }))}
              rows={2}
            />
            <Field
              label="Button Label"
              value={promotion.ctaLabel}
              onChange={(v) => setPromotion((p) => ({ ...p, ctaLabel: v }))}
            />
            <Field
              label="Button Link"
              value={promotion.ctaHref}
              onChange={(v) => setPromotion((p) => ({ ...p, ctaHref: v }))}
            />
            <SaveButton saved={saved} />
          </form>
        )}

        {tab === "Payment" && (
          <div className="max-w-sm">
            <SecretWarning>
              Checkout charges customers for real through Paystack — but the API keys live in
              environment variables (
              <code className="rounded bg-ink-900/5 px-1">PAYSTACK_SECRET_KEY</code>,{" "}
              <code className="rounded bg-ink-900/5 px-1">NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY</code>),
              not in this form. Storing the secret key here would make it readable by any
              signed-in staff account — and this store&apos;s settings doc is public-read besides,
              since the storefront needs it anonymously. To change keys, update them in
              deployment config and redeploy.
            </SecretWarning>
          </div>
        )}

        {tab === "Notifications" && (
          <div className="max-w-sm">
            <SecretWarning>
              Order confirmations now send for real through Arkesel (SMS) and Brevo (email) — but
              the actual API keys live in server environment variables (
              <code className="rounded bg-ink-900/5 px-1">ARKESEL_API_KEY</code>,{" "}
              <code className="rounded bg-ink-900/5 px-1">BREVO_API_KEY</code>), not in this form.
              Storing real secrets here would make them readable by any signed-in staff account.
              Leave a key unset to skip that channel. The confirmation email is automatically
              branded with your logo and the colors set in Colors &amp; Branding, and includes a
              one-click tracking link.
            </SecretWarning>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateSettings(notifications);
                flashSaved();
              }}
              className="space-y-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">SMS</p>
              <Field
                label="SMS Provider"
                placeholder="Arkesel"
                value={notifications.smsProvider}
                onChange={(v) => setNotifications((s) => ({ ...s, smsProvider: v }))}
              />
              <Field
                label="SMS Sender ID"
                value={notifications.smsSenderId}
                onChange={(v) => setNotifications((s) => ({ ...s, smsSenderId: v }))}
              />

              <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-amber-600">
                Email
              </p>
              <Field
                label="Email Provider"
                placeholder="Brevo"
                value={notifications.emailProvider}
                onChange={(v) => setNotifications((s) => ({ ...s, emailProvider: v }))}
              />
              <Field
                label="From Address"
                type="email"
                value={notifications.emailFromAddress}
                onChange={(v) => setNotifications((s) => ({ ...s, emailFromAddress: v }))}
              />
              <SaveButton saved={saved} />
            </form>
          </div>
        )}

        {tab === "Account" && (
          <div>
            <h3 className="font-display font-semibold text-ink-900">Change Password</h3>
            <p className="mt-1 text-sm text-ink-700/60">
              Updates the password for the seeded admin account.
            </p>
            <div className="mt-5">
              <PasswordForm />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
