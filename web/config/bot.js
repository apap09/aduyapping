// ============================================================
// PENGATURAN BOT & DRAG AND DROP DI ROOM
// Nilai `value` harus sama dengan BOT_LEVELS di worker/src/room.js (0.2 / 0.5 / 1).
// Ubah `label` untuk mengganti tulisan level bot.
// ============================================================

export const BOT_LEVELS = [
  { value: 0.2, label: 'Lembek' },
  { value: 0.5, label: 'Biasa aja' },
  { value: 1, label: 'Jago jir' },
];

// Drag and drop (ketua memindahkan pemain/bot): kartu harus ditahan sebentar baru bisa digeser,
// supaya tidak sensitif saat tersentuh tidak sengaja atau saat scroll.
export const DRAG_HOLD_MS = 250; // lama menahan sebelum drag aktif (milidetik)
export const DRAG_TOLERANCE = 8; // geser jari lebih dari ini (px) sebelum waktunya = dianggap scroll, drag batal

// Pesan saat bot dijatuhkan ke slot spectator
export const BOT_TEAM_ONLY = 'Cuman bisa di tim';
