"use client";

import { useState } from "react";
import { ArrowRight, LockKeyhole, RefreshCw, ShoppingBag } from "lucide-react";
import { imageUrl, money, productById, type CartItem } from "@/lib/commerce";

export default function LookEditor({ ids, title, bagIds, onReplace, onAdd }: {
  ids: string[];
  title: string;
  bagIds: string[];
  onReplace: (prompt: string, lockedIds: string[], replaceIds: string[]) => void;
  onAdd: (items: CartItem[]) => void;
}) {
  const [sizes, setSizes] = useState<Record<string, string>>({});
  const [included, setIncluded] = useState(ids.filter(id => !bagIds.includes(id)));
  const [locked, setLocked] = useState(ids);
  const [error, setError] = useState("");
  const pieces = ids.map(id => productById(id)!);
  const chosen = pieces.filter(product => included.includes(product.id));
  function add() {
    if (!chosen.length) { setError("Choose at least one piece."); return; }
    if (chosen.some(product => !sizes[product.id] && product.sizes.length > 1)) { setError("Choose a size for every selected piece."); return; }
    onAdd(chosen.map(product => ({ productId: product.id, size: sizes[product.id] || product.sizes[0], quantity: 1 })));
  }
  return <div className="panel-content look-editor"><span className="eyebrow">YOUR LOOK, YOUR CHOICES</span><h2 id="dialog-title">{title}</h2>
    <div className="look-editor-lines">{pieces.map(product => <article className="look-editor-line" key={product.id}>
      <img src={imageUrl(product.image)} alt={`${product.name}, ${product.color}`} />
      <div><label className="look-include"><input type="checkbox" checked={included.includes(product.id)} onChange={event => { setError(""); setIncluded(current => event.target.checked ? [...current, product.id] : current.filter(id => id !== product.id)); }} />{product.name}</label><p>{product.color} · {money(product.price)}</p>{bagIds.includes(product.id) && <p className="already-chosen">Already in your bag</p>}
        <label className="look-size">Size<select aria-label={`Size for ${product.name}`} value={sizes[product.id] || (product.sizes.length === 1 ? product.sizes[0] : "")} onChange={event => { setSizes(current => ({ ...current, [product.id]: event.target.value })); setError(""); }}><option value="">Choose size</option>{product.sizes.map(size => <option key={size}>{size}</option>)}</select></label>
        <label className="look-lock"><input type="checkbox" checked={locked.includes(product.id)} onChange={event => setLocked(current => event.target.checked ? [...current, product.id] : current.filter(id => id !== product.id))} /><LockKeyhole size={13} />Keep in next look</label>
        <button className="text-button" onClick={() => onReplace(`Replace ${product.name} in this look with a different catalog piece. Preserve the locked pieces and my explicit preferences.`, locked.filter(id => id !== product.id), [product.id])}><RefreshCw size={14} />Find an alternative</button>
      </div>
    </article>)}</div>
    {error && <p className="field-error" role="alert">{error}</p>}
    <div className="look-editor-total"><span>{chosen.length} selected · before delivery</span><strong>{money(chosen.reduce((total, product) => total + product.price, 0))}</strong></div>
    <button className="primary-button" onClick={add}><ShoppingBag size={17} />Add selected pieces</button>
    <button className="secondary-button" disabled={locked.length === ids.length} onClick={() => onReplace("Rework the unlocked pieces of this outfit around the locked pieces, respecting my preferences.", locked, ids.filter(id => !locked.includes(id)))}>Rework unlocked pieces<ArrowRight size={16} /></button>
  </div>;
}