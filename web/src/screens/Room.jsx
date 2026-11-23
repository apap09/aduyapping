import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Bot, Check, Copy, Crown, Eye, LogOut, Play, Plus, Settings } from 'lucide-react';
import { BOT_LEVELS, BOT_TEAM_ONLY, DRAG_HOLD_MS, DRAG_TOLERANCE } from '../../config/bot.js';
import { useApp } from '../store.jsx';
import Avatar from '../components/Avatar.jsx';
import RoomForm from '../components/RoomForm.jsx';
import { Dots } from '../components/fx.jsx';
import { ChatButton, ChatSheet } from '../components/Chat.jsx';
import { Button, Screen, TopBar } from '../components/ui.jsx';

/** Level bot di posisi yang sama dengan label "Ketua". Ketua mengetuk untuk mengganti level. */
function BotLevel({ p, canEdit, onLevel }) {
  const idx = Math.max(0, BOT_LEVELS.findIndex((l) => l.value === p.level));
  const cur = BOT_LEVELS[idx];
  const next = BOT_LEVELS[(idx + 1) % BOT_LEVELS.length];
  const label = (
    <>
      <Bot size={14} strokeWidth={2.5} />
      <motion.span key={cur.label} initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.18 }}>
        {cur.label}
      </motion.span>
    </>
  );
  if (!canEdit) return <span className="badge bot-level">{label}</span>;
  // berhenti di sini supaya mengetuk tombol ini tidak ikut memulai drag kartu
  const stop = (e) => e.stopPropagation();
  return (
    <motion.button
      type="button"
      className="badge bot-level"
      aria-label={cur.label}
      onPointerDown={stop}
      onMouseDown={stop}
      onTouchStart={stop}
      onClick={() => onLevel(p.id, next.value)}
      whileTap={{ scale: 0.9, y: 2 }}
    >
      {label}
    </motion.button>
  );
}

function Member({ p, room, youId, isHost, onBotLevel, still }) {
  return (
    <motion.div
      layout
      className={`player ${p.connected ? '' : 'away'}`}
      initial={still ? false : { opacity: 0, x: -40, scale: 0.85, rotate: -2 }}
      animate={{ opacity: 1, x: 0, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, x: 40, scale: 0.9 }}
      whileHover={still ? undefined : { x: 4 }}
      transition={{ type: 'spring', stiffness: 380, damping: 18 }}
    >
      <Avatar skin={p.skin} size={44} />
      <span className="player-name">
        {p.name}
        {p.id === youId ? <small> (kamu)</small> : null}
      </span>
      {p.bot ? <BotLevel p={p} canEdit={!!isHost && !still && room.status === 'lobby'} onLevel={onBotLevel} /> : null}
      {p.id === room.hostId ? (
        <span className="badge">
          <Crown size={14} strokeWidth={2.5} /> Ketua
        </span>
      ) : null}
      {!p.connected ? <span className="badge dim">Terputus</span> : null}
    </motion.div>
  );
}

/** Pembungkus kartu yang bisa di-drag (hanya ketua). Seluruh kartu menjadi pegangan drag. */
function HostDraggable({ id, kind, enabled, children }) {
  const { setNodeRef, listeners, isDragging } = useDraggable({ id, data: { kind }, disabled: !enabled });
  return (
    <div
      ref={setNodeRef}
      {...(enabled ? listeners : {})}
      className={`dnd-item ${enabled ? 'can-drag' : ''} ${isDragging ? 'dragging' : ''}`}
    >
      {children}
    </div>
  );
}

function Draggable({ dnd, ...props }) {
  return dnd ? <HostDraggable {...props} /> : props.children;
}

/** Slot kosong yang bisa menerima kartu yang di-drag (hanya ketua). */
function HostDropSlot({ id, target, children }) {
  const { setNodeRef, isOver, active } = useDroppable({ id, data: target });
  const deny = isOver && target.to === 'spectator' && active && active.data.current.kind === 'bot';
  return (
    <div ref={setNodeRef} className={`drop-slot ${active ? 'armed' : ''} ${isOver ? 'over' : ''} ${deny ? 'deny' : ''}`}>
      {children}
    </div>
  );
}

function DropSlot({ dnd, ...props }) {
  return dnd ? <HostDropSlot {...props} /> : props.children;
}

function EmptySlot({ label, onClick, disabled }) {
  return (
    <motion.button
      type="button"
      className="slot-empty"
      disabled={disabled}
      onClick={onClick}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.95, y: 2 }}
    >
      <Plus size={16} strokeWidth={3} /> {label}
    </motion.button>
  );
}

function TeamPanel({ team, room, youId, canMove, onMove, isHost, dnd, canDrag, onAddBot, onBotLevel }) {
  const cap = Math.ceil(room.settings.max / 2);
  const members = room.players.filter((p) => p.team === team);
  const name = (room.settings.teamNames || [])[team - 1] || (team === 1 ? 'Tim Merah' : 'Tim Biru');
  const slots = Array.from({ length: cap }, (_, i) => members.find((p) => p.slot === i) || null);
  const full = slots.every(Boolean) || room.players.length >= room.settings.max;
  return (
    <motion.section
      className={`team-panel ${team === 1 ? 'red' : 'blue'}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <header>
        <i />
        <h3>{name}</h3>
        {isHost && canMove ? (
          <motion.button
            type="button"
            className="bot-add"
            aria-label="Tambah bot"
            disabled={full}
            onClick={() => onAddBot(team)}
            whileTap={full ? undefined : { scale: 0.9, y: 2 }}
          >
            <Bot size={16} strokeWidth={2.5} />
            <Plus size={12} strokeWidth={3.5} />
          </motion.button>
        ) : null}
        <small>
          {members.length}/{cap}
        </small>
      </header>
      {slots.map((p, i) =>
        p ? (
          <Draggable key={p.id} dnd={dnd} id={p.id} kind={p.bot ? 'bot' : 'player'} enabled={canDrag && p.id !== room.hostId}>
            <Member p={p} room={room} youId={youId} isHost={isHost} onBotLevel={onBotLevel} />
          </Draggable>
        ) : (
          <DropSlot key={`e${i}`} dnd={dnd} id={`slot-${team}-${i}`} target={{ to: 'player', team, slot: i }}>
            <EmptySlot label="pindah ke sini" disabled={!canMove} onClick={() => onMove({ to: 'player', team, slot: i })} />
          </DropSlot>
        ),
      )}
    </motion.section>
  );
}

function SpecPanel({ room, youId, youSpec, onMove, dnd, canDrag }) {
  const s = room.settings;
  const list = room.spectators || [];
  const slots = Array.from({ length: s.specMax }, (_, i) => list[i] || null);
  const canJoin = !youSpec && list.length < s.specMax;
  return (
    <section className="spec-panel">
      <header>
        <Eye size={16} strokeWidth={2.5} />
        <h3>Spectator</h3>
        <small>
          {list.length}/{s.specMax}
        </small>
      </header>
      <div className="spec-slots">
        {slots.map((p, i) =>
          p ? (
            <Draggable key={p.id} dnd={dnd} id={p.id} kind="spectator" enabled={canDrag && p.id !== room.hostId}>
              <SpecChip p={p} youId={youId} />
            </Draggable>
          ) : (
            <DropSlot key={`s${i}`} dnd={dnd} id={`spec-${i}`} target={{ to: 'spectator' }}>
              <motion.button
                type="button"
                className="spec-empty"
                aria-label="Jadi spectator"
                disabled={!canJoin}
                onClick={() => onMove({ to: 'spectator' })}
                whileTap={canJoin ? { scale: 0.88 } : undefined}
              >
                <Plus size={14} strokeWidth={3} />
              </motion.button>
            </DropSlot>
          ),
        )}
      </div>
    </section>
  );
}

function SpecChip({ p, youId, still }) {
  return (
    <motion.div
      layout
      className="spec-chip"
      initial={still ? false : { scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <Avatar skin={p.skin} size={30} plate={false} />
      <span>{p.id === youId ? 'Kamu' : p.name}</span>
    </motion.div>
  );
}

export default function Room() {
  const { state, actions } = useApp();
  const room = state.room;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [dragId, setDragId] = useState(null);
  // Kartu harus ditahan sebentar sebelum bisa di-drag (mouse maupun sentuhan)
  const hold = { delay: DRAG_HOLD_MS, tolerance: DRAG_TOLERANCE };
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: hold }),
    useSensor(TouchSensor, { activationConstraint: hold }),
  );

  if (!room) return null;
  const isHost = room.hostId === state.youId;
  const s = room.settings;
  const solo = s.mode === 'solo';
  const youSpec = (room.spectators || []).some((p) => p.id === state.youId);
  const teamCount = (t) => room.players.filter((p) => p.team === t).length;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      actions.toast(`Kode room: ${room.code}`);
    }
  };

  const openEdit = () => {
    setDraft({ ...s, password: '' });
    setEditing(true);
  };

  if (editing && draft) {
    const invalid = draft.isPrivate && !s.isPrivate && !draft.password.trim();
    return (
      <Screen>
        <TopBar title="Pengaturan room" onBack={() => setEditing(false)} />
        <div className="card">
          <RoomForm
            value={draft}
            onChange={setDraft}
            passwordHint={s.isPrivate ? 'Kosongkan jika tidak diganti' : 'Atur password'}
          />
        </div>
        <div className="sticky-actions two">
          <Button variant="ghost" onClick={() => setEditing(false)}>
            Back
          </Button>
          <Button
            icon={Check}
            disabled={invalid}
            onClick={() => {
              actions.saveSettings(draft);
              setEditing(false);
            }}
          >
            Confirm
          </Button>
        </div>
      </Screen>
    );
  }

  const canStart = room.players.length >= 2 && (solo || (teamCount(1) > 0 && teamCount(2) > 0));
  const loading = room.status !== 'lobby' || starting;

  // Drag and drop: hanya ketua, hanya saat lobi
  const dnd = isHost;
  const canDrag = isHost && !loading;
  const dragPlayer = dragId ? room.players.find((p) => p.id === dragId) : null;
  const dragSpec = dragId ? (room.spectators || []).find((p) => p.id === dragId) : null;
  const onDragEnd = ({ active, over }) => {
    setDragId(null);
    if (!over || !canDrag) return;
    const kind = active.data.current.kind;
    const target = over.data.current;
    if (target.to === 'spectator') {
      if (kind === 'spectator') return;
      if (kind === 'bot') return actions.toast(BOT_TEAM_ONLY);
      return actions.moveTo({ id: active.id, to: 'spectator' });
    }
    actions.moveTo({ id: active.id, ...target });
  };

  const content = (
    <>
      <TopBar
        title={s.name}
        right={
          <Button variant="quiet" icon={LogOut} className="sm" onClick={actions.leaveRoom}>
            Keluar
          </Button>
        }
      />

      <motion.div className="code-card" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
        <div>
          <small>Kode room</small>
          <strong className="code">
            {room.code.split('').map((ch, i) => (
              <motion.span
                key={`${room.code}-${i}`}
                style={{ display: 'inline-block' }}
                initial={{ rotateX: -90, opacity: 0, y: -14 }}
                animate={{ rotateX: 0, opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 16, delay: 0.1 + i * 0.09 }}
                whileHover={{ y: -5 }}
              >
                {ch}
              </motion.span>
            ))}
          </strong>
        </div>
        <Button variant="ghost" className="sm" icon={copied ? Check : Copy} onClick={copy}>
          {copied ? 'Tersalin' : 'Salin'}
        </Button>
      </motion.div>

      <div className="chips">
        <span className="chip-mode">{solo ? 'Solo' : 'Team'}</span>
        <span>{s.isPrivate ? 'Private' : 'Public'}</span>
        <span>
          {room.players.length}/{s.max} pemain
        </span>
        <span>Damage {s.damage}</span>
        <span>Darah {s.hp}</span>
      </div>

      {solo ? (
        <DropSlot dnd={dnd && room.players.length < s.max} id="solo-list" target={{ to: 'player' }}>
          <section className="players">
            <h3>Pemain</h3>
            <AnimatePresence initial={false}>
              {room.players.map((p) => (
                <Draggable key={p.id} dnd={dnd} id={p.id} kind={p.bot ? 'bot' : 'player'} enabled={canDrag && p.id !== room.hostId}>
                  <Member p={p} room={room} youId={state.youId} isHost={isHost} onBotLevel={actions.setBotLevel} />
                </Draggable>
              ))}
            </AnimatePresence>
            {youSpec ? (
              <EmptySlot
                label="Jadi pemain"
                disabled={room.players.length >= s.max}
                onClick={() => actions.moveTo({ to: 'player' })}
              />
            ) : null}
          </section>
        </DropSlot>
      ) : (
        <>
          {[1, 2].map((t) => (
            <TeamPanel
              key={t}
              team={t}
              room={room}
              youId={state.youId}
              canMove={!loading}
              onMove={actions.moveTo}
              isHost={isHost}
              dnd={dnd}
              canDrag={canDrag}
              onAddBot={actions.addBot}
              onBotLevel={actions.setBotLevel}
            />
          ))}
        </>
      )}
      {s.specOn ? (
        <SpecPanel room={room} youId={state.youId} youSpec={youSpec} onMove={actions.moveTo} dnd={dnd} canDrag={canDrag} />
      ) : null}

      <div className="sticky-actions">
        <div className="chat-row">
          <ChatButton variant="pill" />
        </div>
        {isHost ? (
          <>
            <Button variant="ghost" icon={Settings} onClick={openEdit} disabled={loading}>
              Pengaturan room
            </Button>
            <Button
              icon={Play}
              loading={loading}
              disabled={!canStart}
              onClick={() => {
                setStarting(true);
                setTimeout(() => setStarting(false), 4000);
                actions.startGame();
              }}
            >
              {canStart ? 'Mulai game' : solo ? 'Menunggu pemain (min. 2)' : 'Tiap tim butuh minimal 1 pemain'}
            </Button>
          </>
        ) : (
          <p className="note center-text">Menunggu ketua room memulai game <Dots /></p>
        )}
      </div>
      <ChatSheet title="Chat room" />
    </>
  );

  return (
    <Screen>
      {dnd ? (
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          autoScroll={{ threshold: { x: 0.1, y: 0.12 }, acceleration: 8 }}
          onDragStart={({ active }) => setDragId(active.id)}
          onDragEnd={onDragEnd}
          onDragCancel={() => setDragId(null)}
        >
          {content}
          {createPortal(
            <DragOverlay dropAnimation={null}>
              {dragPlayer || dragSpec ? (
                <div className="dnd-overlay">
                  {dragPlayer ? (
                    <Member p={dragPlayer} room={room} youId={state.youId} still />
                  ) : (
                    <SpecChip p={dragSpec} youId={state.youId} still />
                  )}
                </div>
              ) : null}
            </DragOverlay>,
            document.body,
          )}
        </DndContext>
      ) : (
        content
      )}
    </Screen>
  );
}
