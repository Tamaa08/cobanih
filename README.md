# Perpustakaan Sekolah Digital (jajalke)

Aplikasi web **perpustakaan sekolah digital** untuk pengelolaan **peminjaman buku** berbasis web, dengan tiga peran pengguna: **Admin** (pengelola penuh), **Petugas** (petugas perpustakaan / mini-admin), dan **Siswa** (anggota). Dibuat sebagai proyek UKK "Pengembangan Aplikasi Peminjaman Buku".

## Tech Stack

| Bagian        | Teknologi                                                  |
| ------------- | ----------------------------------------------------------- |
| Framework     | Next.js 16 (App Router) + React 19 + TypeScript            |
| Styling       | Tailwind CSS v4                                             |
| Database      | Supabase (PostgreSQL)                                       |
| Auth/Sesi     | Custom JWT (library `jose`) dalam cookie httpOnly            |
| Password hash | `bcryptjs`                                                  |
| Hosting       | Vercel (deploy-ready)                                       |
| Repository    | https://github.com/Xzrii1/jajalke                           |
| WireFrame     | [casediagram](casediagram.jfif) [Activitydiagram](Code_Generated_Image.jpg) [algorithm](Gemini_Generated_Image_keyfs0keyfs0keyf.jpg) [mockup](Code_Generated_Image (1).jpg) [flowchart](Gemini_Generated_Image_3j0w883j0w883j0w.jpg) [ERD](Gemini_Generated_Image_a4q2xoa4q2xoa4q2.jpg)                              |


## Keputusan Arsitektur: Auth custom, bukan Supabase Auth

Skema soal memakai **`username`** (bukan email) dan kolom `role` di satu tabel `users`. Supabase Auth hanya mendukung email/password sebagai identitas login, sehingga pemetaannya tidak natural. Karena itu dipilih:

- **Satu tabel `users`** berisi admin, petugas & siswa, dibedakan kolom `role` (`admin` / `petugas` / `siswa`).
- Login pakai `username` + `password` (dihash `bcrypt`). Password **tidak pernah** disimpan plaintext.
- Sesi berupa **JWT (HS256, 7 hari)** yang ditandatangani `AUTH_SECRET` dan disimpan di cookie `httpOnly`.
- Proteksi route dua lapis: **Proxy (`src/proxy.ts`)** untuk redirect cepat + **guard role di setiap server action/layout** (tidak hanya mengandalkan proxy).

> Akun admin **tidak** bisa self-register. Admin dibuat lewat script seed (lihat [Setup](#setup-supabase-dan-akun-admin)).

## Fitur

| Fitur                                                   | Siswa | Petugas | Admin |
| ------------------------------------------------------- | :---: | :-----: | :---: |
| Registrasi akun (siswa)                                 | ✅    | —       | —    |
| Login + pemilihan role                                  | ✅    | ✅      | ✅   |
| Dashboard + statistik                                   | ✅    | ✅      | ✅   |
| Peminjaman & pengembalian buku (transaksi sendiri)      | ✅    | ❌      | ❌   |
| CRUD Data Buku (**hanya petugas**)                      | ❌    | ✅      | ❌   |
| Kondisi fisik buku (baru/baik/bekas/rusak)              | ✅    | ✅ atur | ❌   |
| Rating & komentar buku (bintang 1–5)                    | ✅    | ✅ lihat | ✅   |
| Catat/ubah/hapus semua transaksi                        | ❌    | ✅      | ✅   |
| CRUD Kelola Anggota (**hanya siswa**)                   | ❌    | ✅      | ✅   |
| Laporan transaksi (Excel/PDF/cetak)                     | ❌    | ✅      | ✅   |
| Jam realtime (WIB) di dashboard                          | ✅    | ✅      | ✅   |
| Kelola akun admin/petugas (promosi/ubah/hapus)          | ❌    | ❌      | ✅   |
| Pencarian buku (judul/penulis/kategori/ISBN)            | ✅    | ✅      | ✅   |
| Cetak struk peminjaman                                   | ✅    | ✅      | ✅   |
| Pengingat denda belum lunas (popup)                      | ✅    | ❌      | ❌   |
| Bayar denda via QRIS (demo) + halaman profil            | ✅    | ❌      | ❌   |
| Atur tarif denda per hari (`pengaturan`)                | ❌    | ❌      | ✅   |

Halaman:
- `/` — beranda (info fitur + prosedur peminjaman; redirect sesuai sesi)
- `/login` — form login dengan tab pilihan role
- `/daftar` — registrasi anggota (siswa)
- `/admin/dashboard` — ringkasan jumlah buku, anggota, peminjaman aktif + grafik + jam realtime + menu pengaturan tarif denda
- `/admin/buku` — CRUD data buku + pencarian (**khusus petugas**, admin diarahkan ke dashboard)
- `/admin/anggota` — CRUD kelola anggota (siswa)
- `/admin/transaksi` — CRUD semua transaksi peminjaman + persetujuan pinjam/kembali + cetak struk
- `/admin/laporan` — laporan transaksi (Excel/PDF/cetak)
- `/siswa/dashboard` — ringkasan pinjaman siswa + jam realtime + prosedur pinjam
- `/siswa/buku` — daftar & pencarian buku (+ kondisi fisik + rating) + tombol pinjam
- `/siswa/transaksi` — riwayat pinjaman + tombol kembalikan + cetak struk
- `/siswa/profil` — profil siswa, daftar denda belum lunas, bayar via QRIS (demo)

> `/admin/*` dapat diakses oleh **Admin** dan **Petugas**, kecuali `/admin/buku` yang **petugas-only**. Siswa hanya memakai `/siswa/*`.

Aturan bisnis:
- Alur persetujuan: pinjam → **Menunggu Persetujuan** → disetujui (**Dipinjam**) atau **Ditolak**; pengembalian juga butuh persetujuan petugas (**Menunggu Kembali**).
- Durasi pinjam dipilih siswa: **1–30 hari** (default 7 hari) saat meminjam.
- Satu siswa hanya boleh punya **1 peminjaman aktif** per judul buku.
- Stok `- 1` saat peminjaman **disetujui**, stok `+ 1` saat pengembalian **disetujui** (stok tidak pernah negatif).
- Terlambat otomatis terdeteksi; denda per hari diambil dari pengaturan `denda_per_hari` (default **Rp 1.000/hari**, bisa diubah admin).
- Denda **berhenti bertambah** setelah buku dikembalikan, tapi **tetap tercatat sampai lunas** (`sisa = denda - denda_bayar`).
- Rating & komentar hanya untuk siswa yang pernah meminjam buku tsb; satu ulasan per siswa per buku.

## Struktur Project

```
.
├── scripts/seed-admin.mjs        # Membuat akun admin dari env
├── supabase/
│   ├── migrations/0001_init.sql        # Schema database (users, buku, transaksi)
│   ├── migrations/0002_cover.sql       # Kolom cover_url (foto sampul buku)
│   ├── migrations/0005_petugas.sql     # Izinkan + seed role petugas
│   ├── migrations/0006_pending.sql     # Alur persetujuan pinjam/kembali
│   ├── migrations/0007_ulasan.sql      # Tabel ulasan (rating & komentar)
│   ├── migrations/0008_denda.sql       # Kolom denda_bayar + tabel pembayaran_denda
│   ├── migrations/0009_pengaturan.sql  # Pengaturan aplikasi (tarif denda/hari)
│   ├── migrations/0010_kondisi.sql     # Kolom kondisi fisik buku
│   └── seed.sql                        # Data contoh buku (opsional)
└── src/
    ├── proxy.ts                  # Proteksi route per role (JWT)
    ├── lib/                      # supabase client, session JWT, auth, utils, types, kondisi, struk
    ├── app/
    │   ├── actions/              # Server actions (auth, buku, anggota, transaksi, ulasan, profil, pengaturan)
    │   ├── admin/...             # Halaman admin
    │   ├── siswa/...             # Halaman siswa
    │   └── ...                   # Landing, login, daftar
    └── components/               # UI primitives + form + nav + book-rating + denda-reminder
```

## Setup Lokal

Prasyarat: Node.js ≥ 20.9 dan satu project **Supabase** (dibuat manual di [supabase.com](https://supabase.com) atau `supabase init`).

### 1. Environment variable

```bash
cp .env.example .env.local
```

Isi `.env.local`:

```env
SUPABASE_URL=                    # Project Settings > API > Project URL
SUPABASE_ANON_KEY=               # Project Settings > API > anon public key
SUPABASE_SERVICE_ROLE_KEY=       # Service role key (khusus script seed)
AUTH_SECRET=                     # openssl rand -base64 32
ADMIN_SEED_USERNAME=admin        # username admin yang diinginkan
ADMIN_SEED_PASSWORD=Ganti123!    # password admin yang diinginkan
```

> **Jangan commit `.env.local`** (sudah di `.gitignore`). Hanya `.env.example` yang masuk repo dan tanpa isi asli.
>
> Variabel Supabase **tidak** memakai prefix `NEXT_PUBLIC_` karena seluruh akses ke database hanya terjadi lewat Server Actions (server-side). Ini menjaga URL & key tidak ikut dikirim ke browser. Untuk variabel baru di Next.js, prefix `NEXT_PUBLIC_` hanya diperlukan jika nilainya dibaca langsung di komponen **client**.

### 2. Buat schema database

Buka **Supabase Dashboard → SQL Editor**, jalankan isi `supabase/migrations/0001_init.sql`, lalu jalankan **sesuai urutan**:
- `0002_cover.sql` — menambah kolom `cover_url` pada tabel buku.
- `0005_petugas.sql` — mengizinkan role `petugas` pada constraint + **seed akun petugas** (username `petugas1`, password tertera di file tersebut).
- `0006_pending.sql` — alur persetujuan peminjaman/pengembalian (status `pending`, `ditolak`, `menunggu_kembali`).
- `0007_ulasan.sql` — tabel ulasan (rating bintang 1–5 + komentar).
- `0008_denda.sql` — kolom `denda_bayar` + tabel `pembayaran_denda` (QRIS fiktif).
- `0009_pengaturan.sql` — tabel pengaturan (tarif denda `denda_per_hari`, default 1000).
- `0010_kondisi.sql` — kolom `kondisi` pada tabel buku (baru/baik/bekas/rusak).

Opsional: `supabase/seed.sql` untuk data contoh buku.

> **Catatan keamanan (P0 / wajib bagi deploy publik):** RLS pada tabel-tabel Supabase **saat ini nonaktif**, sehingga `SUPABASE_ANON_KEY` publik bisa membaca/menulis tabel (termasuk kolom `password_hash`). Ini disengaja **sementara** untuk kemudahan pengembangan. **Jangan** deploy ke publik tanpa menutup ini. Langkah aman yang direncanakan: (1) set `SUPABASE_SERVICE_ROLE_KEY` di Vercel, (2) pindahkan kode akses DB ke service_role, (3) aktifkan migration RLS + rotasi password. (Cadangan migration tersedia di stash `wip-rls-migration`.) Sampai RLS aktif, jangan isi data sensitif di Supabase.

### 3. Buat akun admin

```bash
npm install
npm run seed:admin   # membaca ADMIN_SEED_USERNAME & ADMIN_SEED_PASSWORD dari .env.local
```

Akun **petugas** (mini-admin) dibuat lewat migration `0005_petugas.sql` (username `petugas1`). Role `petugas` hanya bisa kelola buku, transaksi, dan akun **siswa** — ia **tidak** bisa membuat/ubah/hapus akun admin atau petugas lain.

### 4. Jalankan aplikasi

```bash
npm run dev          # development
# atau
npm run build && npm run start   # production
```

Login di `/login` — pilih tab role sesuai akun (Siswa / Petugas / Admin).

## Checklist Testing Manual

Setelah Supabase dikonfigurasi, uji satu per satu:

1. **Registrasi** `/daftar` → buat akun siswa → berhasil & ter-redirect ke `/login` dengan pesan sukses.
2. **Login salah**: username/password salah → muncul error, kembali ke form. **Login role salah** (akun siswa pilih tab Admin) → error.
3. **Login siswa** → masuk `/siswa/dashboard`, ringkasan tampil + jam realtime.
4. **Cari buku** (siswa) → filter judul/kategori → kartu menampilkan kondisi fisik + rating → tombol **Pinjam** → pilih durasi (1–30 hari) → status **Menunggu Persetujuan**, stok belum berkurang.
5. **Pinjam buku yang sama berulang** → ditolak sampai dikembalikan. **Buku stok 0** → tidak bisa dipinjam.
6. **Persetujuan petugas** → di Kelola Transaksi klik **Setujui** → stok berkurang, status **Dipinjam**, muncul tombol **Struk** → cetak struk peminjaman. Klik **Tolak** bila ingin menu **ditolak**.
7. **Pengembalian** → siswa klik **Ajukan Kembali** (status **Menunggu Kembali**) → petugas **Setujui Kembali** → stok bertambah, denda dihitung jika terlambat.
8. **Rating & komentar** → siswa yang pernah meminjam suatu buku bisa menilai (1–5 bintang) + komentar di halaman Cari Buku; petugas/admin melihat rating di kelola buku.
9. **Login admin** → `/admin/dashboard` (statistik benar, grafik & jam tampil) + menu **Pengaturan** untuk mengubah tarif denda per hari.
10. **Login petugas** (username `petugas1`) → bisa buka `/admin/*`; nav menampilkan badge "Petugas Perpustakaan". Menu **Kelola Buku** hanya tampil untuk petugas.
11. **CRUD buku** **hanya petugas**: tambah/ubah/hapus (termasuk set kondisi fisik `baru`/`baik`/`bekas`/`rusak`) + pencarian. **Admin tidak bisa** membuka kelola buku (diarahkan ke dashboard).
12. **CRUD anggota**: tambah/ubah/reset-password/hapus **hanya untuk siswa**.
13. **Pembatasan petugas**: di halaman anggota, petugas **tidak** bisa mengubah/menghapus akun admin atau petugas lain.
14. **Transaksi admin**: buat transaksi (pilih anggota+buku+tanggal), tandai dikembalikan, edit, hapus; filter status bekerja.
15. **Denda & pembayaran** → setelah terlambat, di profil siswa muncul denda belum lunas; bayar via **QRIS (demo)** → popup pengingat denda hilang setelah lunas.
16. **Laporan** `/admin/laporan` → export Excel, PDF, dan tombol cetak berfungsi.
17. **Proteksi route**: siswa tidak bisa buka `/admin/*`, admin/petugas tidak bisa buka `/siswa/*`, user belum login diarahkan ke `/login`.
18. **Logout** → kembali ke `/login`, halaman terproteksi tertutup.

Cek error di **browser console** dan terminal setiap langkah.

## Deploy ke Vercel

1. Push repo ke GitHub (lihat [Development](#development)).
2. Di [vercel.com](https://vercel.com) → **Add New Project → Import** repo ini.
3. Di tab *Environment Variables*, tambahkan (nilai sama seperti `.env.local`, tanpa `ADMIN_SEED_*`; simpan sebagai **Sensitive**):
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `AUTH_SECRET`
4. **Deploy**. Setelah sukses, pastikan migration `0001`–`0010` + seed admin sudah dijalankan di Supabase (bagian Setup).
5. Buka URL deploy → login → semua fitur berjalan.

> ⚠️ **Sebelum go-public:** tutup P0 — RLS masih nonaktif (lihat bagian Setup, langkah 2). Rencana aman & migration cadangannya sudah dicatat di sana.

## Development

```bash
npm run dev         # server development
npm run build       # production build
npm run start       # menjalankan hasil build
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm run seed:admin  # buat/update akun admin
```
