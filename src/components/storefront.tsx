"use client";

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, Check, ChevronDown, ChevronRight, CircleCheck, Columns2, Heart, ImagePlus, LayoutGrid, LoaderCircle, MessageSquare, Minus, Plus, RotateCcw, ShoppingBag, SlidersHorizontal, Sparkles, Truck, X } from "lucide-react";
import { z } from "zod/v4";
import { brands, calculateOrder, cartItemSchema, imageUrl, mergeCart, money, preferencesSchema, productById, products, validateExperience, type BrandId, type CartItem, type Experience, type Preferences, type Product } from "@/lib/commerce";
import LookEditor from "./look-editor";
import InspirationInput, { type Inspiration } from "./inspiration-input";
import CompositionScene from "./composition-scene";
import dynamic from "next/dynamic";

const DiscoverySurface = dynamic(() => import("./discovery-surface"), { ssr: false });

type Panel = "cart" | "checkout" | "saved" | "settings" | "history" | "preferences" | "inspiration" | null;
type Turn = { id: string; parentId?: string; createdAt?: string; preferences?: Preferences; message: string; experience: Experience; source: "claude" };
type ComposeOptions = { lockedIds?: string[]; replaceIds?: string[] };
const callMetaSchema = z.object({ model: z.string(), durationMs: z.number(), inputTokens: z.number(), outputTokens: z.number(), attempts: z.number().optional(), cacheReadTokens: z.number().optional(), cacheWriteTokens: z.number().optional(), firstTokenMs: z.number().nullable().optional() });
type CallMeta = z.infer<typeof callMetaSchema>;
const compositionResultSchema = z.object({ source: z.literal("claude"), experience: z.unknown(), meta: callMetaSchema.optional() });
const compositionEventSchema = z.discriminatedUnion("type", [z.object({ type: z.literal("progress"), message: z.string().max(200) }), compositionResultSchema.extend({ type: z.literal("result") }), z.object({ type: z.literal("error"), error: z.string() })]);
type Order = { id: string; total: number; subtotal: number; shipping: number; lines: { name: string; size: string; quantity: number; price: number }[] };
const storageKey = "forme.session.v1";
const initialSuggestions = ["Help me find my kind of shirt", "A weekend away", "An outfit for dinner under $350"];

function IconButton({ label, children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button type="button" className={`icon-button ${className}`} aria-label={label} title={label} {...props}>{children}</button>;
}

function ProductImage({ product, className = "" }: { product: Product; className?: string }) {
  return <img className={className} src={imageUrl(product.image)} alt={`${product.name} in ${product.color} — illustrative photography`} loading="lazy" />;
}

export default function Storefront() {
  const [brandId, setBrandId] = useState<BrandId>("forme");
  const [experience, setExperience] = useState<Experience | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [activeTurnId, setActiveTurnId] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<Preferences>(() => preferencesSchema.parse({}));
  const [inspiration, setInspiration] = useState<Inspiration | null>(null);
  const [look, setLook] = useState<{ ids: string[]; title: string } | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [filter, setFilter] = useState("All pieces");
  const [sort, setSort] = useState("Curated");
  const [compact, setCompact] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [size, setSize] = useState("");
  const [sizeError, setSizeError] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState("");
  const [compositionProgress, setCompositionProgress] = useState("");
  const [compositionMinimized, setCompositionMinimized] = useState(false);
  const [responseSpeed, setResponseSpeed] = useState<"auto" | "fast" | "quality">("auto");
  const [reading, setReading] = useState(false);
  const [composerExpanded, setComposerExpanded] = useState(false);
  const [engineStatus, setEngineStatus] = useState<"checking" | "ready" | "unconfigured" | "error">("checking");
  const [lastCall, setLastCall] = useState<CallMeta | null>(null);
  const [notice, setNotice] = useState("");
  const [toast, setToast] = useState("");
  const [restored, setRestored] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [ordering, setOrdering] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutAccepted, setCheckoutAccepted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const focusBeforeDialog = useRef<HTMLElement | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);
  const storefrontRef = useRef<HTMLDivElement>(null);
  const brand = brands[brandId];
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const totals = cart.length ? calculateOrder(cart) : null;
  const isDialogOpen = Boolean(panel || selected || order || look);
  const compositionSceneOpen = loading && !compositionMinimized;
  const activeTurn = turns.find(turn => turn.id === activeTurnId);
  const recommendationMode = Boolean(experience && reading && !composerExpanded && !message.trim() && !inspiration && !loading && !notice);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    function update() {
      frame = 0;
      storefrontRef.current?.style.setProperty("--sky-drift", `${reduced.matches ? 0 : Math.min(90, window.scrollY * 0.025)}px`);
      storefrontRef.current?.querySelectorAll<HTMLElement>("[data-parallax]").forEach(element => {
        const bounds = element.parentElement?.getBoundingClientRect();
        const configuredSpeed = Number.parseFloat(element.dataset.parallax ?? "");
        const speed = Number.isFinite(configuredSpeed) ? configuredSpeed : 0.18;
        const limit = Number(element.dataset.parallaxLimit || Math.min(80, (bounds?.height ?? 0) * 0.075));
        const offset = reduced.matches || !bounds ? 0 : Math.max(-limit, Math.min(limit, (window.innerHeight / 2 - bounds.top - bounds.height / 2) * speed));
        element.style.setProperty("--parallax-y", `${offset}px`);
      });
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update); }
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reduced.addEventListener("change", schedule);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); reduced.removeEventListener("change", schedule); };
  }, [experience]);

  useEffect(() => {
    if (!experience || loading) { setReading(false); return; }
    let frame = 0;
    function updateDock() {
      frame = 0;
      const top = document.getElementById("collection")?.getBoundingClientRect().top ?? 0;
      setReading(current => top < -160 ? true : top > -60 ? false : current);
    }
    function onScroll() {
      if (!frame) frame = requestAnimationFrame(updateDock);
    }
    updateDock();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); };
  }, [experience, loading]);

  useEffect(() => {
    if (!reading) setComposerExpanded(false);
  }, [reading]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        const state = z.object({ brandId: z.enum(["forme", "studio"]), cart: z.array(cartItemSchema).max(20), saved: z.array(z.string()).max(products.length), activeTurnId: z.string().nullable().optional(), preferences: preferencesSchema.optional(), turns: z.array(z.object({ id: z.string().optional(), parentId: z.string().optional(), createdAt: z.string().optional(), preferences: preferencesSchema.optional(), message: z.string().max(500), experience: z.unknown(), source: z.enum(["claude", "demo"]) })).max(8) }).parse(JSON.parse(raw));
        const restoredTurns = state.turns.filter(turn => turn.source === "claude").flatMap((turn, index) => { try { return [{ ...turn, id: turn.id ?? `legacy-${index}`, source: "claude" as const, experience: validateExperience(turn.experience) }]; } catch { return []; } });
        if (state.cart.length) calculateOrder(state.cart);
        setBrandId(state.brandId);
        setCart(state.cart);
        setSaved(state.saved.filter(id => productById(id)));
        setTurns(restoredTurns);
        const active = restoredTurns.find(turn => turn.id === state.activeTurnId) ?? restoredTurns.at(-1);
        setActiveTurnId(active?.id ?? null);
        setPreferences(state.preferences ?? preferencesSchema.parse({}));
        setExperience(active?.experience ?? null);
      }
    } catch { sessionStorage.removeItem(storageKey); }
    setRestored(true);
    fetch("/api/experience").then(response => response.json()).then(data => setEngineStatus(data.mode === "claude" ? "ready" : "unconfigured")).catch(() => setEngineStatus("error"));
    return () => requestRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!restored) return;
    try { sessionStorage.setItem(storageKey, JSON.stringify({ brandId, cart, saved, turns, activeTurnId, preferences })); } catch {}
  }, [brandId, cart, saved, turns, activeTurnId, preferences, restored]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!isDialogOpen) return;
    focusBeforeDialog.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = setTimeout(() => dialogRef.current?.querySelector<HTMLElement>("button, input, select, [tabindex='0']")?.focus(), 0);
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !ordering) { setPanel(null); setSelected(null); setOrder(null); setLook(null); }
      if (event.key !== "Tab") return;
      const elements = [...(dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), select, a[href], [tabindex='0']") ?? [])].filter(element => element.getClientRects().length > 0);
      if (!elements?.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
      focusBeforeDialog.current?.focus();
    };
  }, [isDialogOpen, ordering]);

  let visibleProducts = (experience ? experience.productIds.map(id => productById(id)!).filter(Boolean) : products).filter(product => filter === "All pieces" || (filter === "Women" || filter === "Men" ? product.audience === filter || product.audience === "Everyone" : product.category === "Bags" || product.category === "Shoes"));
  if (sort === "Price: low to high") visibleProducts = [...visibleProducts].sort((first, second) => first.price - second.price);
  if (sort === "Price: high to low") visibleProducts = [...visibleProducts].sort((first, second) => second.price - first.price);

  function showProduct(product: Product) {
    setPanel(null);
    setLook(null);
    setSelected(product);
    setSize(product.sizes.length === 1 ? product.sizes[0] : "");
    setSizeError(false);
  }

  function toggleSaved(id: string) {
    setSaved(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  }

  function addToCart(product: Product) {
    if (!size) { setSizeError(true); return; }
    const existing = cart.find(item => item.productId === product.id && item.size === size);
    if (existing && existing.quantity >= 10) { setToast("A maximum of 10 per size in this demo."); return; }
    if (!existing && cart.length >= 20) { setToast("Your demo bag has reached its limit."); return; }
    setCart(current => existing ? current.map(item => item === existing ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { productId: product.id, size, quantity: 1 }]);
    setSelected(null);
    setToast(`${product.name} added to your bag`);
  }

  function addLookToCart(items: CartItem[]) {
    try { setCart(mergeCart(cart, items)); setLook(null); setPanel("cart"); setToast("Your selected pieces are in the bag."); }
    catch { setToast("Unable to add this look. Check sizes and the bag limit of 10 per size and 20 lines."); }
  }

  function branchHistory() {
    if (!activeTurn) return [];
    if (!activeTurn.parentId) return activeTurn.id.startsWith("legacy-") ? turns.slice(0, turns.indexOf(activeTurn) + 1).slice(-4) : [activeTurn];
    const branch: Turn[] = [];
    let turn: Turn | undefined = activeTurn;
    while (turn && branch.length < 4) { branch.unshift(turn); turn = turns.find(previous => previous.id === turn?.parentId); }
    return branch;
  }

  function updateQuantity(productId: string, itemSize: string, delta: number) {
    setCart(current => current.map(item => item.productId === productId && item.size === itemSize ? { ...item, quantity: Math.min(10, item.quantity + delta) } : item).filter(item => item.quantity > 0));
  }

  function resetSession() {
    requestRef.current?.abort();
    busyRef.current = false;
    setLoading(false);
    setExperience(null);
    setTurns([]);
    setActiveTurnId(null);
    setCompareIds([]);
    setPreferences(preferencesSchema.parse({}));
    setInspiration(null);
    setLook(null);
    setCart([]);
    setSaved([]);
    setFilter("All pieces");
    setMessage("");
    setNotice("");
    setLastCall(null);
    setOrder(null);
    setPanel(null);
    setToast("A fresh start. Your session has been cleared.");
  }

  async function compose(prompt: string, options: ComposeOptions = {}) {
    if (!prompt.trim() || busyRef.current) return;
    busyRef.current = true;
    const controller = new AbortController();
    requestRef.current = controller;
    setPendingPrompt(prompt);
    setCompositionProgress("Connecting to Claude…");
    setCompositionMinimized(false);
    setComposerExpanded(false);
    setPanel(null);
    setSelected(null);
    setLook(null);
    setLoading(true);
    setMessage("");
    setNotice("");
    try {
      const response = await fetch("/api/experience", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/x-ndjson" }, body: JSON.stringify({ message: prompt, brandId, speed: responseSpeed, context: { preferences, savedIds: saved, bagIds: [...new Set(cart.map(item => item.productId))], lockedIds: options.lockedIds ?? [], replaceIds: options.replaceIds ?? [] }, ...(inspiration ? { inspiration } : {}), history: branchHistory().map(turn => ({ message: turn.message, summary: turn.experience.description, productIds: turn.experience.productIds })) }), signal: controller.signal });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Claude could not compose that edit. Please try again.");
      }
      let result: z.infer<typeof compositionResultSchema> | undefined;
      if (response.headers.get("content-type")?.includes("application/x-ndjson")) {
        if (!response.body) throw new Error("Missing composition stream.");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffered = "";
        let receivedBytes = 0;
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (controller.signal.aborted || requestRef.current !== controller) return;
            receivedBytes += value?.byteLength ?? 0;
            if (receivedBytes > 1000000) throw new Error("The composition response is too large.");
            buffered += decoder.decode(value, { stream: !done });
            let boundary: number;
            while ((boundary = buffered.indexOf("\n")) !== -1) {
              const line = buffered.slice(0, boundary).trim();
              buffered = buffered.slice(boundary + 1);
              if (!line) continue;
              const event = compositionEventSchema.parse(JSON.parse(line));
              if (event.type === "progress") setCompositionProgress(event.message);
              else if (event.type === "error") throw new Error(event.error);
              else result = event;
            }
            if (done) break;
          }
          if (buffered.trim()) throw new Error("The composition stream was interrupted.");
        } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
      } else result = compositionResultSchema.parse(await response.json());
      if (controller.signal.aborted || requestRef.current !== controller) return;
      if (!result) throw new Error("Claude did not finish the edit. Your collection is unchanged.");
      const next = validateExperience(result.experience);
      setExperience(next);
      setEngineStatus("ready");
      setLastCall(result.meta ?? null);
      const id = crypto.randomUUID();
      setTurns(current => current.concat({ id, parentId: activeTurn?.id, createdAt: new Date().toISOString(), preferences: { ...preferences }, message: prompt, experience: next, source: "claude" }).slice(-8));
      setActiveTurnId(id);
      setCompareIds([]);
      setInspiration(null);
      setFilter("All pieces");
      setSort("Curated");
      setTimeout(() => { if (dialogRef.current) return; document.getElementById("collection")?.scrollIntoView({ behavior: "smooth", block: "start" }); document.getElementById("collection-title")?.focus({ preventScroll: true }); }, 80);
    } catch (error) {
      if (!controller.signal.aborted) {
        setEngineStatus("error");
        setNotice(error instanceof Error ? error.message : "Something went wrong. Your collection is still here.");
        setMessage(prompt);
        document.getElementById("collection")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } finally {
      if (requestRef.current === controller) { busyRef.current = false; setLoading(false); }
    }
  }

  function cancelComposition() {
    requestRef.current?.abort();
    requestRef.current = null;
    busyRef.current = false;
    setLoading(false);
    setMessage(pendingPrompt);
    setComposerExpanded(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function openComposer() {
    setComposerExpanded(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function updateBudget(value: string) {
    const budget = value === "" ? null : Number(value);
    if (budget === null || (Number.isFinite(budget) && budget > 0 && budget <= 10000))
      setPreferences(current => ({ ...current, budget }));
  }

  async function placeOrder(event: FormEvent) {
    event.preventDefault();
    if (!checkoutAccepted || ordering) return;
    setOrdering(true);
    setCheckoutError("");
    try {
      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ brandId, items: cart }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Please try placing your demo order again.");
      setOrder(data.order);
      setCart([]);
      setPanel(null);
    } catch (error) { setCheckoutError(error instanceof Error ? error.message : "Checkout is unavailable. Please try again."); }
    finally { setOrdering(false); }
  }

  function selectFilter(value: string) {
    if (experience?.sections) setExperience(null);
    setFilter(value);
    document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" });
  }

  function closeDialog() {
    if (ordering) return;
    setPanel(null);
    setSelected(null);
    setOrder(null);
    setLook(null);
  }

  const suggestions = experience?.suggestions ?? initialSuggestions;

  return <div ref={storefrontRef} className={`storefront brand-${brandId}`} style={{ "--accent": brand.accent, "--tint": brand.tint } as CSSProperties}>
    <title>{`${brand.name} — A wardrobe, uniquely yours`}</title>
    <div inert={compositionSceneOpen}>
    <a className="skip-link" href="#collection">Skip to collection</a>
    <div className="announcement"><span>A considered collection. An experience that&apos;s yours.</span><span className="announcement-right">Complimentary delivery over $150 <ArrowRight size={12} /></span></div>
    <header className="site-header">
      <button className="wordmark" onClick={() => { setExperience(null); setFilter("All pieces"); window.scrollTo({ top: 0, behavior: "smooth" }); }} aria-label={`${brand.name} home`}>{brand.name}<span className="wordmark-dot">®</span></button>
      <nav className="main-nav" aria-label="Shop"><button onClick={() => selectFilter("All pieces")}>Discover</button><button onClick={() => selectFilter("Women")}>Women</button><button onClick={() => selectFilter("Men")}>Men</button><button onClick={() => selectFilter("Accessories")}>Accessories</button></nav>
      <div className="header-actions"><IconButton label="Your journey" onClick={() => setPanel("history")}><RotateCcw size={19} /></IconButton><IconButton label={`Saved pieces (${saved.length})`} onClick={() => setPanel("saved")}><Heart size={20} />{saved.length > 0 && <span className="count-dot">{saved.length}</span>}</IconButton><IconButton label={`Shopping bag (${cartCount})`} onClick={() => setPanel("cart")}><ShoppingBag size={20} /><span className="bag-count">{cartCount}</span></IconButton><span className="header-divider" /><IconButton label="Experience settings" onClick={() => setPanel("settings")}><SlidersHorizontal size={19} /></IconButton></div>
    </header>

    <main id="main-content">
      {!experience?.sections && <><section className="hero" aria-labelledby="hero-title">
        <img data-parallax="0.1" data-parallax-limit="20" className="hero-image" src={imageUrl(brand.hero)} alt="Street-style fashion, a personal perspective on everyday dressing" fetchPriority="high" />
        <div className="hero-shade" />
        <div className="hero-content" data-parallax="-0.045" data-parallax-limit="20"><div className="eyebrow light"><span className="tiny-line" /> THE EVERYDAY EDIT — VOL. 01</div><h1 id="hero-title">{brand.name}</h1><p className="hero-collection">{brand.collection}</p><p>{brand.heroText}<br />Discover an edit shaped around you.</p><button className="hero-link" onClick={() => { inputRef.current?.focus(); inputRef.current?.scrollIntoView({ block: "nearest" }); }}>Find your point of view <ArrowRight size={19} /></button></div>
        <div className="hero-bottom"><span>NOT JUST A COLLECTION. YOUR COLLECTION.</span><button aria-label="Explore the collection" title="Explore the collection" onClick={() => document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" })}><ArrowDown size={20} /></button><span>01 — {String(products.length).padStart(2, "0")}</span></div>
        <div className="hero-caption"><span>THE BEAUTY OF</span><strong>being yourself.</strong></div>
      </section>

      <div className="experience-strip"><div><Sparkles size={16} /><span>A different kind of discovery</span></div><p>Your taste. Your plans. A collection that follows your lead.</p><button onClick={() => inputRef.current?.focus()}>Make it yours <ArrowRight size={15} /></button></div></>}

      <section className="collection section-container" id="collection" aria-labelledby="collection-title" aria-busy={loading}>
        <div className="collection-heading"><div><div className="eyebrow">{experience ? "COMPOSED AROUND YOU" : "CONSIDER THIS YOUR STARTING POINT"}</div><h2 id="collection-title" tabIndex={-1}>{experience?.title ?? "Pieces with possibility."}</h2><p>{experience?.description ?? "Good design. Everyday ease. The rest is up to you."}</p></div><div className="collection-signature"><span className="signature-flower">✳</span><span>A little less ordinary.<br />A little more you.</span></div></div>
        {experience && turns.length > 0 && <div className="intent-note"><Sparkles size={15} /><span>“{activeTurn?.message}”</span><span className="source-label">Composed by Claude{lastCall ? ` · ${(lastCall.durationMs / 1000).toFixed(1)}s` : ""}</span><IconButton label="Clear personalized edit" onClick={() => { setExperience(null); setNotice(""); }}><X size={15} /></IconButton></div>}
        <div className="preference-strip" aria-label="Current preferences"><button className="text-button" onClick={() => setPanel("preferences")}><SlidersHorizontal size={16} />Your direction</button>{preferences.occasion && <button className="preference-chip" aria-label="Remove occasion preference" onClick={() => setPreferences(current => ({ ...current, occasion: "" }))}>{preferences.occasion}<X size={12} /></button>}{preferences.fit !== "Any" && <button className="preference-chip" aria-label="Remove fit preference" onClick={() => setPreferences(current => ({ ...current, fit: "Any" }))}>{preferences.fit}<X size={12} /></button>}{preferences.palette && <button className="preference-chip" aria-label="Remove palette preference" onClick={() => setPreferences(current => ({ ...current, palette: "" }))}>{preferences.palette}<X size={12} /></button>}{preferences.budget !== null && <button className="preference-chip" aria-label="Remove budget preference" onClick={() => setPreferences(current => ({ ...current, budget: null }))}>Under {money(preferences.budget)}<X size={12} /></button>}{preferences.excludedMaterials.map(material => <button key={material} className="preference-chip" aria-label={`Allow ${material}`} onClick={() => setPreferences(current => ({ ...current, excludedMaterials: current.excludedMaterials.filter(value => value !== material) }))}>No {material}<X size={12} /></button>)}</div>
        {notice && <div className="notice" role="status">{notice}</div>}
        {experience?.sections ? <DiscoverySurface experience={experience} saved={saved} bagIds={cart.map(item => item.productId)} loading={loading} onRefine={compose} onProduct={showProduct} onSave={toggleSaved} onLook={(ids, title) => { setSelected(null); setPanel(null); setLook({ ids, title }); }} /> : <>
        <div className="collection-toolbar"><div className="category-tabs" role="group" aria-label="Filter collection">{["All pieces", "Women", "Men", "Accessories"].map(value => <button key={value} aria-pressed={filter === value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{value}</button>)}</div><div className="view-controls"><span className="product-count">{visibleProducts.length} pieces</span><label className="sort-label"><span className="sr-only">Sort products</span><select value={sort} onChange={event => setSort(event.target.value)}><option>Curated</option><option>Price: low to high</option><option>Price: high to low</option></select><ChevronDown size={13} /></label><IconButton label={compact ? "Use spacious grid" : "Use compact grid"} aria-pressed={compact} onClick={() => setCompact(value => !value)}>{compact ? <Columns2 size={18} /> : <LayoutGrid size={18} />}</IconButton></div></div>

        {experience?.layout === "outfit" && <div className="outfit-summary"><span><Sparkles size={17} /> Your edit, together</span><span>{visibleProducts.length} pieces <span className="summary-divider">/</span> {money(visibleProducts.reduce((total, product) => total + product.price, 0))} <small>before delivery</small></span></div>}

        {visibleProducts.length === 0 ? <div className="empty-state"><ShoppingBag size={28} /><h3>A different direction?</h3><p>No pieces in this edit match that filter.</p><button className="primary-button" onClick={() => setFilter("All pieces")}>See the full edit <ArrowRight size={16} /></button></div> : experience?.layout === "comparison" ? <div className="comparison-wrap"><table className="comparison-table"><caption className="sr-only">Compare your selected pieces</caption><thead><tr><th scope="col">The details</th>{visibleProducts.map(product => <th key={product.id} scope="col"><button className="comparison-product" onClick={() => showProduct(product)}><ProductImage product={product} /><span>{product.name}</span></button></th>)}</tr></thead><tbody>{["Price", "Color", "Material & care", "Sizes"].map(label => <tr key={label}><th scope="row">{label}</th>{visibleProducts.map(product => <td key={product.id}>{label === "Price" ? money(product.price) : label === "Color" ? product.color : label === "Sizes" ? product.sizes.join(", ") : product.material}</td>)}</tr>)}<tr><th scope="row">Explore</th>{visibleProducts.map(product => <td key={product.id}><button className="text-button" onClick={() => showProduct(product)}>View piece <ArrowRight size={15} /></button></td>)}</tr></tbody></table></div> : <div className={`product-grid ${compact ? "compact" : ""} ${experience?.layout === "outfit" ? "outfit-grid" : ""}`} key={`${experience?.title ?? "all"}-${filter}`}>
          {visibleProducts.map((product, index) => <article className="product-card" key={product.id} style={{ "--index": index } as CSSProperties}><div className="product-photo"><button className="product-image-button" onClick={() => showProduct(product)} aria-label={`View ${product.name}`}><ProductImage product={product} /></button>{index === 0 && <span className="product-badge">{experience ? "IN YOUR EDIT" : "A GOOD PLACE TO START"}</span>}<IconButton label={saved.includes(product.id) ? `Unsave ${product.name}` : `Save ${product.name}`} className={`save-product ${saved.includes(product.id) ? "is-saved" : ""}`} aria-pressed={saved.includes(product.id)} onClick={() => toggleSaved(product.id)}><Heart size={18} fill={saved.includes(product.id) ? "currentColor" : "none"} /></IconButton><button className="quick-view" onClick={() => showProduct(product)}>Discover the piece <Plus size={16} /></button></div><div className="product-meta"><button onClick={() => showProduct(product)}>{product.name}</button><span>{money(product.price)}</span></div><div className="product-color"><span className="swatch" style={{ backgroundColor: product.swatch }} />{product.color}<span className="product-audience">{product.audience === "Everyone" ? "Unisex" : product.audience}</span></div></article>)}
        </div>}
        </>}
        <div className="collection-end"><span className="fine-line" /><p>Something in mind? Let&apos;s find your version of it.</p><span className="fine-line" /></div>
      </section>

      <section className="editorial-band"><img data-parallax src={imageUrl("studio")} alt="An everyday wardrobe in motion. Illustrative photography." loading="lazy" /><div data-parallax="-0.045" data-parallax-limit="20"><div className="eyebrow">FEWER THINGS. BETTER POSSIBILITIES.</div><h2>Style is personal.<br />Discovery should be, too.</h2></div><p>Start with a feeling, a place, or a plan.<br />We&apos;ll find the pieces that belong.</p><button className="round-arrow" aria-label="Start your personal edit" title="Start your personal edit" onClick={openComposer}><ArrowRight size={25} /></button></section>
    </main>

    <footer className="site-footer"><span className="footer-wordmark">{brand.name}</span><span>Independent style. Endless possibility.</span><span>Sample catalog · Simulated checkout</span></footer>

    <div hidden={isDialogOpen} className={`assistant-dock ${recommendationMode ? "is-recommending" : ""}`} data-mode={recommendationMode ? "recommendations" : "compose"}>
      {loading && <div className="composition-progress"><LoaderCircle size={19} className="spin" /><div role="status" aria-live="polite"><strong>{compositionProgress}</strong><span>{pendingPrompt}</span></div><button id="reopen-composition" className="composition-reopen" onClick={() => setCompositionMinimized(false)} aria-label="Open composing experience" title="Open composing experience"><Sparkles size={18} /></button><IconButton label="Cancel composition" onClick={cancelComposition}><X size={18} /></IconButton></div>}
      {recommendationMode && <section className="recommendation-box" aria-label="Recommendations"><div className="recommendation-heading"><span><Sparkles size={17} />Your next direction</span><IconButton label="Write a new request" onClick={openComposer}><MessageSquare size={19} /></IconButton></div><div className="recommendation-options">{suggestions.map(suggestion => <button key={suggestion} onClick={() => compose(suggestion)}><span>{suggestion}</span><ArrowRight size={17} /></button>)}</div></section>}
      <div className="suggestion-row" hidden={recommendationMode}>{suggestions.map((suggestion, index) => <button key={suggestion} disabled={loading || engineStatus === "checking" || engineStatus === "unconfigured"} onClick={() => compose(suggestion)}>{index === 0 && <Sparkles size={13} />}<span>{suggestion}</span><ArrowRight size={12} /></button>)}</div>
      {inspiration && <div className="attached-photo"><img src={`data:image/jpeg;base64,${inspiration.data}`} alt="Attached clothing reference" /><span>Photo attached for your next request</span><IconButton label="Remove attached photo" onClick={() => setInspiration(null)}><X size={16} /></IconButton></div>}
      <form hidden={recommendationMode} className={`composer ${loading ? "is-loading" : ""}`} onSubmit={event => { event.preventDefault(); compose(message.trim() || (inspiration ? "Find catalog pieces inspired by the clothing in this reference." : "")); }}>
        <IconButton label="Add inspiration photo" className="composer-mark" onClick={() => setPanel("inspiration")}><ImagePlus size={22} /></IconButton><div className="composer-input"><label htmlFor="style-prompt">YOUR PERSONAL EDIT <span>CLAUDE</span></label><input id="style-prompt" ref={inputRef} value={message} onChange={event => setMessage(event.target.value)} placeholder={loading ? "Considering the possibilities…" : "What are you dressing for?"} maxLength={500} disabled={loading} autoComplete="off" /></div>{experience && !loading && <IconButton label="Back to the full collection" className="composer-reset" onClick={() => { setExperience(null); setFilter("All pieces"); setNotice(""); }}><RotateCcw size={17} /></IconButton>}<button type="submit" className="send-button" disabled={loading || (!message.trim() && !inspiration) || engineStatus === "checking" || engineStatus === "unconfigured"} aria-label={loading ? "Composing your edit" : "Compose my edit"} title="Compose my edit">{loading ? <LoaderCircle size={20} className="spin" /> : <ArrowRight size={21} />}</button>
      </form>
      <div className="composer-footnote" hidden={recommendationMode}><span className="status-dot" />{loading ? "Claude is composing your collection…" : engineStatus === "checking" ? "Checking the studio…" : engineStatus === "unconfigured" ? "Configure Claude on the server to begin" : engineStatus === "error" ? "Edit unavailable · Please retry" : "Composed with Claude · Session only"}<button onClick={() => setPanel("settings")} aria-label="Open brand and AI settings" title="Open brand and AI settings">{brand.name} <ChevronDown size={10} /></button></div>
    </div>

    {toast && <div className="toast" role="status"><Check size={17} />{toast}</div>}
    <span className="sr-only" role="status" aria-live="polite">{loading ? "Composing your collection" : experience ? `${experience.title}. ${visibleProducts.length} pieces.` : ""}</span>

    {isDialogOpen && <div className="dialog-backdrop" onClick={closeDialog}><div ref={dialogRef} className={`dialog ${selected ? "product-dialog" : order ? "order-dialog" : "side-dialog"}`} role="dialog" aria-modal="true" aria-labelledby="dialog-title" onClick={event => event.stopPropagation()}>
      <div className="dialog-top"><span className="eyebrow">{brand.name} / {selected ? "THE DETAILS" : order ? "ORDER CONFIRMED" : panel === "settings" ? "EXPERIENCE STUDIO" : panel === "history" ? "YOUR JOURNEY" : panel === "saved" ? "YOUR SHORTLIST" : "YOUR SELECTION"}</span><IconButton label="Close dialog" onClick={closeDialog} disabled={ordering}><X size={21} /></IconButton></div>

      {look && <LookEditor key={look.ids.join("-")} ids={look.ids} title={look.title} bagIds={cart.map(item => item.productId)} onReplace={(prompt, lockedIds, replaceIds) => void compose(prompt, { lockedIds, replaceIds })} onAdd={addLookToCart} />}
      {panel === "preferences" && <form className="panel-content preference-form" onSubmit={event => { event.preventDefault(); void compose("Refresh my edit using my updated explicit preferences."); }}><h2 id="dialog-title">Your direction.</h2><label>Occasion<input maxLength={80} value={preferences.occasion} placeholder="A weekend in Florence" onChange={event => setPreferences(current => ({ ...current, occasion: event.target.value }))} /></label><label>Fit<select aria-label="Fit" value={preferences.fit} onChange={event => setPreferences(current => ({ ...current, fit: event.target.value as Preferences["fit"] }))}>{["Any", "Relaxed", "Regular", "Tailored"].map(fit => <option key={fit}>{fit}</option>)}</select></label><label>Palette<input maxLength={80} value={preferences.palette} placeholder="Natural colors, indigo" onChange={event => setPreferences(current => ({ ...current, palette: event.target.value }))} /></label><label>Outfit budget · USD before delivery<input type="number" min="1" max="10000" step="1" placeholder="No limit" value={preferences.budget ?? ""} onChange={event => updateBudget(event.target.value)} /></label><fieldset><legend>Exclude materials</legend>{(["wool", "silk", "leather"] as const).map(material => <label className="consent-row" key={material}><input type="checkbox" checked={preferences.excludedMaterials.includes(material)} onChange={event => setPreferences(current => ({ ...current, excludedMaterials: event.target.checked ? [...current.excludedMaterials, material] : current.excludedMaterials.filter(value => value !== material) }))} />{material}</label>)}</fieldset><button type="submit" className="primary-button">Apply to my edit<ArrowRight size={17} /></button><button type="button" className="secondary-button" onClick={closeDialog}>Keep preferences</button><button type="button" className="text-button" onClick={() => setPreferences(preferencesSchema.parse({}))}><RotateCcw size={14} />Clear preferences</button></form>}
      {panel === "inspiration" && <div className="panel-content"><h2 id="dialog-title">A starting point,<br />in a picture.</h2><InspirationInput value={inspiration} onChange={setInspiration} disabled={loading} /><button className="primary-button" disabled={!inspiration} onClick={() => { closeDialog(); openComposer(); }}>Use this reference<ArrowRight size={17} /></button></div>}

      {selected && <div className="product-detail"><div className="detail-photo"><ProductImage product={selected} /></div><div className="detail-content"><div className="eyebrow">{selected.category} / {selected.audience}</div><h2 id="dialog-title">{selected.name}</h2><p className="detail-price">{money(selected.price)}</p><p className="detail-description">{selected.description}</p><div className="detail-color"><span className="swatch" style={{ backgroundColor: selected.swatch }} />{selected.color}</div><fieldset className="size-picker"><legend>Choose your size</legend><div>{selected.sizes.map(value => <button type="button" key={value} className={size === value ? "selected" : ""} aria-pressed={size === value} onClick={() => { setSize(value); setSizeError(false); }}>{value}</button>)}</div></fieldset>{sizeError && <p className="field-error" role="alert">Please choose a size first.</p>}<button className="primary-button" onClick={() => addToCart(selected)}>Add to bag <ShoppingBag size={17} /></button><button className="secondary-button" onClick={() => toggleSaved(selected.id)}><Heart size={16} fill={saved.includes(selected.id) ? "currentColor" : "none"} />{saved.includes(selected.id) ? "Saved to your shortlist" : "Save for later"}</button><div className="detail-delivery"><Truck size={18} /><span>Complimentary delivery over $150<br /><small>Otherwise $10 · Demo shipping</small></span></div><details><summary>Materials & care <Plus size={15} /></summary><p>{selected.material}</p></details><p className="photo-disclaimer">Fictional product. Photography is illustrative.</p></div></div>}

      {selected && <section className="product-context-dock" aria-label="Product shopping dock"><div className="product-context-actions"><button className="text-button" onClick={() => { const details = dialogRef.current?.querySelector("details"); if (details) { details.open = true; details.scrollIntoView({ behavior: "smooth", block: "center" }); } }}>Materials<Plus size={14} /></button><button className="text-button" onClick={() => void compose(`Build a complete look around ${selected.name}. Explain how the textures and colors work together using catalog facts.`, { lockedIds: [selected.id] })}>How to style<Sparkles size={14} /></button><button className="text-button" onClick={() => void compose(`Compare ${selected.name} (${selected.id}) with relevant catalog alternatives. Explain material, price and fit differences; respect my preferences.`)}>Compare alternatives<Columns2 size={14} /></button></div><div className="product-purchase-row"><div><strong>{selected.name}</strong><span>{money(selected.price)} · {selected.color}</span></div><select aria-label="Product dock size" value={size} onChange={event => { setSize(event.target.value); setSizeError(false); }}><option value="">Size</option>{selected.sizes.map(value => <option key={value}>{value}</option>)}</select><button className="primary-button" onClick={() => addToCart(selected)} aria-label="Add selected size to bag"><ShoppingBag size={17} />Add to bag</button></div></section>}

      {!selected && !order && panel === "saved" && saved.length > 0 && <div className="context-actions"><button className="secondary-button" onClick={() => void compose("Build a complete look around relevant pieces from my shortlist. Distinguish saved anchors from complementary additions and honor my preferences.")}><Sparkles size={17} />Build around my shortlist</button></div>}
      {!selected && !order && panel === "cart" && cart.length > 0 && <div className="context-actions"><button className="secondary-button" onClick={() => void compose("Complete a look around the pieces already in my bag. Clearly distinguish pieces I already chose from missing additions. Do not duplicate them as new purchases. Honor my outfit budget including the anchors.")}><Sparkles size={17} />Complete my look</button></div>}

      {!selected && !order && panel === "settings" && <div className="panel-content">
        <h2 id="dialog-title">One experience.<br />Your identity.</h2><p className="panel-intro">Brand settings apply across the storefront, your edit, and checkout.</p>
        <h3 className="settings-label">BRAND PRESET</h3>
        <div className="brand-options">{Object.entries(brands).map(([id, option]) => <button key={id} className={brandId === id ? "selected" : ""} onClick={() => { requestRef.current?.abort(); requestRef.current = null; busyRef.current = false; setLoading(false); setBrandId(id as BrandId); setExperience(null); setTurns([]); setActiveTurnId(null); setCompareIds([]); setInspiration(null); setNotice(""); setLastCall(null); }}><span className="brand-swatch" style={{ backgroundColor: option.accent }} /><span><strong>{option.name}</strong><small>{option.tagline}</small></span>{brandId === id && <Check size={18} />}</button>)}</div>
        <div className="settings-section"><h3>Composition engine <span className={`engine-badge ${lastCall ? "live" : ""}`}>{engineStatus === "ready" ? lastCall ? "Live" : "Configured" : engineStatus === "checking" ? "Checking" : "Unavailable"}</span></h3><p>Every personal edit is composed by Claude using this brand&apos;s catalog and voice. No rule-based substitutions.</p>
          <fieldset className="response-mode"><legend>Response mode</legend>{(["auto", "fast", "quality"] as const).map(mode => <label key={mode}><input type="radio" name="response-speed" value={mode} checked={responseSpeed === mode} onChange={() => setResponseSpeed(mode)} />{mode === "auto" ? "Auto" : mode === "fast" ? "Fast" : "Quality"}</label>)}</fieldset>
          {lastCall && <dl className="call-details"><div><dt>Model</dt><dd>{lastCall.model}</dd></div><div><dt>Last response</dt><dd>{(lastCall.durationMs / 1000).toFixed(1)}s</dd></div><div><dt>First output</dt><dd>{lastCall.firstTokenMs == null ? "Not streamed" : `${(lastCall.firstTokenMs / 1000).toFixed(1)}s`}</dd></div><div><dt>Attempts</dt><dd>{lastCall.attempts ?? 1}</dd></div><div><dt>Tokens</dt><dd>{lastCall.inputTokens} in / {lastCall.outputTokens} out</dd></div><div><dt>Cached input</dt><dd>{lastCall.cacheReadTokens ?? 0} read / {lastCall.cacheWriteTokens ?? 0} written</dd></div></dl>}
          {engineStatus !== "ready" && <p className="settings-code">Check <code>ANTHROPIC_API_KEY</code> and <code>ANTHROPIC_MODEL</code> on the server. Never enter a key in the browser.</p>}
        </div>
        <div className="settings-section"><h3>Session only</h3><p>Your edit, bag, and shortlist stay in this browser tab. Requests and recent context are sent to Anthropic. Avoid sensitive information.</p><button className="secondary-button" onClick={() => setPanel("history")}><RotateCcw size={15} /> Revisit your edits</button><button className="secondary-button" onClick={resetSession}>Reset this session</button></div>
        <div className="settings-section"><h3>Brand asset uploads</h3><p>Planned for the next release. This release uses two configured brand packages with shared sample products.</p></div>
      </div>}

      {!selected && !order && panel === "history" && <div className="panel-content"><h2 id="dialog-title">Your point of view,<br />as it unfolds.</h2>{turns.length === 0 ? <div className="empty-state"><Sparkles size={30} /><h3>Every edit starts somewhere.</h3><button className="primary-button" onClick={() => { closeDialog(); openComposer(); }}>Start an edit <ArrowRight size={17} /></button></div> : <><div className="journey-list visual-journey">{[...turns].reverse().map(turn => <article key={turn.id} className={activeTurnId === turn.id ? "active" : ""}><div className="journey-thumbnails">{turn.experience.productIds.slice(0,3).map(id => <img key={id} src={imageUrl(productById(id)!.image)} alt={productById(id)!.name} />)}</div><h3>{turn.experience.title}</h3><p>{turn.message}</p>{turn.createdAt && <time dateTime={turn.createdAt}>{new Date(turn.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>}{turn.parentId && <small className="journey-branch">From {turns.find(parent => parent.id === turn.parentId)?.experience.title ?? "an earlier edit"}</small>}<div className="journey-actions"><button className="text-button" onClick={() => { setExperience(turn.experience); setActiveTurnId(turn.id); if (turn.preferences) setPreferences(turn.preferences); setLastCall(null); setFilter("All pieces"); setNotice(""); closeDialog(); document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" }); }}>Revisit & branch<ArrowRight size={15} /></button><label><input type="checkbox" aria-label={`Compare ${turn.experience.title}`} checked={compareIds.includes(turn.id)} disabled={!compareIds.includes(turn.id) && compareIds.length >= 2} onChange={event => setCompareIds(current => event.target.checked ? [...current, turn.id] : current.filter(id => id !== turn.id))} />Compare</label></div></article>)}</div>{compareIds.length === 2 && <section className="journey-comparison" aria-label="Compare edits">{compareIds.map(id => { const turn = turns.find(item => item.id === id); return turn && <div key={id}><h3>{turn.experience.title}</h3><p>{turn.experience.description}</p><ul>{turn.experience.productIds.map(productId => <li key={productId}>{productById(productId)!.name} · {money(productById(productId)!.price)}</li>)}</ul></div>; })}</section>}</>}</div>}

      {!selected && !order && panel === "saved" && <div className="panel-content"><h2 id="dialog-title">Worth coming<br />back to.</h2><p className="panel-intro">{saved.length} {saved.length === 1 ? "piece" : "pieces"} in your shortlist.</p>{saved.length === 0 ? <div className="empty-state"><Heart size={30} /><h3>A little room for possibility.</h3><p>Save a piece that catches your eye.</p><button className="primary-button" onClick={closeDialog}>Explore the collection <ArrowRight size={16} /></button></div> : <div className="saved-list">{saved.map(id => { const product = productById(id)!; return <div className="saved-row" key={id}><button className="saved-image" onClick={() => showProduct(product)}><ProductImage product={product} /></button><div><button className="saved-name" onClick={() => showProduct(product)}>{product.name}</button><p>{product.color} · {money(product.price)}</p><button className="text-button" onClick={() => showProduct(product)}>Choose size <ArrowRight size={14} /></button></div><IconButton label={`Unsave ${product.name}`} onClick={() => toggleSaved(id)}><X size={16} /></IconButton></div>; })}</div>}</div>}

      {!selected && !order && (panel === "cart" || panel === "checkout") && <div className="panel-content checkout-content"><h2 id="dialog-title">{panel === "checkout" ? "The final details." : "Good choices."}</h2><p className="panel-intro">{panel === "checkout" ? "A simulated checkout. No payment. No real order." : `${cartCount} ${cartCount === 1 ? "piece" : "pieces"} in your bag.`}</p>{cart.length === 0 ? <div className="empty-state"><ShoppingBag size={30} /><h3>Room for something good.</h3><p>Your next favorite is out there.</p><button className="primary-button" onClick={closeDialog}>Continue discovering <ArrowRight size={16} /></button></div> : <><div className="cart-lines">{cart.map(item => { const product = productById(item.productId)!; return <div className="cart-line" key={`${item.productId}-${item.size}`}><ProductImage product={product} /><div className="cart-line-info"><strong>{product.name}</strong><p>{product.color} / {item.size}</p><div className="quantity-control"><IconButton label={`Remove one ${product.name} size ${item.size}`} disabled={ordering} onClick={() => updateQuantity(item.productId, item.size, -1)}><Minus size={13} /></IconButton><span>{item.quantity}</span><IconButton label={`Add one ${product.name} size ${item.size}`} disabled={ordering || item.quantity >= 10} onClick={() => updateQuantity(item.productId, item.size, 1)}><Plus size={13} /></IconButton></div></div><span className="cart-line-price">{money(product.price * item.quantity)}</span></div>; })}</div><div className="order-totals"><div><span>Subtotal</span><span>{money(totals!.subtotal)}</span></div><div><span>Delivery</span><span>{totals!.shipping === 0 ? "On us" : money(totals!.shipping)}</span></div><div><span>Tax</span><span>Not applied in demo</span></div><div className="total-row"><strong>Total</strong><strong>{money(totals!.total)}</strong></div></div>{panel === "cart" ? <><div className="delivery-note"><Truck size={17} />{totals!.shipping === 0 ? "Your order qualifies for complimentary delivery." : `${money(150 - totals!.subtotal)} away from complimentary delivery.`}</div><button className="primary-button" onClick={() => { setCheckoutAccepted(false); setCheckoutError(""); setPanel("checkout"); }}>Continue to checkout <ArrowRight size={17} /></button><button className="secondary-button" onClick={closeDialog}>Keep discovering</button></> : <form onSubmit={placeOrder}><div className="demo-address"><span className="eyebrow">DEMO DELIVERY DETAILS</span><strong>Alex Example</strong><span>123 Sample Street, Demo City, 00000</span><span>shopper@example.com</span></div><div className="demo-payment"><ShoppingBag size={20} /><div><strong>Simulated payment</strong><span>No card details or personal information required.</span></div><Check size={17} /></div><label className="checkout-consent"><input type="checkbox" checked={checkoutAccepted} onChange={event => setCheckoutAccepted(event.target.checked)} required disabled={ordering} /><span>I understand this is a demo. Nothing will be charged or shipped.</span></label>{checkoutError && <p role="alert" className="field-error">{checkoutError}</p>}<button type="submit" className="primary-button" disabled={!checkoutAccepted || ordering}>{ordering ? <><LoaderCircle size={18} className="spin" /> Placing demo order</> : <>Place demo order · {money(totals!.total)} <ArrowRight size={17} /></>}</button><button type="button" className="secondary-button" disabled={ordering} onClick={() => setPanel("cart")}><ArrowLeft size={15} /> Back to bag</button></form>}</>}</div>}

      {order && <div className="panel-content order-confirmation"><CircleCheck size={54} strokeWidth={1} /><div className="eyebrow">A GOOD CHOICE, CONFIRMED.</div><h2 id="dialog-title">Consider it yours.<br /><em>Just for this demo.</em></h2><p>Your simulated order is complete. Nothing has been charged, and nothing will be shipped.</p><div className="confirmation-reference"><span>DEMO ORDER</span><strong>{order.id}</strong></div><div className="confirmation-lines">{order.lines.map((line, index) => <div key={index}><span>{line.name}<small>{line.size} · Qty {line.quantity}</small></span><strong>{money(line.price * line.quantity)}</strong></div>)}</div><div className="confirmation-total"><span>Total</span><strong>{money(order.total)}</strong></div><p className="confirmation-note">This confirmation is not a receipt and is not retained as a real order.</p><button className="primary-button" onClick={closeDialog}>Back to discovering <ArrowRight size={17} /></button></div>}
    </div></div>}
    </div>
    {compositionSceneOpen && <CompositionScene brand={brand.name} images={[...new Set([experience?.sections?.find(section => section.type === "editorial")?.imageId ?? brand.hero, brand.hero, "studio", "linen-shirt"])].slice(0, 3)} prompt={pendingPrompt} progress={compositionProgress} onMinimize={() => setCompositionMinimized(true)} onCancel={cancelComposition} />}
  </div>;
}