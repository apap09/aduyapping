// ============================================================
// GAMBLING ROOM (mode rahasia)
// Cara masuk: tap avatar sendiri di Menu sebanyak GAMBLING_TAPS kali.
// File ini dibaca oleh tampilan (browser) dan oleh server (api/_lib/gamble.js),
// jadi semua angka di sini otomatis berlaku di dua sisi.
// ============================================================

export const GAMBLING_TAPS = 5; // jumlah tap avatar untuk membuka Gambling Room
export const GAMBLING_TAP_WINDOW_MS = 1500; // jeda maksimal antar tap, lewat dari ini hitungan mulai dari 1 lagi
export const GAMBLING_TOAST = 'Gambling Room'; // teks notif saat berhasil masuk (ikon lucide ada di Menu.jsx)

// Daftar mode di halaman pilih mode.
export const GAMBLING_MODES = [{ id: 'roulette', title: 'Roulette Ga seh?', sub: '' }];

// Ganti true / false untuk menampilkan atau menyembunyikan kartu "nyusul....".
export const SHOW_COMING_SOON = true;
export const COMING_SOON = { title: 'nyusul....', sub: '' };

// Pilihan gandain: pengali koin dan durasi mengetik (detik).
export const MULTIPLIERS = [
  { mult: 2, seconds: 15 },
  { mult: 5, seconds: 10 },
  { mult: 10, seconds: 5 },
];

export const WORD_COUNT = 20; // jumlah kata yang harus diketik (tidak bisa diatur pemain)
export const CHANCE_PER_WORD = 5; // tiap 1 kata benar menambah peluang berhasil sebesar ini (persen)

// ---- Server saja ----
export const MAX_BET = 100_000_000; // batas taruhan, supaya hadiah tidak melebihi batas angka database
// Batas kecepatan mengetik yang masuk akal (karakter per detik, termasuk spasi).
// Klaim jumlah kata benar yang melebihi batas ini dipotong oleh server. Naikkan jika pemain cepat merasa dirugikan.
export const MAX_CHARS_PER_SEC = 12;
