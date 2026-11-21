import { ImageOff } from 'lucide-react';
import { useState } from 'react';

function photoSource(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  const base = import.meta.env.VITE_API_ASSET_URL || import.meta.env.VITE_API_URL || window.location.origin;
  return new URL('/' + url.replace(/^\/+/, ''), new URL(base, window.location.origin)).href;
}

export default function ComplaintPhoto({ url, alt }: { url: string; alt: string }) {
  const src = photoSource(url);
  const [failed, setFailed] = useState<string>();
  if (failed === src) {
    return <p className="flex min-h-24 items-center justify-center gap-2 rounded-lg border border-line bg-paper p-3 text-sm text-muted"><ImageOff size={18} /> Photo unavailable</p>;
  }
  return <a href={src} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-line bg-paper">
    <img alt={alt} className="max-h-72 w-full object-contain" loading="lazy" src={src} onError={() => setFailed(src)} />
  </a>;
}
