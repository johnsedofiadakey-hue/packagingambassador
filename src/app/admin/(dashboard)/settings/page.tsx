"use client";

import { useState } from "react";
import { AlertTriangle, Check, ImageOff } from "lucide-react";
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof HeroSettings>(key: K, value: HeroSettings[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleImage = (file: File | undefined) => {
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => set("image", String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    set("image", "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      let image = values.image;
      if (imageFile) {
        const path = `hero/${crypto.randomUUID()}-${imageFile.name}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, imageFile);
        image = await getDownloadURL(storageRef);
      }
      const nextHero = { ...values, image };
      await onSave(nextHero);
      setValues(nextHero);
      setImageFile(null);
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
        Controls the homepage hero — the first thing visitors see. Leave the photo empty to use
        the illustrated fallback instead.
      </p>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
          Hero Photo
        </label>
        <div className="mt-2 flex items-center gap-4">
          {values.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={values.image} alt="Preview" className="h-20 w-28 rounded-xl object-cover" />
          ) : (
            <div className="flex h-20 w-28 items-center justify-center rounded-xl bg-sand-200 text-ink-700/40">
              <ImageOff className="h-6 w-6" />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImage(e.target.files?.[0])}
              className="text-xs text-ink-700/70 file:mr-3 file:rounded-full file:border-0 file:bg-amber-500 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
            />
            {values.image && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="self-start text-xs font-semibold text-ink-700/60 underline hover:text-red-600"
              >
                Remove photo
              </button>
            )}
          </div>
        </div>
        <p className="mt-1 text-xs text-ink-700/50">
          Uploads to Firebase Storage — falls back to the illustrated product collage when empty.
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

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Primary Button Label"
          value={values.ctaPrimaryLabel}
          onChange={(v) => set("ctaPrimaryLabel", v)}
        />
        <Field
          label="Primary Button Link"
          value={values.ctaPrimaryHref}
          onChange={(v) => set("ctaPrimaryHref", v)}
        />
        <Field
          label="Secondary Button Label"
          value={values.ctaSecondaryLabel}
          onChange={(v) => set("ctaSecondaryLabel", v)}
        />
        <Field
          label="Secondary Button Link"
          value={values.ctaSecondaryHref}
          onChange={(v) => set("ctaSecondaryHref", v)}
        />
        <Field label="Stat Value" value={values.statValue} onChange={(v) => set("statValue", v)} />
        <Field label="Stat Label" value={values.statLabel} onChange={(v) => set("statLabel", v)} />
      </div>

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
  });
  const [payment, setPayment] = useState({
    paystackPublicKey: settings.paystackPublicKey,
    paystackSecretKey: settings.paystackSecretKey,
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
              updateSettings(general);
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
              These keys are stored in this browser&apos;s local storage for prototype purposes.
              Before going live with a real Paystack account, move the secret key to a
              server-side environment variable — never ship a live secret key to the browser.
            </SecretWarning>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateSettings(payment);
                flashSaved();
              }}
              className="space-y-4"
            >
              <Field
                label="Paystack Public Key"
                placeholder="pk_test_..."
                value={payment.paystackPublicKey}
                onChange={(v) => setPayment((s) => ({ ...s, paystackPublicKey: v }))}
              />
              <Field
                label="Paystack Secret Key"
                type="password"
                placeholder="sk_test_..."
                value={payment.paystackSecretKey}
                onChange={(v) => setPayment((s) => ({ ...s, paystackSecretKey: v }))}
              />
              <SaveButton saved={saved} />
            </form>
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
