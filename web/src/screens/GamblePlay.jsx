import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api.js';
import { CHANCE_PER_WORD } from '../../config/gambling.js';

// Mengetik 20 kata; hasil akhir dihitung & dibayar server saat "finish".
export default function GamblePlay({ session, onResult, onFail }) {
  const { id, words, seconds } = session;
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const [ok, setOk] = useState(0);
  const [left, setLeft] = useState(seconds * 1000);
  const inputRef = useRef(null);
  const st = useRef({ idx: 0, typed: '', ok: 0, done: false });
  const startAt = useRef(Date.now());

  const finish = async () => {
    const s = st.current;
    if (s.done) return;
    s.done = true;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const r = await api.gambleFinish(id, s.ok);
        onResult(r);
        return;
      } catch (e) {
        if (attempt === 2 || (e.status && e.status < 500 && e.status !== 400)) return onFail(e);
        await new Promise((res) => setTimeout(res, 1200));
      }
    }
    return undefined;
  };

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
    const endAt = startAt.current + seconds * 1000;
    const t = setInterval(() => {
      const rest = endAt - Date.now();
      setLeft(Math.max(0, rest));
      if (rest <= 0) finish();
    }, 100);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const word = words[Math.min(idx, words.length - 1)];
  const bad = typed.length > 0 && !word.startsWith(typed);

  const onChange = (e) => {
    const s = st.current;
    if (s.done) return;
    const raw = e.target.value.toLowerCase().replace(/[^a-z ]/g, '');
    const hasSpace = raw.includes(' ');
    const body = hasSpace ? raw.split(' ')[0] : raw;
    if (hasSpace) {
      s.typed = '';
      setTyped('');
      if (body.length === 0) return;
      if (body === words[s.idx]) {
        s.ok++;
        setOk(s.ok);
      }
      s.idx++;
      setIdx(s.idx);
      if (s.idx >= words.length) finish();
      return;
    }
    s.typed = raw;
    setTyped(raw);
  };

  return (
    <>
      <div className="chips">
        <span className="chip practice-timer">{(left / 1000).toFixed(1)}s</span>
        <span className="chip">{Math.min(idx, words.length)} / {words.length} kata</span>
        <span className="chip">peluang {Math.min(100, ok * CHANCE_PER_WORD)}%</span>
      </div>
      <div className="arena practice-arena">
        <motion.div
          key={idx}
          className={`word-current ${bad ? 'bad' : ''}`}
          initial={{ y: 18, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 600, damping: 26 }}
        >
          {word.split('').map((ch, i) => (
            <span key={i} className={i < typed.length ? (typed[i] === ch ? 'ok' : 'err') : ''}>{ch}</span>
          ))}
        </motion.div>
        <div className="word-next">
          {words.slice(idx + 1, idx + 5).map((w, i) => (
            <span key={`${idx}-${i}`}>{w}</span>
          ))}
        </div>
      </div>
      <div className="sticky-actions">
        <div className={`typebox ${bad ? 'bad' : ''}`}>
          <input
            ref={inputRef}
            value={typed}
            onChange={onChange}
            placeholder="ketik kata lalu spasi"
            inputMode="text"
            enterKeyHint="send"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-label="Ketik kata"
          />
        </div>
      </div>
    </>
  );
}
