// ============================================================
// KONTEN SEO (tampil di bagian bawah halaman awal + cadangan di index.html)
// Domain utama: https://aduyapping.me/
// Jika teks di sini diubah, ubah juga blok <main class="seo-static"> di web/index.html
// supaya isi HTML awal dan isi di aplikasi tetap sama.
// ============================================================

export const SEO_SECTIONS = [
  {
    id: 'apa-itu',
    heading: 'Apa itu AduYapping?',
    paragraphs: [
      'AduYapping adalah game mengetik multiplayer yang bisa dimainkan langsung di browser, gratis dan tanpa install. Kamu dan teman-temanmu adu ngetik secepat mungkin: setiap kata yang selesai diketik menyerang lawan, dan tim atau pemain yang paling akhir bertahan menang.',
    ],
  },
  {
    id: 'cara-bermain',
    heading: 'Cara bermain game mengetik di AduYapping',
    list: [
      'Masuk dengan akun, atau pilih main sebagai guest.',
      'Buat room baru atau gabung ke room teman dari daftar room.',
      'Pilih mode War Team atau Solo, lalu atur jumlah pemain dan timer.',
      'Saat pertandingan mulai, ketik kata yang muncul lalu tekan spasi. Kata yang benar menyerang lawan yang kamu pilih.',
      'Menang dengan jadi tim atau pemain terakhir yang bertahan, atau dengan poin terbanyak saat waktu habis.',
    ],
    ordered: true,
  },
  {
    id: 'fitur',
    heading: 'Fitur adu ngetik multiplayer',
    list: [
      'War Team: dua tim saling serang, tiap tim bisa diberi nama sendiri.',
      'Solo: semua pemain saling serang dan poin tertinggi jadi MVP.',
      'Spectator: teman yang tidak ikut bisa menonton pertandingan.',
      'Practice: latihan mengetik sendirian dengan analisis akurasi dan WPM.',
      'Skin karakter, koin, dan leaderboard untuk pemain yang punya akun.',
    ],
  },
  {
    id: 'main-bareng',
    heading: 'Main online bersama teman',
    paragraphs: [
      'Buat room, lalu ajak temanmu masuk dari menu Join Room. Room bisa diberi password supaya hanya teman yang kamu undang yang bisa bergabung. Semua pemain bermain real-time lewat browser di HP maupun komputer.',
    ],
  },
  {
    id: 'keunggulan',
    heading: 'Kenapa main AduYapping?',
    list: [
      'Gratis dan langsung main lewat browser, tanpa download.',
      'Pertandingan singkat, cocok untuk main bareng kapan saja.',
      'Melatih kecepatan dan ketepatan mengetik sambil bersenang-senang.',
      'Tampilan unik bergaya coretan pensil di kertas bergaris.',
    ],
  },
];
