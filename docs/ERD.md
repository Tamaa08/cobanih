# ERD — Perpustakaan Sekolah Digital

Diagram Relasi Entitas (Entity Relationship Diagram) untuk database aplikasi
berbasis PostgreSQL (Supabase).

```
┌────────────────────────────────────────────────────────────┐
│                         users                              │
│ ├─ id (UUID, PK)                                           │
│ ├─ username (VARCHAR, UNIQUE)                              │
│ ├─ password_hash (TEXT)                                    │
│ ├─ role (VARCHAR: 'admin'|'siswa')                         │
│ ├─ nama (VARCHAR)                                          │
│ ├─ kelas (VARCHAR)                                         │
│ ├─ nis (VARCHAR)                                           │
│ └─ created_at (TIMESTAMPTZ)                                │
└───────────────▲────────────────────────────────────────────┘
                │ 1 : 1 (user_id, UNIQUE, ON DELETE CASCADE)
┌───────────────┴────────────────────────────────────────────┐
│                        anggota                             │
│ ├─ id (UUID, PK)                                           │
│ ├─ user_id (UUID, UNIQUE, FK → users.id)                   │
│ ├─ nama (VARCHAR, NOT NULL)                                │
│ ├─ kelas (VARCHAR, NOT NULL)                               │
│ ├─ nis (VARCHAR, UNIQUE, NOT NULL)                         │
│ ├─ status (VARCHAR: 'aktif'|'nonaktif')                    │
│ └─ created_at (TIMESTAMPTZ)                                │
└───────────────▲────────────────────────────────────────────┘
                │ 1 : N (id_anggota, FK → anggota.id)
┌───────────────┴────────────────────────────────────────────┐
│                       transaksi                            │
│ ├─ id (UUID, PK)                                           │
│ ├─ id_anggota (UUID, FK → anggota.id, ON DELETE CASCADE)   │
│ ├─ id_buku (UUID, FK → buku.id, ON DELETE CASCADE)         │
│ ├─ tanggal_pinjam (TIMESTAMPTZ)                            │
│ ├─ tanggal_kembali (TIMESTAMPTZ)                           │
│ ├─ tanggal_kembali_aktual (TIMESTAMPTZ)                    │
│ ├─ status ('dipinjam'|'dikembalikan')                      │
│ └─ created_at (TIMESTAMPTZ)                                │
└───────────────▲────────────────────────────────────────────┘
                │ 1 : N (id_buku, FK → buku.id)
┌───────────────┴────────────────────────────────────────────┐
│                          buku                              │
│ ├─ id (UUID, PK)                                           │
│ ├─ judul (VARCHAR, NOT NULL)                               │
│ ├─ penulis (VARCHAR, NOT NULL)                             │
│ ├─ penerbit (VARCHAR)                                      │
│ ├─ tahun_terbit (INTEGER)                                  │
│ ├─ kategori (VARCHAR, NOT NULL)                            │
│ ├─ stok (INTEGER, NOT NULL, CHECK stok >= 0)               │
│ ├─ lokasi (VARCHAR)                                        │
│ ├─ cover_url (TEXT)                                        │
│ ├─ rating (DOUBLE PRECISION, DEFAULT 0)                    │
│ ├─ rating_count (INTEGER, DEFAULT 0)                       │
│ ├─ deskripsi (TEXT)                                        │
│ └─ created_at (TIMESTAMPTZ)                                │
└────────────────────────────────────────────────────────────┘
                │ 1 : N (id_buku, FK → buku.id, ON DELETE CASCADE)
┌───────────────┴────────────────────────────────────────────┐
│                         rating                             │
│ ├─ id (UUID, PK)                                           │
│ ├─ id_buku (UUID, FK → buku.id, ON DELETE CASCADE)         │
│ ├─ id_anggota (UUID, FK → anggota.id, ON DELETE CASCADE)   │
│ ├─ nilai (INTEGER, CHECK 1..5)                             │
│ ├─ created_at (TIMESTAMPTZ)                                │
│ └─ UNIQUE (id_buku, id_anggota)                            │
└────────────────────────────────────────────────────────────┘
```

## Penjelasan Relasi

| Dari | Ke | Kardinalitas | Keterangan |
|---|---|---|---|
| `users` | `anggota` | 1 : 1 | Satu user siswa terhubung ke satu profil anggota (user_id UNIQUE). Admin tidak punya baris di anggota. |
| `anggota` | `transaksi` | 1 : N | Satu anggota dapat memiliki banyak transaksi peminjaman. |
| `buku` | `transaksi` | 1 : N | Satu buku dapat muncul di banyak transaksi (peminjaman berkali-kali). |
| `buku` | `rating` | 1 : N | Satu buku dapat dinilai banyak anggota (setiap anggota 1× untuk buku yang sama). |
| `anggota` | `rating` | 1 : N | Satu anggota dapat menilai banyak buku (1× per buku, UNIQUE id_buku+id_anggota). |

## Constraint Penting

- `role` dibatasi `'admin'` / `'siswa'` (CHECK).
- `status` anggota dibatasi `'aktif'` / `'nonaktif'`.
- `status` transaksi dibatasi `'dipinjam'` / `'dikembalikan'`.
- `stok >= 0` (CHECK) — mencegah stok negatif.
- `username` dan `nis` harus unik.
- Foreign key memakai `ON DELETE CASCADE` agar penghapusan bersih tanpa data yatim.

## Skenario Stok pada Transaksi

- **Peminjaman:** `stok` buku dikurangi 1 (hanya jika status transaksi 'dipinjam' dan stok > 0).
- **Pengembalian:** `stok` buku ditambah 1.
- Aplikasi mencegah meminjam buku yang statusnya masih 'dipinjam' oleh siapa pun (dicek dalam controller).
