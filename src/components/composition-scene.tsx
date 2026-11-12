"use client";

import { useEffect, useRef } from "react";
import { LoaderCircle, Minimize2, X } from "lucide-react";
import { imageUrl } from "@/lib/commerce";

type Props = {
  brand: string;
  images: string[];
  prompt: string;
  progress: string;
  onMinimize: () => void;
  onCancel: () => void;
};

export default function CompositionScene({ brand, images, prompt, progress, onMinimize, onCancel }: Props) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const browseRef = useRef<HTMLButtonElement>(null);
  const stage = progress.startsWith("Checking") ? 2 : /composing|Refining/.test(progress) ? 1 : 0;

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    browseRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected && previousFocus !== document.body && !previousFocus.matches(":disabled") && !previousFocus.closest("[inert]")) previousFocus.focus({ preventScroll: true });
      else document.getElementById("reopen-composition")?.focus({ preventScroll: true });
    };
  }, []);

  return <div ref={sceneRef} className="composition-scene" role="dialog" aria-modal="true" aria-labelledby="composition-title" aria-describedby="composition-request" onKeyDown={event => {
    if (event.key === "Escape") { event.preventDefault(); onMinimize(); }
    if (event.key === "Tab") {
      const controls = sceneRef.current?.querySelectorAll<HTMLButtonElement>("button");
      const first = controls?.[0];
      const last = controls?.[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }}>
    <div className="composition-landscape" aria-hidden="true"><img src={imageUrl(images[0])} alt="" /><div /></div>
    <div className="composition-atmosphere" aria-hidden="true" />
    <div className="composition-scene-header"><span>{brand}</span><button ref={browseRef} onClick={onMinimize}><Minimize2 size={17} />Keep browsing</button></div>
    <div className="composition-studies" aria-hidden="true">{images.slice(1, 3).map((image, index) => <div key={image} className={`composition-study study-${index}`}><img src={imageUrl(image)} alt="" /></div>)}</div>
    <div className="composition-scene-content">
      <span className="composition-kicker">A POINT OF VIEW, UNIQUELY YOURS</span>
      <h2 id="composition-title">A new<br /><em>perspective.</em></h2>
      <p id="composition-request">{prompt}</p>
      <div className="composition-live" role="status" aria-live="polite"><LoaderCircle size={17} className="spin" /><span>{progress}</span></div>
      <ol className="composition-stages" aria-label="Composition progress">{["Connecting", "Composing", "Checking"].map((label, index) => <li key={label} className={index <= stage ? "reached" : ""} aria-current={index === stage ? "step" : undefined}><span /><small>{label}</small></li>)}</ol>
    </div>
    <div className="composition-scene-footer"><span>{brand} / THE PERSONAL EDIT</span><button onClick={onCancel}><X size={16} />Cancel edit</button></div>
  </div>;
}