import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';
import { Confetti, CountUp } from './fx.jsx';
import { playSound, stopSound } from '../lib/sound.js';

const R = 100;
const SPIN_MS = 5200;

function arc(a0, a1) {
  const p = (a) => {
    const r = ((a - 90) * Math.PI) / 180;
    return [R + R * Math.cos(r), R + R * Math.sin(r)];
  };
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  return `M${R} ${R} L${x0} ${y0} A${R} ${R} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1} Z`;
}

// Hasil sudah diputuskan server; roda hanya menampilkannya.
export default function RouletteWheel({ result, onDone, onExit }) {
  const { won, chance, payout, mult } = result;
  const [revealed, setRevealed] = useState(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const split = chance * 3.6;

  const turn = useMemo(() => {
    let lo = 0;
    let hi = 360;
    if (won) hi = split;
    else lo = split;
    const pad = Math.min(6, (hi - lo) / 4);
    const phi = lo + pad + Math.random() * (hi - lo - pad * 2);
    return 360 * 6 + (360 - phi);
  }, [won, split]);

  useEffect(() => {
    const t = setTimeout(() => {
      setRevealed(true);
      playSound(won ? 'win' : 'lose');
      doneRef.current();
    }, SPIN_MS + 150);
    return () => {
      clearTimeout(t);
      stopSound('win');
      stopSound('lose');
      doneRef.current();
    };
  }, [won]);

  return (
    <div className="roulette">
      {revealed && won ? <Confetti /> : null}
      <div className="roulette-box">
        <span className="roulette-pointer" aria-hidden="true" />
        <motion.svg
          className="roulette-wheel"
          viewBox="0 0 200 200"
          initial={{ rotate: 0 }}
          animate={{ rotate: turn }}
          transition={{ duration: SPIN_MS / 1000, ease: [0.12, 0.75, 0.15, 1] }}
        >
          <defs>
            <pattern id="rl-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="8" height="8" fill="#fff" />
              <line x1="0" y1="0" x2="0" y2="8" stroke="#111" strokeWidth="2" />
            </pattern>
          </defs>
          {chance >= 100 ? (
            <circle cx={R} cy={R} r={R} fill="#111" />
          ) : chance <= 0 ? (
            <circle cx={R} cy={R} r={R} fill="url(#rl-hatch)" />
          ) : (
            <>
              <path d={arc(0, split)} fill="#111" />
              <path d={arc(split, 360)} fill="url(#rl-hatch)" />
            </>
          )}
          <circle cx={R} cy={R} r={R - 1.5} fill="none" stroke="#111" strokeWidth="3" />
          <circle cx={R} cy={R} r="14" fill="#fff" stroke="#111" strokeWidth="3" />
        </motion.svg>
      </div>
      <div className="roulette-legend">
        <span><i className="sw win" /> Gandain {chance}%</span>
        <span><i className="sw lose" /> Awikwok {100 - chance}%</span>
      </div>
      <div className="roulette-result" aria-live="polite">
        {revealed ? (
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 18 }}>
            <h3>{won ? `Menang x${mult}!` : 'Awikwok, kalah!'}</h3>
            {won ? (
              <p className="roulette-coins">
                <Coins size={18} strokeWidth={2.5} /> +<CountUp value={payout} />
              </p>
            ) : null}
            {onExit}
          </motion.div>
        ) : (
          <p className="note center-text">muter dulu...</p>
        )}
      </div>
    </div>
  );
}
