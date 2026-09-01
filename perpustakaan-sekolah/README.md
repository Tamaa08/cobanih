# 📚 Perpustakaan Sekolah Digital

Aplikasi **Perpustakaan Sekolah Digital** berbasis web untuk memudahkan siswa dan admin dalam proses peminjaman dan pendataan buku.

## Fitur Utama

| Fitur | Siswa/User | Admin |
|---|---|---|
| Daftar (Registrasi Anggota) | ✅ | ✅ |
| Login | ✅ | ✅ |
| Pemilihan Menu | ✅ | ✅ |
| CRUD Transaksi (Peminjaman/Pengembalian) | ✅ | ✅ |
| CRUD Data Buku | ❌ | ✅ |
| CRUD Kelola Anggota | ❌ | ✅ |
| Pencarian (buku, anggota, transaksi) | ✅ | ✅ |

## Tech Stack

- **Backend:** Node.js + Express
- **View Engine:** EJS
- **Database:** PostgreSQL (via Supabase)
- **Autentikasi:** Session (express-session) + bcrypt password hashing
- **Deploy:** Vercel

## Struktur Folder

```
perpustakaan-sekolah/
├── src/
│   ├── server.js              # Entry point utama
│   ├── config/db.js           # Koneksi Supabase
│   ├── controllers/           # Logika bisnis per modul
│   ├── middleware/auth.js     # Autentikasi & role-based access
│   └── routes/                # Definisi route (auth/admin/user)
├── views/                     # Template EJS
│   ├── login.ejs, register.ejs
│   ├── admin/                 # Dashboard, Buku, Anggota, Transaksi
│   └── user/                  # Dashboard, Katalog, Peminjaman, Pengembalian, Riwayat
├── public/css/style.css       # Stylesheet (lokal, tanpa CDN)
├── database/schema.sql        # Skema & seed data PostgreSQL
└── scripts/test-templates.mjs # Tes render template
```

## Cara Menjalankan di Lokal

### 1. Install dependencies
```bash
npm install
```

### 2. Buat file `.env`
Salin dari `.env.example` lalu isi kredensial Supabase Anda:
```
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SESSION_SECRET=your-super-secret-session-key-change-me
```

### 3. Setup database di Supabase
1. Buat proyek di [supabase.com](https://supabase.com)
2. Buka **SQL Editor**
3. Jalankan isi file `database/schema.sql` (membuat tabel + seed data)

### 4. Jalankan server
```bash
npm start
```
Buka `http://localhost:3000`

## Akun Demo (dari seed data)

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Siswa | `budi` | `budi123` |

## Deployment ke Vercel

1. Push proyek ke GitHub
2. Di Vercel, pilih **Import Project**
3. Framework preset: **Other** (konfigurasi `vercel.json` sudah disiapkan)
4. Tambahkan Environment Variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SESSION_SECRET`
5. Deploy

## Keamanan

- **SQL Injection:** Dicegah karena semua query memakai Supabase JS client (parameterized query).
- **Password:** Di-hash dengan `bcrypt` (10 salt rounds).
- **Role-Based Access Control:** Route `/admin/*` dan `/user/*` dilindungi middleware `isAdmin` / `isSiswa`.
- **Session:** Menggunakan cookie `httpOnly` dengan masa berlaku 8 jam.
- **Validasi input:** Pemeriksaan form wajib isi, panjang password minimal, dsb.
