# Da Candy Shop Handoff Notes

## Admin Portal Deploy Reminder

Before committing or uploading admin portal changes to GitHub, rebuild the admin app and include the latest `admin/dist` files.

```bash
cd admin
npm run build
```

Then upload/commit the updated source files and the rebuilt `admin/dist` folder together so the live GitHub Pages admin portal matches the latest UI changes.

## Admin/API Compatibility Rule

Admin backend changes must remain compatible with the currently published bundle and with browser tabs that were opened before a deploy. Deploy backward-compatible Convex changes first, then publish the rebuilt admin bundle. Do not make an existing mutation field newly required until old inventory records and old admin payloads have been migrated or given a server-side fallback.

## Mix-and-Match Promotions

In **Promotions → Add Promotion**, choose **Mix & Match / Quantity Bundle**.
For two $20 items for $30, set **Items Per Bundle** to `2`, **Total Bundle Price** to `30`, and **Eligible Item Price** to `20`. Select the eligible products and enter the public headline and description.

Leave **Publish this promotion live** unchecked to save a draft, including a draft with no products selected yet. Publishing shows the banner, visitor pop-up, product badges, and automatic checkout discount. Only one promotion can be live at a time.

Bundles can contain the same design or different selected designs. Every complete group qualifies: two $20 items cost $30, three cost $50, and four cost $60. Extra items remain at regular price. The optional eligible-price filter applies to the selected size's current regular price; leaving it blank includes all prices and sizes of the selected products. When eligible prices differ, the highest-priced items form bundles first, and cheaper groups are never increased to the bundle price.

Existing percent and per-item dollar discounts remain supported. Bundle discounts cannot stack with other rewards or discount codes. Refresh an older admin tab before editing a bundle promotion.

Run `npm test` for pricing, server validation, and ordering-hours checks. The server and storefront share `promotion-pricing.js` to keep totals consistent.
