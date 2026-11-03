import { useState } from "react";
import { cn } from "@/lib/utils";

type ProductImageProps = {
  src: string | null;
  className?: string;
};

/** Product photo, or a blank card when there is no image or it fails to load. */
export default function ProductImage({ src, className }: ProductImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return <div aria-hidden="true" className={cn("bg-slate-100", className)} />;
  }
  return <img src={src} alt="" loading="lazy" decoding="async" onError={() => setFailedSrc(src)} className={cn("object-cover", className)} />;
}
