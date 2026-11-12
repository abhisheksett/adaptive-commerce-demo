# Product Backlog

## Release 1: E-Commerce Demonstrator

- [x] Responsive editorial storefront and curated sample catalog.
- [x] Approved gallery, outfit, and comparison compositions.
- [x] Claude-only server-side composition, schema/catalog validation, no synthetic fallback.
- [x] Soothing dark editorial theme across storefront, drawers, comparison, and checkout.
- [x] Nonsecret model/latency/token metadata in experience settings.
- [x] Within-session context, saved pieces, journey history, and reset.
- [x] Product details, sizes, quantity controls, bag, deterministic totals.
- [x] Simulated checkout and ephemeral order confirmation.
- [x] Two configurable brand packages; shared sample catalog.
- [x] Unit/API tests for composition boundaries and checkout validation.
- [x] Verify live Anthropic access with the user's locally configured key (Sonnet 4.6; real outfit composition).
- [x] Replace gallery-only personalization with Claude-ordered discovery sections: editorial, visual questions, selections, looks, and comparisons.
- [x] Official A2UI React/core integration, branded v0.9 catalog, protocol graph and SDK actions; client-only renderer boundary.
- [x] Expand catalog to 15 pieces with real shirt choices and complementary styling pieces; inspected local illustrative photography.
- [x] One bounded Claude schema-repair attempt; aggregate usage across attempts; no rule-based fallback.
- [x] Live generated-choice refinement, saves, required sizes and simulated checkout; desktop/mobile checks at 1440/390/320px.
- [x] Nonblocking streamed composition progress with provider cancellation and preserved edit/commerce state; replaces the earlier full-screen loading state.
- [x] Scroll-aware recommendation dock using Claude follow-ups, with composer restoration and draft preservation; desktop/mobile browser checks.
- [x] Explicit editable preferences, material exclusions and USD budgets; validate catalog constraints, outfit totals and locked/replaced pieces after Claude composition.
- [x] A2UI edit-look action, per-piece locks/replacement via Claude, required size selections and atomic multi-piece additions; bag anchors deselected by default.
- [x] Product-aware sticky purchase dock with materials, contextual styling and comparison requests; preserve the surrounding discovery page.
- [x] Saved/bag-aware Claude requests and completion actions; mark pieces already in the bag without letting the model mutate commerce state.
- [x] Visual session history with thumbnails, non-destructive branching, preference snapshots and side-by-side comparison of two edits.
- [x] Consented photo inspiration with browser resize/re-encoding, bounded server validation, real Claude vision and no image persistence in session/history.
- [x] Black-to-blue night-sky design with photographic parallax and sticky editorial content; reduced-motion support and desktop/mobile journey checks.
- [x] Strict catalog-grounded tool schemas with required section slots, concise three-section edits and a required look for locked-piece requests.
- [x] Stable-prefix prompt caching, deterministic eligibility/budget hints, timing/cache/attempt diagnostics and configurable Auto/Fast/Quality Claude routing.
- [x] Live model comparison and cache verification; keep constrained edits/photos on quality model after slower fast-model repair trials.
- [x] Fragmented progress/result streams, retained browsing, modal-focus preservation, cancellation/failure checks at 1440/390/320px.
- [x] Immersive photographic composition scene with layered motion/stars and real stages; minimize/reopen the same request, preserve cancellation and reduced motion, verify short landscape/mobile layouts.
- [ ] Integrate licensed GT Eesti Pro/Quarto webfonts when provided; current local-font preferences use open-font fallbacks elsewhere.
- [ ] Review assets and fictional copy before client publication.

## Next Phase: Returning Visitors

- [ ] Explicit consent and account/anonymous identity design.
- [ ] Remembered preferences across visits with inspect/edit/delete controls.
- [ ] Persisted journeys and saved pieces; expiry and retention policy.
- [ ] Personalization evaluations: relevance, constraint adherence, stability.

## Next Phase: Brand Onboarding

- [ ] Asset upload validation: type/size, malware checks, licensing metadata.
- [ ] Logo/font/color extraction with manual overrides and accessible contrast checks.
- [ ] Product CSV/JSON ingestion, image mapping, validation, and preview.
- [ ] Brand voice/content approval and configurable domain components.
- [ ] Versioned draft/publish/rollback workflow for brand packages.
- [ ] Tenant authentication, isolated catalogs/assets, and authorized presenter controls.

## Later: Production Readiness

- [ ] Resolve upstream A2UI legacy-Zod advisory and Markdown/core peer mismatch before public deployment; assess supported renderer/protocol upgrades.
- [ ] Evaluate direct native A2UI generation and protocol-level transport integration beyond the constrained domain adapter.
- [ ] Catalog/CMS connectors and grounded search for larger catalogs.
- [ ] Coherent licensed product media, genuine variant photos and alternate views; validate photo-inspiration relevance against a representative evaluation set.
- [ ] Stream complete validated sections without layout instability.
- [ ] Distributed rate limits, spend ceilings, retries, and cancellation accounting.
- [ ] Durable carts, idempotent order creation, inventory validation, tax/shipping integration.
- [ ] Payment-provider sandbox, then separately authorized real commerce.
- [ ] Privacy review, consented instrumentation, accessibility audit, and security testing.
- [ ] Evaluate regional pricing, currencies, localization, and product media fidelity.

## Out of Scope

Lilly-specific journeys, medical content, regulated product recommendations, and real transactions.
