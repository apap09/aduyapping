-- Gambling Room: jalankan sekali di Neon > SQL Editor. Aman dijalankan ulang.
-- Satu baris = satu putaran taruhan. Koin dipotong saat putaran dimulai (status 'typing'),
-- dan hadiah (jika menang) ditambahkan saat putaran selesai (status 'done').
-- Putaran yang ditinggalkan di tengah jalan tetap 'typing' selamanya: taruhan hangus.

create table if not exists gamble_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  bet          integer not null check (bet > 0),
  mult         smallint not null check (mult > 1),
  duration_s   smallint not null check (duration_s > 0),
  words        text[] not null,                          -- kata yang dibuat server untuk putaran ini
  status       text not null default 'typing' check (status in ('typing', 'done')),
  created_at   timestamptz not null default now(),
  finished_at  timestamptz,
  correct      smallint,                                 -- jumlah kata benar (setelah dicek server)
  chance       smallint,                                 -- peluang menang dalam persen
  won          boolean,
  payout       integer                                   -- koin yang diterima (0 jika kalah)
);

create index if not exists gamble_sessions_user_idx on gamble_sessions (user_id, created_at desc);
