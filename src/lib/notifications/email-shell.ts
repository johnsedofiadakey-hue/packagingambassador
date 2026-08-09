import { SITE_URL } from "@/lib/site";

/**
 * One branded HTML shell every transactional email renders inside — order confirmations,
 * status updates, and the owner-facing alerts (low stock, weekly summary). Header carries
 * the logo on the brand primary colour; the footer carries either the customer contact card
 * or a plain internal note, on the brand secondary colour. Callers only supply the middle
 * `bodyHtml`, so the look stays consistent no matter which email fires.
 *
 * Table-based, all-inline styles on purpose: email clients (Gmail, Outlook, Apple Mail) don't
 * support flexbox/grid or <style> reliably.
 */

export type EmailTheme = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
};

export type EmailContact = {
  storeName: string;
  storePhone?: string;
  storeEmail?: string;
  storeAddress?: string;
};

// Matches DEFAULT_THEME in src/lib/store.tsx — keep in sync.
export const DEFAULT_EMAIL_THEME: EmailTheme = {
  primaryColor: "#dd8f2e",
  secondaryColor: "#52702f",
  accentColor: "#e2791f",
  textColor: "#241f16",
  backgroundColor: "#fffbf4",
};

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Drop obviously-unset placeholder contact values so we never print "+233 XX XXX XXXX". */
function realValue(value?: string): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  // The seeded phone placeholder is "+233 XX XXX XXXX" — any run of X's marks it as unset.
  if (/xx/i.test(trimmed)) return null;
  return trimmed;
}

function customerFooter(theme: EmailTheme, contact: EmailContact): string {
  const storeName = esc(contact.storeName || "Packaging Ambassadors");
  const phone = realValue(contact.storePhone);
  const email = realValue(contact.storeEmail);
  const address = realValue(contact.storeAddress);

  const lines: string[] = [];
  if (phone) {
    const tel = phone.replace(/[^\d+]/g, "");
    lines.push(
      `<a href="tel:${esc(tel)}" style="color:#ffffff;text-decoration:none;">Call or WhatsApp: ${esc(phone)}</a>`
    );
  }
  if (email) {
    lines.push(`<a href="mailto:${esc(email)}" style="color:#ffffff;text-decoration:none;">${esc(email)}</a>`);
  }
  if (address) {
    lines.push(esc(address));
  }

  const contactRows = lines
    .map(
      (line) =>
        `<p style="margin:0 0 4px;font-size:13px;line-height:1.5;color:#ffffff;opacity:0.92;">${line}</p>`
    )
    .join("");

  return `
    <tr>
      <td style="background-color:${theme.secondaryColor};padding:22px 28px;">
        <p style="margin:0 0 10px;font-size:13px;font-weight:bold;color:#ffffff;">
          Questions about your order? We're here to help.
        </p>
        ${contactRows}
        <p style="margin:14px 0 0;font-size:12px;color:#ffffff;opacity:0.7;">
          ${storeName} — Ghana's Packaging Partner
        </p>
      </td>
    </tr>`;
}

function internalFooter(theme: EmailTheme, contact: EmailContact): string {
  const storeName = esc(contact.storeName || "Packaging Ambassadors");
  return `
    <tr>
      <td style="background-color:${theme.secondaryColor};padding:18px 28px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#ffffff;opacity:0.8;">
          ${storeName} — automated store notification
        </p>
      </td>
    </tr>`;
}

export function renderBrandedEmail(opts: {
  theme?: EmailTheme;
  contact: EmailContact;
  bodyHtml: string;
  footer?: "customer" | "internal";
  preheader?: string;
}): string {
  const theme = opts.theme ?? DEFAULT_EMAIL_THEME;
  const storeName = esc(opts.contact.storeName || "Packaging Ambassadors");
  const footer =
    opts.footer === "internal"
      ? internalFooter(theme, opts.contact)
      : customerFooter(theme, opts.contact);

  // A hidden preheader controls the grey preview line in the inbox list.
  const preheader = opts.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(opts.preheader)}</div>`
    : "";

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background-color:#f3e4cc;font-family:Arial,Helvetica,sans-serif;">
    ${preheader}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3e4cc;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="width:100%;max-width:520px;background-color:${theme.backgroundColor};border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background-color:${theme.primaryColor};padding:24px 28px;text-align:center;">
                <img src="${SITE_URL}/logo.png" alt="${storeName}" width="40" height="60" style="display:inline-block;vertical-align:middle;border:0;" />
                <span style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:18px;font-weight:bold;color:#ffffff;">
                  ${storeName}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                ${opts.bodyHtml}
              </td>
            </tr>
            ${footer}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
