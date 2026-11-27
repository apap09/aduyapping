import { useState } from 'react';
import { motion } from 'framer-motion';
import { Hourglass, Coins, Dices } from 'lucide-react';
import { useApp } from '../store.jsx';
import { api } from '../lib/api.js';
import RouletteWheel from '../components/RouletteWheel.jsx';
import GamblePlay from './GamblePlay.jsx';
import { Button, Field, Screen, Tabs, TopBar, itemVariants, listVariants } from '../components/ui.jsx';
import { COMING_SOON, GAMBLING_MODES, MAX_BET, MIN_BET, MULTIPLIERS, SHOW_COMING_SOON } from '../../config/gambling.js';

function RouletteIcon({ size = 26 }) {
  // roda keberuntungan: roda bersegmen + jarum + penyangga
  const spokes = [0, 45, 90, 135].map((a) => {
    const r = (a * Math.PI) / 180;
    const dx = 7.2 * Math.cos(r);
    const dy = 7.2 * Math.sin(r);
    return `M${12 - dx} ${11 - dy}L${12 + dx} ${11 + dy}`;
  });
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="11" r="7.5" />
      <circle cx="12" cy="11" r="1.6" fill="currentColor" />
      <path d={spokes.join('')} />
      <path d="M12 1.2l-1.6 2.6h3.2z" fill="currentColor" />
      <path d="M8 21.5l4-4.2 4 4.2M7 21.5h10" />
    </svg>
  );
}
const MODE_ICONS = { roulette: RouletteIcon };

function ModePicker({ onPick }) {
  return (
    <motion.div className="mode-list" variants={listVariants} initial="initial" animate="animate">
      {GAMBLING_MODES.map((m, i) => {
        const Icon = MODE_ICONS[m.id] || Dices;
        return (
          <motion.div key={m.id} variants={itemVariants}>
            <motion.button
              type="button"
              className="mode-card"
              onClick={() => onPick(m.id)}
              animate={{ y: [0, -4, 0], transition: { duration: 3 + i, repeat: Infinity, ease: 'easeInOut' } }}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.94, y: 3 }}
            >
              <motion.span className="mode-icon" whileHover={{ rotate: [0, -14, 14, 0] }}>
                <Icon size={26} />
              </motion.span>
              <span className="tile-text">
                <strong>{m.title}</strong>
                <small>{m.sub}</small>
              </span>
            </motion.button>
          </motion.div>
        );
      })}
      {SHOW_COMING_SOON ? (
        <motion.div variants={itemVariants}>
          <div className="mode-card soon" aria-disabled="true">
            <span className="mode-icon"><Hourglass size={26} strokeWidth={2.5} /></span>
            <span className="tile-text">
              <strong>{COMING_SOON.title}</strong>
              <small>{COMING_SOON.sub}</small>
            </span>
          </div>
        </motion.div>
      ) : null}
    </motion.div>
  );
}

export default function Gamble() {
  const { state, actions } = useApp();
  const coins = state.user ? state.user.coins : 0;
  const [step, setStep] = useState('mode'); // mode | bet | play | spin
  const [bet, setBet] = useState('');
  const [mult, setMult] = useState(MULTIPLIERS[0].mult);
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState(null);
  const [res, setRes] = useState(null);

  const betNum = Number(bet);
  const max = Math.min(coins, MAX_BET);
  const invalid = !Number.isInteger(betNum) || betNum < MIN_BET || betNum > max;
  const tabs = MULTIPLIERS.map((m) => ({ id: String(m.mult), label: `x${m.mult} · ${m.seconds}s` }));

  const start = async () => {
    setBusy(true);
    try {
      const r = await api.gambleStart(betNum, mult);
      actions.setUser(r.user);
      setSession(r);
      setStep('play');
    } catch (e) {
      actions.toast(e.message);
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setSession(null);
    setRes(null);
    setBet('');
    setStep('mode');
  };

  if (step === 'play' && session) {
    return (
      <Screen>
        <TopBar title="Roulette ni dec" />
        <GamblePlay
          session={session}
          onResult={(r) => { setRes(r); setStep('spin'); }}
          onFail={(e) => { actions.toast(e.message); reset(); }}
        />
      </Screen>
    );
  }

  if (step === 'spin' && res) {
    return (
      <Screen>
        <TopBar title="Roulette ni dec" />
        <RouletteWheel
          result={res.result}
          onDone={() => actions.setUser(res.user)}
          onExit={
            <div className="sticky-actions inline">
              <Button onClick={reset}>Main lagi</Button>
              <Button variant="ghost" onClick={() => actions.go('menu')}>Ke menu</Button>
            </div>
          }
        />
      </Screen>
    );
  }

  if (step === 'bet') {
    return (
      <Screen>
        <TopBar title="Roulette ni dec" onBack={() => setStep('mode')} />
        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Field
            label="Taruhan brp deck?"
            hint={`Koin lu: ${coins}`}
            type="number"
            inputMode="numeric"
            min={MIN_BET}
            max={max}
            value={bet}
            placeholder="min 20 koin bre"
            onChange={(e) => setBet(e.target.value === '' ? '' : String(Math.min(max, Math.max(0, Math.floor(Number(e.target.value) || 0)))))}
          />
          <div className="field gamble-mult">
            <span className="field-label">gandain sini</span>
            <Tabs id="gamble-mult" tabs={tabs} value={String(mult)} onChange={(v) => setMult(Number(v))} />
          </div>
        </motion.div>
        <div className="sticky-actions">
          <Button icon={Coins} loading={busy} disabled={invalid} onClick={start}>Gaskeun dek</Button>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Gambling Room" onBack={() => actions.go('menu')} />
      <ModePicker onPick={() => setStep('bet')} />
    </Screen>
  );
}
