# LIFE: solution walkthrough and complete demo

Live demo: https://life-demo.netlify.app

Start with the [presenter script](#presenter-script) for a complete client walkthrough. The [architecture explanation](#how-it-works-step-by-step) and [deployment instructions](#netlify-live-demo) are included for technical discussions.

## How it works, step by step

1. **Start with a real application shell.** Next.js serves the React storefront, approved photographs, two brand presets and a catalog of 15 fictional products. Browsing, sorting, product details and shopping work without Claude. Presets change identity, imagery, copy, visual tokens and model voice; they are not isolated production tenants.
2. **Capture the visitor's direction.** The visitor types an occasion or style request and can set explicit preferences, save products, add pieces to the bag or attach a consented photo. A typed wish is not automatically converted into a saved preference.
3. **Assemble session context.** The browser sends the prompt, brand, preferences, saved/bag product IDs, optional locks/replacements and up to four ancestors of the active journey branch to `/api/experience`. Abandoned branches are not all sent. A photo is resized/re-encoded before submission.
4. **Validate and authorize the request on the server.** Production requires private-demo credentials before storefront/API access. Same-origin, body-size, schema and product-ID checks precede an atomic site-wide usage reservation in Netlify Blobs. Shared daily/minute/concurrency limits survive cold starts and deploys; unavailable usage protection refuses paid work. Credentials remain server-side. This is shared demo access, not individual user identity or per-tenant protection.
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

## Presenter script

### Before the audience joins

- Open https://life-demo.netlify.app in one browser tab. Use that tab throughout the journey.
- The site is private: use username `demo` (unless changed) and the access password configured as `DEMO_PASSWORD` in Netlify. The owner can view/change this server variable; never use or share the Anthropic API key as an access password. Rebuild/redeploy after changes. Keep credentials out of screenshots and client recordings.
- Open brand settings, choose **Reset this session**, select **LIFE**, and leave response mode on **Auto**. Reset deliberately clears this tab's saved shopping state; do not do it halfway through a demonstration.
- Confirm the composition engine says **Configured** or **Live**, then close settings. Configuration alone does not prove provider access: try one real request before a client session, then reset if you want to start clean.
- Have a clothing-only JPEG, PNG or WebP reference ready, with permission to send it to Anthropic. Avoid faces and personal information. Source limits are 10 MB and 24 megapixels; the browser prepares a smaller attachment.
- The fenced `text` blocks below are copyable website prompts, not terminal commands. Submit one at a time and wait for completion. Generated wording, section choices and products vary.
- AI submissions and AI action buttons incur provider charges. Product browsing, saves, bag changes, history comparison and checkout do not call Claude.
- This is a demo with 15 fictional products, illustrative photos and USD prices. Do not promise live inventory, actual delivery or production security approval.

### 1. Introduce the ordinary storefront

**Say:** "We start with a usable shop, not an empty chat screen. The visitor can browse normally or ask for an experience built around their plans."

**Do:** Show the landing photography, scroll through the collection, try a category filter and sorting, then open a product. Inspect its price, color, offered sizes and **Materials & care**. Close it without buying.

**Check:** Standard commerce works without a model request. The product image is illustrative; it is not evidence of exact manufactured-product appearance.

### 2. Establish explicit preferences

**Say:** "The visitor can give us preferences directly rather than rely on the AI to guess."

**Do:** Open **Your direction** and set:

- Occasion: `A three-day work trip to London`
- Fit: `Relaxed`
- Palette: `Blue, white and grey`
- Outfit budget: `450`
- Material exclusions: leave all unchecked for this first run.

Choose **Keep preferences**, not **Apply to my edit**, so the first composition happens in the next step. The budget is USD before delivery.

**Check:** The preferences remain visible in the collection's preference strip. A typed budget in a prompt is not automatically saved into this form; the explicit saved budget is what the deterministic validator enforces on every subsequent request.

### 3. Compose the first personalized journey

**Say:** "Instead of asking the visitor to navigate our categories, we start from their real situation."

**Paste and submit:**

```text
Build a complete men's smart-casual look for my three-day London work trip. I have informal meetings and will walk a lot. Include a shirt, trousers and comfortable footwear from this catalog. Keep the whole outfit under my saved $450 budget. Show one complete shoppable look and explain why the pieces work together.
```

**Do:** While the photographic composing scene is visible, choose **Keep browsing**. Use the sparkle control to reopen the same scene. Wait for the result, then scroll through its sections.

**Check:** The experience contains catalog-grounded product choices and styling context rather than only a chat answer. Inspect the complete-look subtotal: it must not exceed the explicit $450 budget. The entire set of displayed alternatives is not necessarily one outfit; inspect the actual look section's total.

**Say:** "Claude composes the recommendations and section data. Our approved components render it, and application code verifies the catalog and shopping constraints before it appears."

**If needed:** If there is no look section, submit:

```text
Show one complete shoppable look using a shirt, trousers and footwear from these choices. Keep its combined total within my saved budget and explain the combination.
```

If the composer changes into suggested follow-up buttons while scrolling, use the message icon to write another request. Try a generated suggestion in a separate run if desired; suggestions generate another real edit and are not required for this scripted path.

### 4. Retain the favorites and replace one piece

**Say:** "Personalization should be editable. I can keep what I like and change only what I do not."

**Do:** Choose **Make this look yours**. Leave **Keep in next look** checked on the shirt and trousers. On the footwear row, choose **Find an alternative**. Wait for a new edit.

**Check:** The new complete look retains the exact locked product IDs and excludes the footwear requested for replacement. Check the names, not merely whether the photographs look similar. Its total must still fit the saved budget. The bag has not changed.

**Optional extension:** In a later look, uncheck **Keep in next look** on the pieces you want changed and choose **Rework unlocked pieces**. This sends another model request. Do not confuse the inclusion checkbox for purchasing with the lock checkbox for future styling.

**If needed:** If the remaining catalog cannot satisfy all locks, replacements and budget, revisit an earlier edit and choose a different piece to replace or deliberately raise the budget. Do not describe a failed request as an invented alternative.

### 5. Compare edits and branch from an earlier direction

**Say:** "The visitor can explore without losing the previous direction. This is a journey, not a series of destructive searches."

**Do:** Open **Your journey** using the history icon. Select **Compare** on the first two edits and inspect them side by side. Choose **Revisit & branch** on the first edit.

**Paste and submit:**

```text
Take this earlier direction somewhere more relaxed for an evening meal after work. Keep it suitable for men and within my saved budget. Show one complete look and explain what changed.
```

**Check:** Reopen **Your journey**. The new edit branches from the revisited edit; the other edit remains available. History holds eight edits, so demonstrate comparison now, before extra requests can evict the earliest edit.

### 6. Demonstrate the contextual product dock

**Say:** "The visitor can move from inspiration into product detail without leaving the shopping journey."

**Do:** Open a product. Use **Materials** in the dock, inspect the material facts and offered sizes, then choose **Compare alternatives**. Close the product dialog if it remains open after generation so you can inspect the new edit.

**Check:** The comparison refers to actual catalog products and their facts. Do not claim that a subjective comfort or fit recommendation is a measured fit guarantee.

**Alternative typed prompt:** Use this instead of the comparison action if you want a repeatable named comparison, not in addition to it:

```text
Compare Blue Oxford and Relaxed Poplin for my London trip. Explain their material, price and styling differences using catalog facts, then recommend one within my preferences.
```

**Optional extension:** **How to style** requests a complete look with the opened product locked as an anchor. It is another model request.

### 7. Build around the shortlist

**Say:** "What the visitor saves becomes useful context for the next recommendation. Saving is not purchasing."

**Do:** Open one or two relevant products and choose **Save for later**. Close product details, open the heart/shortlist control and choose **Build around my shortlist**.

**Check:** The resulting edit can reference relevant saved anchors and complementary additions. Saving alone does not modify the bag or force every saved item into one outfit.

### 8. Enforce an explicit material preference

**Say:** "A preference such as excluding wool is a server-checked constraint, not just reassuring AI copy."

**Do:** Open **Your direction**, check **wool** under excluded materials, keep the $450 budget and choose **Apply to my edit**. This button sends a new request.

**Check:** None of the selected products contains wool in the catalog material description. The application rejects excluded materials and over-budget looks rather than displaying them as compliant. Occasion, palette and fit still require semantic evaluation; do not present them as equally strict mechanical guarantees.

**If needed:** Avoid selecting every exclusion while locking expensive pieces under a tiny budget. The small catalog may have no valid combination; failure is not proof that the AI ignored the preference.

### 9. Complete a look around an actual bag item

**Say:** "Recommendations can account for what the visitor has actually chosen, not just what they have viewed."

**Do:** Open one preferred shirt or trouser product, choose an offered size and **Add to bag**. Open the bag and choose **Complete my look**. Wait for the new edit.

**Check:** Inspect how the edit distinguishes already chosen pieces from missing additions. Open **Make this look yours** on a resulting look. Products already in the bag are marked and deselected for purchase by default. Select sizes for the additions and choose **Add selected pieces**. Review the bag for accidental duplicates and quantities.

**Say:** "Claude proposes the combination. Only an explicit visitor action changes the bag, and sizes and totals stay under application control."

### 10. Finish the simulated purchase

**Say:** "The personalized journey leads into a conventional, predictable checkout. This demonstration does not process a real transaction."

**Do:** Open the bag, review sizes, quantities, subtotal and delivery, and proceed to checkout. Review the fixed fictional delivery details, acknowledge the demo and place the demo order.

**Check:** The confirmation shows a `DEMO-...` reference and the server-computed total. No real contact details, card or payment are needed. Nothing is charged, emailed, reserved or shipped, and no durable order is created.

The saved outfit budget excludes delivery and does not impose a cart-wide cap across arbitrary quantities or unrelated purchases. Checkout validates the actual bag independently.

### 11. Extend the journey with photo inspiration

**Say:** "The visitor can also start from clothing inspiration instead of finding the right words."

**Do:** Open the photo control, read the disclosure, select the consent checkbox and choose the prepared clothing reference. Choose **Use this reference**.

**Paste and submit:**

```text
Use this reference for its clothing colors and relaxed silhouette, not the person's identity. Adapt the idea into a men's look from this catalog within my saved budget and material preferences. Explain the closest matches and where the catalog cannot match the reference.
```

**Check:** The response should explain catalog matches and limitations. This is not exact visual matching, person identification or virtual try-on. Success clears the attachment; failure/cancellation preserves it for retry. The application does not persist the photo in history or session storage. Submitted photos remain subject to Anthropic's data policies; do not promise provider zero retention.

**If needed:** If no suitable authorized photo is available, skip this extension. Do not upload client-confidential material just to complete the script.

### 12. Show white-label reuse with a second visitor story

**Say:** "The same experience engine can support another configured brand without rewriting the shopping components."

**Do:** Open brand settings and select **STUDIO / 02**. Point out the identity change. A brand switch clears AI edits/history but not the shared-catalog bag, shortlist or preferences. For a clean second-person story, choose **Reset this session**, then select STUDIO again. Open **Your direction**, set budget to `400`, fit to `Any` and palette to `Dark, understated`, then choose **Keep preferences**.

**Paste and submit:**

```text
Create a women's evening look for a gallery opening. I prefer an understated dark palette with one interesting texture. Use only this catalog, keep the complete outfit under my saved $400 budget, and show a complete shoppable look with a short explanation.
```

**Check:** The brand identity, copy and voice differ while the approved renderer and shopping system are reused. Both presets deliberately share the same sample catalog and USD prices. They are configured brand packages, not proof of isolated SaaS tenancy or upload-based onboarding.

### 13. Explain the AI engine when asked

**Say:** "The API key is server-side. Claude composes approved data, not executable frontend code. We validate the result and render it through official A2UI components."

**Do:** Open settings after a successful request and inspect the model, response duration, first output, attempts, tokens and cache statistics.

**Check:** Auto/Fast/Quality select operational routing, not different rule-based recommenders. Auto retains the quality model for first requests, explicit constraints and photos. Eligible simple follow-ups can use the fast model; photos always use Quality. Cache hits and faster responses are not guaranteed. Do not compare two timings as a performance benchmark.

To change the hosted key, use Netlify **Project configuration > Environment variables > ANTHROPIC_API_KEY**, ensure its scope includes Functions and its context includes Production, then rebuild/redeploy. Never enter or display the key during a client presentation.

### 14. Close with the correct boundaries

**Say:** "This demonstrates within-session personalized discovery, editable looks, contextual shopping and white-label presentation. A production rollout would add tenant isolation, durable profiles, real catalog and inventory integrations, payments, access and cost controls, evaluations and appropriate privacy terms."

**Check:** Do not imply that returning-user memory, brand uploads, real inventory, real payments or exact commercial-font matching are implemented. The current dependency/security caveats remain in the README. Do not describe the public demo as production-approved.

## Recovery script

### If an edit fails

**Say:** "This request did not produce an accepted result. The application has preserved the previous collection and shopping choices rather than display an invalid edit."

**Do:** Do not reset the session or repeatedly click submit. Retry the same prompt once after the request finishes. If it fails again, continue showing the existing edit and standard shopping controls, or stop the AI portion of the demo.

The reported first-request prompt succeeded when retried by the user after three successful live checks. Its original failure was not diagnosed; do not claim a permanent fix or assume every generic failure is a schema problem. That message can also represent provider/network failures.

For diagnosis, record the time, prompt, response mode and relevant preferences, then inspect browser **Developer Tools > Network > /api/experience > Response** for the final error event and `meta.attemptDetails`. Avoid sharing secrets or sensitive request contents. Browser settings currently show successful-call diagnostics, not the full metadata for a failed request.

### If the request is taking longer than expected

Choose **Keep browsing** while it completes. The sparkle control reopens the same request; do not submit duplicates. The stages reflect real server events, not a timed animation or guaranteed finish time. A repair can add another model call within the two-call limit.

### If you want to demonstrate cancellation

Start a request, then choose **Cancel edit** in the composing scene or the compact cancel control after minimizing. Check that the prior edit, bag and saved pieces remain. Cancellation stops further work where possible but is not a guarantee of zero provider cost for work already started.

### If refresh or branding appears to lose context

Refresh in the same tab to restore persisted session state; photo attachments are intentionally not restored. Do not promise memory in a new tab, after session expiry or after **Reset this session**. Brand switching deliberately clears AI history. Re-establish preferences explicitly for a different visitor.

## Short presentation path

For a focused presentation, use steps 1-5, then 9-10 and 12. Add product comparisons, shortlist, exclusions, photo inspiration and engine diagnostics when relevant. The full script is exploratory, not a guarantee of fixed wording, a fixed number of products or a fixed run time.

## Local developer commands

```sh
npm ci
npm test
npm run typecheck
npm run dev -- --port 3100
```

Open http://127.0.0.1:3100. Credentials belong only in server configuration, never browser inputs or `NEXT_PUBLIC_*` variables.

## Netlify: live demo

Live URL: https://life-demo.netlify.app

Published on 2026-11-12 under Abhishek Sett's separate `abhisheksett` team, not Bikkhonn. The local folder is linked to `life-demo` (renamed from `adaptive-commerce-demo`). Server environment configuration was imported directly without displaying secret values. Never send passwords, tokens or API keys through chat.

Check the account and project before republishing:

```sh
npm exec --yes --package=netlify-cli -- netlify status
```

Use the existing project rather than creating another. `ANTHROPIC_API_KEY` is configured in the hosted environment; optional `ANTHROPIC_MODEL` and `ANTHROPIC_FAST_MODEL` select the models. Do not commit credentials or request JSON environment output, which can expose values. Redeploy after environment changes.

`netlify.toml` selects Node 24, `npm run build` and `.next`. Netlify's automatic OpenNext adapter packages the dynamic routes and transforms the static output; this is not a static export. Its version is intentionally not pinned. Generated `.netlify` files are ignored.

Build and publish in one invocation so the adapter's transformed static assets and functions are deployed together. A separate `netlify build` followed by `netlify deploy --no-build` deployed the raw `.next` directory and caused image 404s in this project; do not use that sequence.

```sh
npm test
npm run typecheck
npm exec --yes --package=netlify-cli -- netlify deploy --prod --context production --site b4e21cec-c13c-4411-a76a-1fde5910e851
```

Use the permanent project ID in this command: after the rename, passing the `life-demo` slug caused the CLI build to fail its project lookup. The project ID remains stable across renames.

Protection verification passed: 40 tests, typecheck, and production adapter build. Live anonymous and forged requests returned 401; authorized page/assets/configuration, real streamed Sonnet generation and simulated checkout succeeded. Synthetic daily-cap and two-in-flight states returned 429 and the original usage count was restored. Unit tests cover minute throttling, cross-instance contention, UTC rollover, abandoned leases, kill-switch and unavailable/corrupt quota storage. The live minute-boundary test was skipped near rollover rather than risk a paid call; minute throttling is covered by deterministic unit tests. Both old unprotected deployments were deleted and their original/renamed URLs returned 404.

An authenticated browser edit completed in approximately 9.2 seconds on one attempt; this is a sample, not a latency guarantee. A2UI rendered at 1440px, 390px and 320px with no broken images, horizontal overflow or page errors. Nine loaded frontend bundles contained neither the access password nor an Anthropic-key pattern; credentials were never printed during testing.

### Owner access and controls

- Open https://app.netlify.com/projects/life-demo and go to **Project configuration > Environment variables**.
- The login username is `demo` unless `DEMO_USERNAME` is changed. View the generated `DEMO_PASSWORD` there, or replace it with a strong random password of at least 24 characters. Keep it private; it is not the Anthropic API key. Apply it in all contexts/scopes so proxy and server functions receive the same value, and rebuild/redeploy after changes.
- Defaults: `DEMO_DAILY_LIMIT=40` generations across the whole site per UTC day, `DEMO_PER_MINUTE_LIMIT=4`, and two simultaneous generations. A generation includes its possible repair; failed/cancelled generations still count. These are aggregate site limits, not per visitor or exact dollar caps.
- Set `DEMO_AI_ENABLED=false` and redeploy to stop paid edits without disabling authenticated browsing or simulated checkout.
- Configure an Anthropic project spending limit separately as a billing backstop. Shared-password access can still consume the allowance; rotate the password to revoke access.
- The password and quota settings are server configuration, not browser controls. Do not copy them into the source or a client-facing presentation.

This was a CLI deployment. Automatic builds on Git pushes are not connected: link the existing Git repository through this project's Netlify repository/continuous-deployment settings to enable them. Do not create a duplicate project just to connect Git.

This remains a demo, not production commerce. Private access and atomic shared usage limits now protect paid requests; see the README's Private Demo Protection section for limits and the AI kill switch. Old unprotected deployments must be removed so their immutable URLs cannot bypass the new code. The A2UI legacy-Zod advisory, production identity/tenant controls, privacy terms and media/font rights still require review. Configure provider spending limits as a billing backstop; request quotas are not an exact dollar cap.
