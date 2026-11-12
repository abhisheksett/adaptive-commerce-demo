"use client";

import { createContext, Fragment, useContext, useEffect, useRef, useState } from "react";
import { A2uiSurface, createComponentImplementation, type ReactCatalogComponent } from "@a2ui/react";
import { Catalog, MessageProcessor, type ActionPayload, type ComponentContext, type SurfaceModel } from "@a2ui/web_core/v0_9";
import { ArrowRight, Heart, Sparkles } from "lucide-react";
import { imageUrl, money, productById, type Experience, type Product } from "@/lib/commerce";
import { discoveryApis, discoveryCatalogId, discoveryMessages } from "@/lib/discovery";

type DiscoveryProps = {
  experience: Experience;
  saved: string[];
  bagIds: string[];
  loading: boolean;
  onRefine: (prompt: string) => void;
  onProduct: (product: Product) => void;
  onSave: (id: string) => void;
  onLook: (ids: string[], title: string) => void;
};
const ShoppingContext = createContext<Pick<DiscoveryProps, "saved" | "loading" | "bagIds">>({ saved: [], bagIds: [], loading: false });

function send(context: ComponentContext, name: string, values: Record<string, string>) {
  void context.dispatchAction({ event: { name, context: values } });
}

function ProductTile({ id, context }: { id: string; context: ComponentContext }) {
  const product = productById(id)!;
  const { saved, loading, bagIds } = useContext(ShoppingContext);
  return <article className="product-card discovery-product" data-product-id={id}>
    <div className="product-photo">
      <button className="product-image-button" aria-label={`View ${product.name}`} onClick={() => send(context, "view_product", { productId: id })}><img src={imageUrl(product.image)} alt={`${product.name} in ${product.color}. Illustrative photography.`} loading="lazy" /></button>
      {bagIds.includes(id) && <span className="product-badge">IN YOUR BAG</span>}
      <button className={`icon-button save-product ${saved.includes(id) ? "is-saved" : ""}`} aria-label={`${saved.includes(id) ? "Unsave" : "Save"} ${product.name}`} title={`${saved.includes(id) ? "Unsave" : "Save"} ${product.name}`} aria-pressed={saved.includes(id)} onClick={() => send(context, "save_product", { productId: id })}><Heart size={18} fill={saved.includes(id) ? "currentColor" : "none"} /></button>
    </div>
    <div className="product-meta"><button onClick={() => send(context, "view_product", { productId: id })}>{product.name}</button><span>{money(product.price)}</span></div>
    <div className="product-color"><span className="swatch" style={{ backgroundColor: product.swatch }} />{product.color}<span className="product-audience">{product.audience === "Everyone" ? "Unisex" : product.audience}</span></div>
    <button className="text-button style-piece" disabled={loading} onClick={() => send(context, "refine", { prompt: `Build a complete look around ${product.name} (${id}), keeping my previous preferences.` })}><Sparkles size={14} />Style this piece <ArrowRight size={14} /></button>
  </article>;
}

const implementations = [
  createComponentImplementation(discoveryApis.Discovery, ({ props, buildChild }) => <div className="discovery-sequence">{Array.isArray(props.children) && props.children.map(child => <Fragment key={typeof child === "string" ? child : child.id}>{typeof child === "string" ? buildChild(child) : buildChild(child.id, child.basePath)}</Fragment>)}</div>),
  createComponentImplementation(discoveryApis.Editorial, ({ props }) => <section className="discovery-editorial" aria-label={props.title}><img data-parallax src={imageUrl(props.imageId)} alt="A considered styling perspective. Illustrative photography." /><div><span className="eyebrow light">A DIFFERENT POINT OF VIEW</span><h2>{props.title}</h2><p>{props.body}</p></div></section>),
  createComponentImplementation(discoveryApis.Question, ({ props, context }) => {
    const { loading } = useContext(ShoppingContext);
    return <section className="discovery-question" aria-label={props.title}><div className="discovery-section-heading"><span className="eyebrow">LET YOUR INSTINCT LEAD</span><h2>{props.title}</h2>{props.body && <p>{props.body}</p>}</div><div className="discovery-choices" role="group" aria-label={props.title}>{props.options.map((option, index) => <button key={`${option.label}-${index}`} disabled={loading} onClick={() => send(context, "refine", { prompt: option.prompt })}>{option.imageId && <img src={imageUrl(option.imageId)} alt="" loading="lazy" />}<span>{option.label}<ArrowRight size={20} /></span></button>)}</div></section>;
  }),
  createComponentImplementation(discoveryApis.ProductSelection, ({ props, context }) => <section className={`discovery-selection ${props.presentation}`} aria-label={props.title}><div className="discovery-section-heading"><span className="eyebrow">THE PIECES TO START WITH</span><h2>{props.title}</h2>{props.body && <p>{props.body}</p>}</div><div className="discovery-product-grid">{props.productIds.map(id => <ProductTile key={id} id={id} context={context} />)}</div></section>),
  createComponentImplementation(discoveryApis.StyledLook, ({ props, context }) => <section className="discovery-look" aria-label={props.title}><div className="discovery-section-heading"><span className="eyebrow">SEE IT COME TOGETHER</span><h2>{props.title}</h2><p>{props.body}</p><div className="look-total"><span>{props.productIds.length} pieces, one point of view</span><strong>{money(props.productIds.reduce((total, id) => total + productById(id)!.price, 0))}</strong><small>Before delivery</small></div><button className="secondary-button" onClick={() => send(context, "edit_look", { productIds: JSON.stringify(props.productIds), title: props.title })}>Make this look yours<ArrowRight size={17} /></button></div><div className="discovery-product-grid">{props.productIds.map(id => <ProductTile key={id} id={id} context={context} />)}</div></section>),
  createComponentImplementation(discoveryApis.Comparison, ({ props, context }) => <section aria-label={props.title}><div className="discovery-section-heading"><span className="eyebrow">A CLOSER LOOK</span><h2>{props.title}</h2></div><div className="discovery-comparison">{props.productIds.map(id => { const product = productById(id)!; return <div key={id}><ProductTile id={id} context={context} /><dl><dt>Material & fit</dt><dd>{product.material}</dd><dt>Sizes</dt><dd>{product.sizes.join(", ")}</dd></dl></div>; })}</div></section>),
];
const catalog = new Catalog<ReactCatalogComponent>(discoveryCatalogId, "v0.9", implementations);

export default function DiscoverySurface(props: DiscoveryProps) {
  const latest = useRef(props);
  const [surface, setSurface] = useState<SurfaceModel<ReactCatalogComponent>>();
  const [error, setError] = useState(false);
  useEffect(() => { latest.current = props; });
  useEffect(() => {
    const processor = new MessageProcessor<ReactCatalogComponent>([catalog], (action: ActionPayload) => {
      if (action.name === "refine") {
        const prompt = action.context.prompt;
        if (typeof prompt === "string" && prompt.trim() && prompt.length <= 500 && !latest.current.loading) latest.current.onRefine(prompt);
      } else if (action.name === "edit_look" && !latest.current.loading) {
        try {
          const ids: unknown = JSON.parse(String(action.context.productIds));
          if (!Array.isArray(ids) || ids.length < 2 || ids.length > 4 || ids.some(id => typeof id !== "string" || !productById(id))) return;
          const section = latest.current.experience.sections?.find(section => section.type === "look" && section.productIds.join(",") === ids.join(","));
          if (section) latest.current.onLook(ids, section.title);
        } catch {}
      } else {
        const product = productById(String(action.context.productId));
        if (!product) return;
        if (action.name === "view_product") latest.current.onProduct(product);
        if (action.name === "save_product") latest.current.onSave(product.id);
      }
    });
    try {
      processor.processMessages(discoveryMessages(props.experience));
      setSurface(processor.getSurface("discovery"));
      setError(false);
    } catch { setError(true); }
    return () => processor.dispose();
  }, [props.experience]);
  if (error) return <p className="notice" role="alert">This edit could not be displayed. Your bag and shortlist are unchanged. Please try another direction.</p>;
  return <ShoppingContext.Provider value={{ saved: props.saved, bagIds: props.bagIds, loading: props.loading }}><div className="a2ui-discovery" data-a2ui-version="v0.9">{surface && <A2uiSurface surface={surface} />}</div></ShoppingContext.Provider>;
}