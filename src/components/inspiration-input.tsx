"use client";

import { useRef, useState } from "react";
import { ImagePlus, LoaderCircle, X } from "lucide-react";

export type Inspiration = { mediaType: "image/jpeg"; data: string };

export default function InspirationInput({ value, onChange, disabled }: { value: Inspiration | null; onChange: (value: Inspiration | null) => void; disabled: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const generation = useRef(0);
  async function load(file?: File) {
    if (!file) return;
    const request = ++generation.current;
    setError(""); setBusy(true);
    let bitmap: ImageBitmap | undefined;
    try {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10000000) throw new Error("Choose a JPEG, PNG or WebP under 10 MB.");
      bitmap = await createImageBitmap(file);
      if (bitmap.width * bitmap.height > 24000000) throw new Error("Choose a photo under 24 megapixels.");
      const ratio = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * ratio)); canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Image processing is unavailable in this browser.");
      context.fillStyle = "#ffffff"; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL("image/jpeg", 0.78).split(",")[1];
      if (data.length > 930000) throw new Error("This photo is too detailed. Choose a smaller image.");
      if (request === generation.current) onChange({ mediaType: "image/jpeg", data });
    } catch (error) { if (request === generation.current) setError(error instanceof Error ? error.message : "Unable to read this photo."); }
    finally { bitmap?.close(); if (request === generation.current) setBusy(false); if (inputRef.current) inputRef.current.value = ""; }
  }
  return <div className="inspiration-input">
    <p className="privacy-note">Choose a clothing reference you have permission to share. On submission, the resized photo is sent to Anthropic. It is not saved in your journey or session storage. Avoid faces and personal information.</p>
    <label className="consent-row"><input type="checkbox" checked={consent} disabled={disabled || busy} onChange={event => { setConsent(event.target.checked); if (!event.target.checked) { generation.current += 1; onChange(null); } }} />I agree to send this reference with my next request.</label>
    <input ref={inputRef} className="sr-only" type="file" aria-label="Choose inspiration photo" accept="image/jpeg,image/png,image/webp" disabled={!consent || disabled || busy} onChange={event => void load(event.target.files?.[0])} />
    {value ? <div className="inspiration-preview"><img src={`data:image/jpeg;base64,${value.data}`} alt="Your clothing reference" /><button className="icon-button" aria-label="Remove inspiration photo" title="Remove inspiration photo" disabled={disabled} onClick={() => { generation.current += 1; onChange(null); }}><X size={18} /></button></div> : <button className="secondary-button" disabled={!consent || disabled || busy} onClick={() => inputRef.current?.click()}>{busy ? <LoaderCircle size={18} className="spin" /> : <ImagePlus size={18} />}Choose photo</button>}
    {error && <p role="alert" className="field-error">{error}</p>}
  </div>;
}