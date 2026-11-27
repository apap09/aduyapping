import { randomInt } from 'node:crypto';
import { getSql } from './db.js';
import { publicUser, send, fail } from './auth.js';
import { pickWords } from '../../config/practiceWords.js';
import { CHANCE_PER_WORD, MAX_BET, MIN_BET, MAX_CHARS_PER_SEC, MULTIPLIERS, WORD_COUNT } from '../../config/gambling.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const INT_MAX = 2147483647;

/**
 * Kata untuk satu putaran: dibuat Gemini jika GEMINI_API_KEY diisi di Vercel,
 * selain itu (atau jika gagal / kurang) memakai daftar kata di config/practiceWords.js.
 */
async function makeWords(n) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return pickWords(n);
  const model = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
  const prompt =
    `Berikan ${n + 10} kata bahasa Indonesia yang acak dan umum dipakai sehari-hari. ` +
    'Aturan: huruf kecil semua, tanpa tanda baca, tanpa angka, tanpa spasi, satu kata per item, ' +
    'panjang 3 sampai 9 huruf, tidak boleh ada kata yang sama. Balas hanya berupa JSON array berisi string.';
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 1.2 },
        }),
        signal: ctrl.signal,
      },
    );
    if (!res.ok) throw new Error(`gemini ${res.status}`);
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '[]';
    let list = JSON.parse(text);
    if (!Array.isArray(list)) list = Object.values(list).flat();
    const seen = new Set();
    const words = [];
    for (const raw of list) {
      const w = String(raw ?? '').toLowerCase().trim();
      if (/^[a-z]{3,9}$/.test(w) && !seen.has(w)) {
        seen.add(w);
        words.push(w);
      }
    }
    if (words.length >= n) return words.slice(0, n);
    return words.concat(pickWords(n).filter((w) => !seen.has(w))).slice(0, n);
  } catch (err) {
    console.error('Kata Gambling dari Gemini gagal, pakai kata cadangan:', err && err.message);
    return pickWords(n);
  } finally {
    clearTimeout(timer);
  }
}

async function loadUser(sql, id) {
  const rows = await sql`select id, username, coins, wins, equipped_skin from users where id = ${id} limit 1`;
  const owned = await sql`select skin_id from user_skins where user_id = ${id}`;
  return publicUser(rows[0], owned.map((s) => s.skin_id));
}

const resultOf = (row) => ({
  won: !!row.won,
  chance: row.chance,
  correct: row.correct,
  payout: row.payout,
  bet: row.bet,
  mult: row.mult,
});

/** POST { action:'gamble_start', bet, mult } -> potong koin, buat kata, mulai putaran. */
async function start(res, auth, body) {
  const bet = Number(body.bet);
  const opt = MULTIPLIERS.find((m) => m.mult === Number(body.mult));
  if (!Number.isInteger(bet) || bet < MIN_BET || bet > MAX_BET || !opt) {
    return send(res, 400, { error: 'Taruhan tidak valid.' });
  }
  const sql = getSql();
  const have = await sql`select coins from users where id = ${auth.sub} and not banned limit 1`;
  if (have.length === 0) return send(res, 401, { error: 'Akun tidak ditemukan.' });
  if (have[0].coins < bet) return send(res, 402, { error: 'Koin kamu belum cukup.', user: await loadUser(sql, auth.sub) });

  const words = await makeWords(WORD_COUNT);
  // Satu perintah atomik: potong koin hanya jika masih cukup, lalu catat putaran.
  const made = await sql`
    with paid as (
      update users set coins = coins - ${bet}
      where id = ${auth.sub} and coins >= ${bet} and not banned
      returning id
    )
    insert into gamble_sessions (user_id, bet, mult, duration_s, words)
    select id, ${bet}, ${opt.mult}, ${opt.seconds}, ${words}::text[] from paid
    returning id`;
  const user = await loadUser(sql, auth.sub);
  if (made.length === 0) return send(res, 402, { error: 'Koin kamu belum cukup.', user });
  return send(res, 200, { id: made[0].id, words, seconds: opt.seconds, bet, mult: opt.mult, user });
}

/** POST { action:'gamble_finish', id, correct } -> server menentukan hasil roulette dan langsung membayar. */
async function finish(res, auth, body) {
  const id = String(body.id || '');
  const claimed = Number(body.correct);
  if (!UUID.test(id) || !Number.isInteger(claimed) || claimed < 0 || claimed > WORD_COUNT) {
    return send(res, 400, { error: 'Data tidak valid.' });
  }
  const sql = getSql();
  const rows = await sql`
    select bet, mult, duration_s, words, status, correct, chance, won, payout,
           extract(epoch from (now() - created_at)) * 1000 as elapsed_ms
    from gamble_sessions where id = ${id} and user_id = ${auth.sub} limit 1`;
  if (rows.length === 0) return send(res, 404, { error: 'Putaran tidak ditemukan.' });
  const s = rows[0];
  if (s.status === 'done') return send(res, 200, { result: resultOf(s), user: await loadUser(sql, auth.sub), repeat: true });

  const elapsed = Number(s.elapsed_ms);
  // Selesai lebih awal hanya boleh jika semua kata sudah diketik.
  if (claimed < WORD_COUNT && elapsed < s.duration_s * 1000 - 2000) {
    return send(res, 400, { error: 'Waktu belum habis.' });
  }

  // Batas kecepatan mengetik: potong klaim yang mustahil (jumlah karakter terpendek yang harus diketik).
  const lens = s.words.map((w) => w.length + 1).sort((a, b) => a - b);
  const budget = (MAX_CHARS_PER_SEC * elapsed) / 1000 + 6;
  let correct = 0;
  let used = 0;
  while (correct < claimed && used + lens[correct] <= budget) used += lens[correct++];

  const chance = Math.min(100, correct * CHANCE_PER_WORD);
  const won = randomInt(0, 100) < chance;
  const payout = won ? s.bet * s.mult : 0;

  // Tutup putaran dan bayar dalam satu perintah atomik, jadi tidak mungkin dibayar dua kali.
  const done = await sql`
    with closed as (
      update gamble_sessions
      set status = 'done', finished_at = now(), correct = ${correct}, chance = ${chance}, won = ${won}, payout = ${payout}
      where id = ${id} and user_id = ${auth.sub} and status = 'typing'
      returning payout
    ),
    paid as (
      update users set coins = least(coins::bigint + (select payout from closed), ${INT_MAX})
      where id = ${auth.sub} and exists (select 1 from closed)
      returning id
    )
    select count(*)::int as n from closed`;
  if (!done[0].n) {
    const again = await sql`select bet, mult, correct, chance, won, payout from gamble_sessions where id = ${id} limit 1`;
    return send(res, 200, { result: resultOf(again[0]), user: await loadUser(sql, auth.sub), repeat: true });
  }
  return send(res, 200, {
    result: { won, chance, correct, payout, bet: s.bet, mult: s.mult },
    user: await loadUser(sql, auth.sub),
  });
}

/** Dipanggil dari api/shop/buy.js untuk action yang berawalan "gamble_" (menghemat jatah 12 Vercel Functions). */
export async function handleGamble(res, auth, body) {
  try {
    if (body.action === 'gamble_start') return await start(res, auth, body);
    if (body.action === 'gamble_finish') return await finish(res, auth, body);
    return send(res, 400, { error: 'Aksi tidak dikenal.' });
  } catch (err) {
    return fail(res, err);
  }
}
