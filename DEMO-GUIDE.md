# LIFE: solution walkthrough and complete demo

## How it works, step by step

1. **Start with a real application shell.** Next.js serves the React storefront, approved photographs, two brand presets and a catalog of 15 fictional products. Browsing, sorting, product details and shopping work without Claude. Presets change identity, imagery, copy, visual tokens and model voice; they are not isolated production tenants.
2. **Capture the visitor's direction.** The visitor types an occasion or style request and can set explicit preferences, save products, add pieces to the bag or attach a consented photo. A typed wish is not automatically converted into a saved preference.
3. **Assemble session context.** The browser sends the prompt, brand, preferences, saved/bag product IDs, optional locks/replacements and up to four ancestors of the active journey branch to `/api/experience`. Abandoned branches are not all sent. A photo is resized/re-encoded before submission.
4. **Validate the request on the server.** Same-origin, body-size, schema, product-ID, rate and concurrency checks run before model work. Credentials remain server-side. Rate/concurrency limits are process-local, not distributed per-user protection.
5. **Choose the model.** Auto uses the quality model for first requests, photos and explicit shopping constraints. Eligible short text follow-ups with history can use the fast model. Settings offer Auto/Fast/Quality, but photos always use Quality. Claude, not keyword rules, composes every personalized selection.
6. **Ask Claude for structured data, not code.** The server provides catalog facts, brand instructions, recent context and eligibility/budget hints. A forced strict tool returns three bounded section slots: an editorial/look/comparison opening, a product selection and a question/look/comparison follow-up. Locked-piece requests require a look. The model cannot invent frontend components, real products or authoritative prices.
7. **Validate before showing anything.** The server normalizes slots into sections and checks schemas, catalog IDs, duplicates, section/selection consistency, material exclusions, per-product and look budgets, replacements and locks. All locks must appear together in a look. One invalid response can receive one quality-model repair, for at most two calls. Failure preserves the current edit; there is no fake personalized fallback. Free-text style relevance still needs evaluation.
8. **Stream honest progress.** NDJSON carries connection, actual model-output and validation progress, followed by one complete validated result or error. The photographic interlude can be minimized/reopened without another request. Cancellation aborts provider work. Unvalidated partial products are never displayed; native A2UI sections are not progressively streamed.
9. **Render through official A2UI.** A deterministic adapter translates the composition into A2UI v0.9 messages. The official `MessageProcessor` and `A2uiSurface` render approved editorial, question, product-selection, look and comparison components. SDK actions open local shopping controls or request another Claude edit. This is constrained generative UI, not arbitrary AI-generated websites.
10. **Keep commerce deterministic.** Sizes, quantities, saves, bag changes and totals are ordinary application logic. The look editor can lock pieces, replace others and atomically add selected, sized products. Claude receives shopping context but cannot buy anything or mutate the bag.
11. **Remember only this browser tab.** `sessionStorage` holds up to eight edits, branch relationships, preferences, saved IDs, brand and bag. Revisiting an edit makes it the parent of the next request without deleting later edits. No account, durable profile or returning-visitor memory exists. Photos remain in React memory, not persisted history; submitted images are still subject to provider data policies.
12. **Simulate checkout.** `/api/checkout` revalidates product/size/quantity and computes authoritative prices and delivery. A `DEMO-...` confirmation is returned. There is no payment, stock reservation, email, shipment or durable order.

### Main code paths

- `src/components/storefront.tsx`: session, streaming, preferences, history and commerce dialogs.
- `src/app/api/experience/route.ts`: Claude routing, composition, repair and progress/result streaming.
- `src/lib/commerce.ts`: catalog, brand packages, schemas, constraints and order calculations.
- `src/lib/discovery.ts` and `src/components/discovery-surface.tsx`: approved A2UI catalog, adapter, renderer and actions.
- `src/components/look-editor.tsx` and `src/components/inspiration-input.tsx`: outfit changes and consented image preparation.
- `src/app/api/checkout/route.ts`: server-authoritative simulated checkout.

## Complete browser journey

The quoted commands below are prompts to enter in the website, not shell commands. Use the same tab throughout. Generated titles, choices and layouts vary; submit one request at a time. AI actions incur provider charges and the sample catalog is deliberately small.

### 1. Start clean and set preferences

Open brand settings, choose **Reset this session** if this is a shared demo, select **LIFE**, and leave response mode on **Auto**. Confirm that the engine says Configured or Live, then close settings.

Open **Your direction**. Set occasion to `A three-day work trip to London`, fit to `Relaxed`, palette to `Blue, white and grey`, and outfit budget to `450`. Leave exclusions off for this first run. Choose **Keep preferences** to avoid generating an extra edit. Budgets are USD before delivery.

### 2. Generate the first immersive edit

> Build a complete men's smart-casual look for my three-day London work trip. I have informal meetings and will walk a lot. Include a shirt, trousers and comfortable footwear from this catalog. Keep the whole look under my $450 budget and explain why the pieces work together.

During generation, choose **Keep browsing**, then the sparkle control to reopen the same scene. Inspect the final shoppable sections. If the result has no complete-look section, request `Show these choices together as one complete shoppable look within my budget.`

### 3. Replace one piece while retaining the others

Choose **Make this look yours**. Keep the shirt and trousers checked under **Keep in next look**, then choose **Find an alternative** on the footwear row. The next look must retain the locked product IDs and replace the requested piece. If constraints leave no valid combination, loosen them rather than claim an invented replacement.

### 4. Explore products and shortlist-aware discovery

Open a product, inspect **Materials & care**, and choose **Save for later**. Choose **Compare alternatives** to request a catalog-grounded comparison. Close the product dialog if it remains open after generation. Open the heart/shortlist control and choose **Build around my shortlist**. Saved products provide context; they have not been purchased.

### 5. Compare history and branch

Open **Your journey** and select **Compare** on two edits. Choose **Revisit & branch** on the first edit, then enter:

> Take this earlier direction somewhere more relaxed for an evening meal after work. Keep it suitable for men and within my saved budget. Show one complete look and explain what changed.

Reopen the journey to see the branch. Later edits remain available. History holds eight edits, so a long demo eventually drops older entries.

### 6. Complete a look around the bag

Open a preferred product, select an offered size and **Add to bag**. Open the bag and choose **Complete my look**. The resulting edit can distinguish existing choices from missing additions. Open **Make this look yours**: pieces already in the bag are marked and deselected by default. Choose sizes for additions and **Add selected pieces**. Review quantities before checkout.

### 7. Try photo inspiration

Open the inspiration-photo control. Select the consent checkbox, choose a JPEG/PNG/WebP clothing reference you have permission to share, and choose **Use this reference**. Avoid personal information and faces. Enter:

> Use this reference for its clothing colors and relaxed silhouette, not the person's identity. Adapt the idea into a men's look from this catalog within my saved budget. Explain the closest matches and where the catalog cannot match the reference.

This is style inspiration, not exact matching or virtual try-on. Success clears the attachment; cancellation/failure preserves it for retry. The photo does not alter items already in the bag.

### 8. Finish the simulated purchase

Open the bag, review sizes and quantities, and proceed to checkout. Review the fixed fictional delivery details, acknowledge that this is a demo, and place the demo order. The confirmation shows a `DEMO-...` reference and computed total. Nothing is charged or shipped; no real contact details are needed.

### 9. Show white-label reuse

Select **STUDIO / 02** in brand settings. This clears AI edits/history, not the shared-catalog bag and shortlist. For an independent second-person demo use **Reset this session**, then select STUDIO again and set new preferences. Enter:

> Create a women's evening look for a gallery opening. I prefer an understated dark palette with one interesting texture. Use only this catalog, keep the full look under $400, and show a complete shoppable outfit.

Identity and editorial voice change while renderer and commerce are reused. Upload-based brand onboarding, tenant isolation and returning-visitor memory are not implemented.

### Optional behavior checks

- Start a request and cancel: the prior edit, bag and shortlist should remain.
- Refresh the same tab: the session returns, but a photo attachment does not.
- Exclude a material through **Your direction** and apply: the server rejects an edit containing it. Avoid impossible combinations unless intentionally demonstrating failure.
- Inspect settings after a request for model, latency, attempts, token and cache statistics. Cache hits or faster responses are not guaranteed.

## Local developer commands

```sh
npm ci
npm test
npm run typecheck
npm run dev -- --port 3100
```

Open http://127.0.0.1:3100. Credentials belong only in server configuration, never browser inputs or `NEXT_PUBLIC_*` variables.

## Netlify: use the separate account

Deployment is paused until the separate Netlify account is selected. No site has been created or published and no credentials have been uploaded as part of this deployment work. The currently authenticated account must not be used.

Run the following yourself and choose the intended account in the browser login flow. Logging out changes this machine's CLI session, not existing hosted sites. Do not send passwords, tokens or API keys through chat.

```sh
npm exec --yes --package=netlify-cli -- netlify logout
npm exec --yes --package=netlify-cli -- netlify login
npm exec --yes --package=netlify-cli -- netlify status
```

After confirming the correct account, create a dedicated LIFE site through `netlify sites:create` and choose the intended team. Configure `ANTHROPIC_API_KEY` in that site's server-side environment. Optional `ANTHROPIC_MODEL` and `ANTHROPIC_FAST_MODEL` select the provider models. Do not commit credentials or request JSON environment output, which can expose values. Redeploy after environment changes.

`netlify.toml` selects Node 24, `npm run build` and `.next`. Netlify's automatic OpenNext adapter packages the dynamic routes; this is not a static export. Its version is intentionally not pinned. Generated `.netlify` files are ignored. An offline adapter build has passed, but that does not verify hosted model access.

Once the correct site is linked and its environment configured:

```sh
npm test
npm run typecheck
npm exec --yes --package=netlify-cli -- netlify build
npm exec --yes --package=netlify-cli -- netlify deploy --prod --no-build
```

Verify the hosted page, configuration endpoint, a real composed edit and simulated checkout before sharing. This remains a demo, not production commerce: the documented A2UI legacy-Zod advisory, distributed abuse/cost controls, access protection, privacy terms and media/font rights still require review. Internet-accessible AI endpoints can incur charges; restrict access and configure provider spending limits.
