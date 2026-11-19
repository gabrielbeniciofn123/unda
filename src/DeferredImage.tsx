import { useState, type ImgHTMLAttributes } from 'react';

type Props = ImgHTMLAttributes<HTMLImageElement> & { src: string };

const unavailableImage = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#13272c"/><stop offset="1" stop-color="#111415"/></linearGradient></defs><path fill="url(#g)" d="M0 0h800v600H0z"/><g fill="none" stroke="#81999b" stroke-width="2"><rect x="373" y="252" width="54" height="42" rx="4"/><path d="m374 286 15-16 12 12 10-9 15 15"/><circle cx="411" cy="264" r="4"/></g><text x="400" y="329" text-anchor="middle" fill="#b7c7c9" font-family="Arial,sans-serif" font-size="15">Imagem indisponível</text></svg>')}`;

export default function DeferredImage({ src, srcSet, loading = 'lazy', decoding = 'async', alt = '', onError, ...props }: Props) {
  const [failedSource, setFailedSource] = useState<{ src: string; srcSet?: string }>();
  const failed = failedSource?.src === src && failedSource.srcSet === srcSet;

  return (
    <img
      {...props}
      alt={failed && alt ? `Imagem indisponível: ${alt}` : alt}
      loading={loading}
      decoding={decoding}
      srcSet={failed ? undefined : srcSet}
      src={failed ? unavailableImage : src}
      onError={event => {
        if (!failed) setFailedSource({ src, srcSet });
        onError?.(event);
      }}
    />
  );
}
