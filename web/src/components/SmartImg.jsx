import { useEffect, useMemo, useState } from 'react';
import { imageCandidates, rememberImage } from '../lib/img.js';

/**
 * <img> yang tahan beda format: kalau file di `src` tidak ada, coba nama sama dengan
 * format lain (webp/png/jpg/...). `onFail` dipanggil jika semua format gagal.
 */
export default function SmartImg({ src, onFail, alt = '', ...rest }) {
  const list = useMemo(() => imageCandidates(src), [src]);
  const [i, setI] = useState(0);
  useEffect(() => setI(0), [list]);
  if (!list.length) return null;
  return (
    <img
      {...rest}
      alt={alt}
      src={list[Math.min(i, list.length - 1)]}
      onLoad={() => rememberImage(src, list[i])}
      onError={() => {
        if (i + 1 < list.length) setI(i + 1);
        else if (onFail) onFail();
      }}
    />
  );
}
