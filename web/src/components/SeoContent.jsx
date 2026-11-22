import { SEO_SECTIONS } from '../../config/seo.js';

/** Penjelasan singkat AduYapping (bagian bawah halaman awal, terbaca pengunjung dan crawler). */
export default function SeoContent() {
  return (
    <section className="seo-about" aria-label="Tentang AduYapping">
      {SEO_SECTIONS.map((s) => (
        <article key={s.id} className="seo-block">
          <h2>{s.heading}</h2>
          {(s.paragraphs || []).map((t) => (
            <p key={t}>{t}</p>
          ))}
          {s.list ? (
            s.ordered ? (
              <ol>{s.list.map((t) => <li key={t}>{t}</li>)}</ol>
            ) : (
              <ul>{s.list.map((t) => <li key={t}>{t}</li>)}</ul>
            )
          ) : null}
        </article>
      ))}
    </section>
  );
}
