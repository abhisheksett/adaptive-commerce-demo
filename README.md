# LIFE - Adaptive Commerce

A white-label apparel demonstrator: Claude-composed discovery journeys, visual style choices, editable complete looks, photo inspiration, saved/bag-aware recommendations, visual history, and simulated checkout. A horizontal black/dark-blue/black night sky, layered stars and scroll-linked photography connect the editorial sections. No Lilly-specific functionality.

See [the solution walkthrough and complete demo journey](DEMO-GUIDE.md) for a step-by-step explanation, copyable browser prompts, shopping actions and deployment instructions for a separate Netlify account.

## Run

Requires Node.js 22.18+ and npm.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:3000 (the current development session uses port 3100). Personal edits require a configured Anthropic API key. There is no rule-based composer or synthetic fallback; the initial catalog and ordinary shopping interactions work independently of the model.

For live composition, create `.env.local` using `.env.example` and enter your Anthropic API key directly into that local file. Restart the server. Never put secrets in `NEXT_PUBLIC_*` variables, a browser form, or source control. `ANTHROPIC_MODEL` defaults to `claude-sonnet-4-6`; `ANTHROPIC_FAST_MODEL` defaults to `claude-haiku-4-5-20251001`, subject to your account access. Set both to the same model to disable model differentiation without changing the UI.

```sh
npm test
npm run typecheck
npm run build
```

## Architecture

- `src/lib/commerce.ts`: 15 fictional products, brand packages, bounded discovery-section schemas, catalog validation, deterministic totals. Includes three shirt options, an evening-top alternative, and complementary tailoring/accessories.
- `src/lib/discovery.ts`: shared branded A2UI component APIs and a deterministic adapter from validated Claude compositions to native `createSurface`/`updateComponents` messages.
- `src/app/api/experience/route.ts`: server-only Claude request with a forced strict composition tool. Three required tool slots guarantee an editorial/look/comparison opening, a shoppable product selection, and a question/look/comparison follow-up; locked-piece requests require the follow-up to be a look. Tool slots are adapted to the unchanged public section array and A2UI messages. Known product IDs are schema enums; local validation additionally enforces length/count limits and shopping constraints. One invalid composition gets one quality-model repair attempt; no synthetic fallback. Missing keys return 503. JSON clients get provider/unrepaired validation failures as 502; clients requesting `application/x-ndjson` get progress events and exactly one validated result or error event after the stream opens. Success includes model, total latency, token/cache usage, per-attempt diagnostics and first-output timing, never credentials.
- `src/components/discovery-surface.tsx`: official A2UI React surface with a registered branded catalog. SDK actions route visual choices and "style this piece" requests back to Claude, or open products/save pieces locally.
- `src/components/storefront.tsx`: storefront shell and session commerce. A composed discovery journey replaces the static hero/gallery; old session edits without sections retain the legacy renderer. Generation opens the photographic `composition-scene.tsx` interlude: a slowly drifting background, floating photo studies on desktop, stars and actual connecting/composing/checking stages. Keep browsing (or Escape) minimizes it to a compact streamed-progress panel; its sparkle control reopens the same request. The expanded scene traps focus and makes the background inert; minimizing releases both. Success, failure or cancellation dismisses it without an artificial minimum wait. Cancellation aborts the provider request, restores the prompt and keeps the current edit, bag and shortlist. Fragmented UTF-8/NDJSON is buffered; incomplete or oversized responses cannot replace the edit. A dialog opened during minimized generation keeps focus when the result arrives. While browsing a completed edit, the input transitions into Claude's follow-up recommendations; scrolling back to the edit's start or selecting the message icon restores the input. Draft text and photos are never hidden by scrolling. Product, cart, and checkout interactions do not require model calls.
- `src/app/api/checkout/route.ts`: validates product/size/quantity and computes authoritative prices. Returns an ephemeral simulated order; does not process payments, send email, reserve stock, or persist an actual order.
- `src/lib/server.ts`: bounded request-body parsing, same-origin check, and secondary process-local request limits. `src/lib/demo-access.ts` and `src/proxy.ts` protect the storefront and direct API calls. `src/lib/demo-usage.ts` enforces atomic site-wide usage reservations in Netlify Blobs.

For this small sample catalog, the composer receives the full catalog. A larger catalog will need server-side retrieval and tenant-scoped tools. Content is rendered as React text, not model-generated HTML or executable code.

## Private Demo Protection

Production requires HTTP Basic access with `DEMO_USERNAME` (default `demo`) and a randomly generated `DEMO_PASSWORD` of at least 24 characters. The browser asks for these credentials; never use the Anthropic API key as the demo password. Configure credentials in Netlify **Project configuration > Environment variables**, in all contexts/scopes so both the proxy and server function receive them, then deploy. Keep the password out of source control and chat. Production fails closed if access is unconfigured; local `npm run dev` remains usable without a password unless one is configured. Production builds outside Netlify also require access and a working quota backend rather than silently dropping protection.

Authentication is checked before the page and again inside the composition/status/checkout handlers. Authenticated responses are private/no-store, malformed or oversized credentials are refused, and Web Crypto HMAC verification avoids direct password comparison. Direct API calls cannot bypass access by forging an Origin or proxy header. Browser credentials remain cached by the browser: close its private browsing session to end access, and rotate the password to revoke shared access.

Before a model call, strongly consistent, conditional Netlify Blobs writes reserve a site-wide slot: **40 generations per UTC day**, **four per fixed minute**, and **two in flight** by default. `DEMO_DAILY_LIMIT` may be 1-200 and `DEMO_PER_MINUTE_LIMIT` 1-10; malformed settings refuse paid work. A generation includes its possible repair: at most two model calls, each with a 2600-output-token cap, under an 85-second request deadline. Failed/cancelled generations still count toward the daily allowance. Leases expire after two minutes if a function dies, but usage is never automatically refunded. Counters survive cold starts and deploys and are shared across the site's deploy contexts. The store holds only aggregate counters and ephemeral lease IDs, not prompts, photos, API keys or raw IP addresses. A storage outage, corrupt state or exhausted conditional-write retries blocks AI rather than permitting unmetered requests.

Set `DEMO_AI_ENABLED=false` and redeploy to stop paid generation while authenticated browsing and simulated checkout remain usable. Reaching a quota returns a clear error and preserves the current edit/bag. Rotating the access password does not reset daily usage. Remove old unprotected deployments when publishing this protection; otherwise immutable preview URLs can still run the old code.

This bounds request/token exposure, **not an exact dollar budget**. A holder of the shared password can consume the allowance; protect and rotate it. Configure an appropriate provider project spending limit as a billing backstop, use a dedicated Anthropic key/project, and restrict Netlify/Git administrator access. The ordinary inference key cannot configure your Anthropic billing limits. This does not resolve the upstream A2UI advisory or provide individual user accounts, sophisticated bot/DDoS protection or production tenancy.

## Composition Performance

- **Auto** uses Haiku for text follow-ups up to 200 characters with prior history and no explicit budget, material exclusions, locks or replacements. First edits, constrained edits and all photos use the quality model. These are operational routing rules, not a rule-based recommendation generator; Claude still composes every personalized edit.
- **Fast** explicitly requests the fast model for text; **Quality** always requests the quality model. Photos always use the quality model. Failed fast compositions get at most one quality-model repair, within the original two-call bound. Models remain server-configurable. The response-mode selection is in-memory and resets to Auto on reload.
- The stable brand instructions, full catalog and tool schema use an ephemeral Anthropic prompt-cache breakpoint. History, preferences and images are outside that breakpoint. Cache hits depend on provider minimum prefix length, expiry, model and schema; cold requests can be slower. Deterministic eligibility and remaining-budget hints help the model but never substitute generated selections.
- Output is three concise rich sections, capped at 2600 output tokens. Strict tool grammar handles shape/known IDs; the original server validators still enforce counts, exclusions, locks and totals. No partially validated composition is displayed. Actual provider deltas drive drafting progress; there are no invented completion percentages. Native A2UI sections are not progressively streamed.
- A small live benchmark on 2026-11-12 measured a warm simple follow-up at **7.3s on Haiku versus 11.2s on Sonnet**, both one attempt. A cold Haiku call took 12.4s; a cold locked-piece Sonnet edit took 14.3s, also one attempt. Initial progress arrived in 9-90ms locally, not the finished UI; first model output ranged from about 1.8-9.0s. Earlier constrained Haiku trials required repairs and were slower, which is why Auto retains Sonnet for those cases. These are individual samples, not average/p95 guarantees or proof of a universal speedup.

## Shopping Journeys

- **Your direction:** editable occasion, fit, palette, USD outfit budget, and wool/silk/leather exclusions. Preferences are sent on each request. Catalog validation rejects excluded materials, over-budget looks, missing locked pieces, and products requested for replacement. Fit, palette and free-text constraints still require semantic evaluation; there is no invented fit or live inventory data.
- **Make this look yours:** the A2UI `edit_look` action opens a local outfit editor. Keep exact pieces, ask Claude for replacements, choose sizes per piece, and add selected pieces atomically. Pieces already in the bag are marked and deselected by default. Cart limits and prices remain authoritative, independent of Claude.
- **Product dock:** a sticky purchase surface inside product details combines sizes and add-to-bag controls with materials, real-model styling, and comparison requests. Closing product details leaves the surrounding discovery page intact.
- **Shortlist and bag:** build around saved pieces or complete a look around the bag. Requests include approved saved and bag product IDs. The renderer marks pieces already in the bag; no model call can modify the cart or purchase anything.
- **Visual history:** up to eight edits include product thumbnails, parent relationships, timestamps for new edits, and preference snapshots. Revisiting an edit preserves later edits and makes the selected branch the next request's history. Compare two edits side by side. Older sessions without this metadata remain supported.
- **Photo inspiration:** attach a JPEG, PNG or WebP after consent. The browser accepts files under 10 MB/24 megapixels and re-encodes to a JPEG up to 1200 px on its longest side, stripping original metadata. The encoded attachment is bounded to approximately 700 KB and validated by MIME allowlist/base64/file signature on the server. No remote image URLs or SVGs are accepted. Claude receives the image only on submission. Successful composition clears it; cancellation/failure preserves it for retry. This is clothing-style inspiration, not identification, exact matching, or virtual try-on.
- **Motion:** hero, generated editorial and closing photographic bands use bounded scroll-linked translation; look descriptions remain sticky on larger screens. Reduced-motion mode disables parallax and nonessential animation. Mobile retains access to journey history and every shopping control.
- **While composing:** an immersive photographic scene uses existing approved imagery, not guessed recommendations or generated previews. It adds no model calls or minimum delay. Progress follows real server events, including returning to composition if repair is needed; no fake percentage or timer is shown. Minimize/reopen, cancellation, focus isolation, reduced motion and successful/error completion were checked at desktop, 390/320px mobile and short landscape sizes.

## Brand Packages

The settings drawer switches between LIFE and STUDIO / 02. Each configuration specifies identity, accent/tint, editorial hero asset, copy, and model voice. Both use a black-to-deep-blue base with legible ivory text; LIFE uses sage accents and STUDIO uses cool silver-blue accents, alongside warm editorial highlights. Both intentionally use the same sample products and USD pricing to demonstrate renderer reuse. `src/lib/commerce.ts` owns these configurations. Photography is served locally from `public/images`. The internal `forme` preset ID is retained for existing session compatibility.

Brand uploads are **not implemented**. The next phase will ingest files, validate formats/rights, suggest metadata/design tokens, and require preview/approval before publishing. Do not execute uploaded JavaScript or arbitrary CSS. Production tenancy needs authenticated tenant resolution and isolated data/storage; the two presets are not a multi-tenant SaaS platform.

## Session and Privacy

This browser tab stores its edit history (up to 8), active branch, preference snapshots, current preferences, saved product IDs, brand, and bag in `sessionStorage`. There is no account, cross-visit profile, tracking cookie, or analytics service. Reset in settings deletes this state. Requests, up to four ancestral requests/summaries/product selections, preferences, and saved/bag/locked product IDs are sent to Anthropic; never enter sensitive information. Photo attachments are held only in React memory, not session storage or journey snapshots; the application does not persist uploaded files. Submitted images are subject to the provider's data policies, so do not treat this as a zero-retention guarantee. Obsolete or invalid edits are dropped individually without clearing a valid bag or saved pieces. No API key is sent to the browser. Dummy delivery details are fixed fictional values.

## Demo Limitations

Products, material descriptions, prices, and brands are fictional. Photos are illustrative, not exact representations of manufactured products; this release does not add manufactured-product media or alternate product views. No real inventory, taxes, payment, fulfillment, or medical functionality. All personal edits are Claude-generated; filtering, sorting, cart actions, and totals deliberately do not use an LLM. The complete validated edit replaces the current layout after one model call (or two when repair is needed); streaming currently communicates progress rather than rendering partial sections. Latency varies, and photos consume additional tokens. Model output is schema/catalog validated, but relevance, image similarity and natural-language constraint adherence still require evaluation.

## A2UI

[A2UI](https://a2ui.org/) (Agent-to-User Interface) is an open-source generative UI framework with a declarative protocol, agent SDKs, and native renderers including React. An agent sends UI data using an approved component catalog, not executable frontend code. The renderer maps that data to native components; the protocol supports streamed updates and data bindings.

This application now uses the official `@a2ui/react` and `@a2ui/web_core` packages pinned to 0.15.0, with their React-supported **v0.9 wire protocol**. The custom catalog provides `Discovery`, `Editorial`, `Question`, `ProductSelection`, `StyledLook`, and `Comparison`. `MessageProcessor` validates and resolves the graph; `A2uiSurface` renders it; `ComponentContext.dispatchAction` handles interactions. Tests exercise actual SDK graph processing and action dispatch, not a mock renderer.

Claude emits a constrained domain composition through its tool, not arbitrary native A2UI JSON. The shared adapter translates that composition into protocol messages on the server and reconstructs the same messages from validated session state in the browser. This deliberate boundary keeps product IDs, assets, actions and prices controlled. There is no general-purpose A2UI ingress, A2A/AG-UI transport, v1.0 claim, native A2UI streaming, or agent-generated frontend code. App-level NDJSON progress/result streaming is separate from the A2UI protocol. The React SDK is loaded client-only because it accesses browser custom-element APIs during import.

**Dependency caveat:** the published SDK still depends on legacy Zod 3 with an upstream high-severity advisory (GHSA-mrhx-c7xc-m3w5), and its Markdown adapter declares a core peer range that lags the SDK. `npm audit` currently reports four high entries in that dependency chain. Application/server schemas use patched Zod 4.6.7+; `zod-a2ui` isolates the legacy catalog API. All generated content is bounded and validated before the SDK receives it, and no Markdown rendering is enabled. DOMPurify is overridden to patched 3.4.17+. These constraints do not resolve the upstream advisory: this remains a local demonstrator, not a public-production security approval. Reassess the SDK before deployment; do not use `npm audit fix --force` to silently change the renderer version. Reference: https://github.com/a2ui-project/a2ui.

Before broader production use: replace shared demo access with authenticated identities/tenant controls as appropriate, establish per-tenant budgets, real consent/privacy terms, durable commerce storage, observability, content evaluations, a complete security-header policy, and payment-provider integration if real commerce is authorized. The private-demo access gate and site-wide atomic quotas are not production security approval. Confirm the configured model and provider policies before using client data.

## Photography

Downloaded from Unsplash's image CDN, governed by the Unsplash license: https://unsplash.com/license. Images are bundled to avoid runtime dependency on the image CDN. They are illustrative; confirm rights and suitability before client publication.

| Local Asset  | Unsplash Image ID                |
| ------------ | -------------------------------- |
| hero, coat   | photo-1539109136881-3be0616acf4b |
| studio       | photo-1483985988355-763728e1935b |
| knit         | photo-1434389677669-e08b4cac3105 |
| trousers     | photo-1594633312681-425c7b97ccd1 |
| bag          | photo-1548036328-c9fa89d128fa    |
| dress        | photo-1469334031218-e382a71b716b |
| sneakers     | photo-1549298916-b41d501d3772    |
| jacket       | photo-1551028719-00167b16eac5    |
| tee          | photo-1576566588028-4147f3842f27 |
| linen-shirt  | photo-1596755094514-f87e34085b2c |
| oxford-shirt | photo-1620012253295-c15cc3e65df4 |
| poplin-shirt | photo-1603252109303-2751441dd157 |
| silk-shirt   | photo-1598554747436-c9293d6a588f |
| chinos       | photo-1473966968600-fa801b869a1a |
| blazer       | photo-1507679799987-c73779587ccf |
| loafers      | photo-1614252235316-8c857d38b5f4 |

Fonts: the reference uses GT Eesti Pro and Quarto Light. CSS prefers locally installed copies; browsers without them use Outfit and Cormorant Garamond through Google Fonts, then generic fallbacks. Exact cross-browser matching requires separately licensed webfont files or an authorized font-service integration; reference-site font binaries are not copied or hotlinked. For an offline or privacy-restricted deployment, self-host approved fonts.
