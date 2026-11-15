// Gambar boleh berformat apa saja (webp, png, jpg, gif, avif, svg).
// Jika file di config tidak ditemukan, otomatis dicoba nama yang sama dengan format lain,
// jadi mengganti png -> webp cukup dengan mengganti file di folder public/, tanpa mengubah config.
export const IMAGE_EXTS = ['webp', 'png', 'jpg', 'jpeg', 'gif', 'avif', 'svg'];

const found = new Map(); // src asli -> src yang berhasil dimuat

export function imageCandidates(src) {
  if (!src || typeof src !== 'string') return [];
  if (/^(data:|blob:|https?:)/i.test(src)) return [src];
  const [path, query = ''] = src.split('?');
  const m = /\.([a-z0-9]+)$/i.exec(path);
  const ext = m ? m[1].toLowerCase() : '';
  const base = m ? path.slice(0, -m[0].length) : path;
  const q = query ? `?${query}` : '';
  const list = [];
  if (found.has(src)) list.push(found.get(src));
  list.push(src);
  for (const e of IMAGE_EXTS) if (e !== ext) list.push(`${base}.${e}${q}`);
  return [...new Set(list)];
}

export function rememberImage(src, ok) {
  found.set(src, ok);
}

/** Cari alamat gambar yang benar-benar ada (dipakai untuk ikon tab browser). */
export function probeImage(src) {
  const list = imageCandidates(src);
  return new Promise((resolve) => {
    let i = 0;
    const next = () => {
      if (i >= list.length) return resolve(null);
      const url = list[i++];
      const img = new Image();
      img.onload = () => {
        rememberImage(src, url);
        resolve(url);
      };
      img.onerror = next;
      img.src = url;
    };
    next();
  });
}
