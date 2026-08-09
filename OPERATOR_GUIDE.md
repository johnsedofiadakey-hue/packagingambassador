# Packaging Ambassadors — Operator Guide

A plain-English guide for running the store day to day. No coding needed. For the technical/
architecture details, see `HANDOFF.md`.

**Live site:** https://packaging-ambassadors--packagingambassador.us-central1.hosted.app
(a custom domain, `packagingambassadors.com`, is being set up — see the end).

---

## 1. Signing in

- **Staff console:** go to **/admin/login** and sign in with your email + password.
- After login you land on the **Sell (POS)** screen (or the Dashboard if you don't have POS access).
- On a phone: open the site, use the browser's **"Add to Home Screen"** — it installs like an app,
  opens full-screen, and you navigate with the **bottom dock** (and a "More" button for the rest).
- Forgot/rotate your password: **Settings → Account** (once signed in).

---

## 2. Selling — Point of Sale (POS)

The home screen for staff. To make a sale:
1. Choose **Retail** or **Wholesale** (top toggle).
2. **Tap products** to add them — each tap adds one; a badge shows how many are in the sale.
3. Open the cart (the cart button on mobile, or the side panel on desktop). Adjust quantities with
   **– / +**, or remove with the trash icon.
4. (Optional) enter the customer's name/phone.
5. Pick the payment method: **Cash / MoMo / Card**.
6. Tap **Complete Sale**. On the confirmation you can **Print Receipt** (opens a printable page) or
   start a **New Sale**.

Stock is deducted automatically and the sale shows up under **Orders** and **Sales Records**.

---

## 3. Products

**Products** (add / edit / delete the catalogue):
- **Add Product** — only *Name, Category, Price, Stock* are required. Everything else (photo,
  description, sale price, wholesale price, sizes, colours) is optional and tucked into the
  "Pricing & wholesale" and "Variants & details" sections.
- **Per-size pricing:** under *Variants & details → Sizes & prices*, give each size its own price
  (e.g. Small 5, Medium 8). Leave a size's price blank to use the main price. The storefront updates
  the price live when a customer picks a size.
- **Wholesale:** set a *Wholesale Price* to make a product appear in the wholesale storefront; leave
  it blank and it's retail-only.
- **Sale price:** set *Compare-at Price* higher than the price to show a struck-through "sale".
- **Delete:** the trash icon on a product row.
- **Bulk import:** the CSV import button (download the template first).

**Categories** — add/rename/reorder; you can't delete a category that still has products.

---

## 4. Orders & fulfilment

**Orders** shows retail + wholesale orders together.
- Change an order's **status** with the dropdown (Pending → Processing → Delivered, or Cancelled).
- The **#N** badge is the fulfilment queue position (oldest unfulfilled first).
- A red **"Stock review"** badge means the order was for more than was in stock — fulfil and
  reconcile manually.
- **Delete** an order with the trash icon (asks to confirm).
- Wholesale orders can print an **Invoice** and **Waybill** (links on the order-tracking page).

**Customers can track their own order** at **/track** with just the order number — it live-updates as
you change the status.

---

## 5. Inventory / stock

**Inventory** — live stock levels with **Low** / **Out** flags.
- Quick restock: **+50 / +100**, or type a number and tap **Set**.
- The store emails you when a product drops to/below the **Low Stock Threshold** (Settings → General).
- On a phone the list is stacked cards; on desktop it's a table.

---

## 6. Staff & who-can-see-what

**Staff** (Admins only):
- **Add Staff Member** — creates their real login. Give them a temporary password to share.
- **Role** sets a starting point; then **tick exactly which pages** they can open (POS, Orders,
  Products, Inventory, etc.). Untick a page and they can't reach it at all.
- **Admins** always see everything. **Staff & Settings** are always admin-only.
- Deactivate someone by unticking **Active** (reversible; keeps their history).

---

## 7. Settings — where things live

- **General** — store name/phone/email/address, low-stock threshold, **pause checkout**, **close the
  whole site** (maintenance), wholesale minimum order.
- **Hero & Homepage** — the homepage headline, and the **background video/slides**.
- **Page Content** — About-page copy, the "Why Us" cards, footer tagline.
- **Colors & Branding** — the 5 brand colours (recolors the whole site live).
- **Promotion** — the slim announcement banner.
- **Sale** — a bold sitewide sale banner with a countdown.
- **Payment / Notifications** — informational; the actual keys live in secure server config, not here.
- **Account** — change your password.

---

## 8. Money tools (Admins)

- **Analytics** — revenue, orders, best-sellers, per-channel split; plus **"Email weekly summary now"**.
- **Reconciliation** — cross-checks Paystack's successful charges against your orders and can rebuild
  any order that was paid but didn't save. Run it if a customer says they paid but you can't find the order.
- **Activity Log** — a record of staff actions.

---

## 9. Things to finish (owner setup)

1. **Set your brand colour back to amber.** Settings → Colors & Branding → set **Primary** to
   `#dd8f2e` (or "Reset to Default") → Save. (It's currently near-black, which makes buttons look dark.)
2. **Set prices** on any product showing **GH₵ 0**.
3. **Payments:** the store runs on Paystack **test** keys. Switch to your **live** keys before taking
   real money (a developer sets these in server config).
4. **Custom domain + email:** finish the `packagingambassadors.com` DNS setup and Brevo sender
   verification (your developer has the record values).

---

*Questions about how something is built? See `HANDOFF.md`. It's kept current for the next developer.*
