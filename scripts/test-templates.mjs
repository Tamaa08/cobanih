import ejs from 'ejs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const viewsDir = path.join(__dirname, '..', 'views');

const sampleUser = { id: 'u1', username: 'admin', role: 'admin', nama: 'Admin' };
const sampleSiswa = { id: 'u2', username: 'budi', role: 'siswa', nama: 'Budi' };

const contexts = {
  'login.ejs': { error: null, message: null, title: 'Login' },
  'register.ejs': { error: null, message: null, title: 'Daftar' },
  '404.ejs': { title: '404' },
  'admin/dashboard.ejs': {
    title: 'Dashboard', currentUser: sampleUser,
    stats: { totalBuku: 1, totalAnggota: 1, totalPeminjaman: 1, totalSelesai: 1 },
    recentTrx: [{ buku: { judul: 'B1' }, anggota: { nama: 'A' }, tanggal_pinjam: new Date().toISOString(), status: 'dipinjam' }],
  },
  'admin/buku.ejs': {
    title: 'Buku', currentUser: sampleUser, buku: [{ id: 1, judul: 'J', penulis: 'P', kategori: 'K', stok: 2, lokasi: 'L', cover_url: null, rating: 4.2, rating_count: 3, deskripsi: 'Desc' }],
    search: '', message: null, error: null,
  },
  'admin/edit-buku.ejs': { title: 'Edit', currentUser: sampleUser, buku: { id: 1, judul: 'J', penulis: 'P', penerbit: null, tahun_terbit: 2000, kategori: 'K', stok: 2, lokasi: null, cover_url: null, deskripsi: null }, error: null },
  'admin/anggota.ejs': { title: 'Anggota', currentUser: sampleUser, anggota: [{ id: 1, nama: 'N', nis: 'X', kelas: 'K', status: 'aktif' }], search: '', message: null, error: null },
  'admin/edit-anggota.ejs': { title: 'Edit', currentUser: sampleUser, anggota: { id: 1, nama: 'N', kelas: 'K', nis: 'X', status: 'aktif' }, error: null },
  'admin/transaksi.ejs': {
    title: 'Transaksi', currentUser: sampleUser,
    transaksi: [{ id: 1, buku: { judul: 'J' }, anggota: { nama: 'N' }, tanggal_pinjam: new Date().toISOString(), tanggal_kembali: new Date().toISOString(), status: 'dipinjam' }],
    buku: [{ id: 1, judul: 'J', penulis: 'P' }], anggota: [{ id: 1, nama: 'N', nis: 'X' }],
    search: '', message: null, error: null,
  },
  'user/dashboard.ejs': {
    title: 'Dashboard', currentUser: sampleSiswa, nama: 'Budi', anggota: { id: 1 }, stats: { totalPinjam: 1, totalKembali: 1 },
    myTrx: [{ buku: { judul: 'J' }, tanggal_pinjam: new Date().toISOString(), tanggal_kembali: new Date().toISOString(), status: 'dipinjam' }],
  },
  'user/katalog.ejs': { title: 'Katalog', currentUser: sampleSiswa, buku: [{ id: 1, judul: 'J', penulis: 'P', kategori: 'K', stok: 2, cover_url: null, rating: 4.2, rating_count: 3, deskripsi: 'Desc' }], pinjamIds: new Set(), search: '', message: null, error: null },
  'user/peminjaman.ejs': { title: 'Pinjam', currentUser: sampleSiswa, buku: [{ id: 1, judul: 'J', penulis: 'P', kategori: 'K', stok: 2, cover_url: null, rating: 4.2, rating_count: 3, deskripsi: 'Desc' }], pinjamIds: new Set(), search: '', message: null, error: null },
  'user/detail.ejs': { title: 'Detail', currentUser: sampleSiswa, buku: { id: 1, judul: 'J', penulis: 'P', penerbit: 'X', tahun_terbit: 2000, kategori: 'K', stok: 2, lokasi: 'L', cover_url: null, rating: 4.2, rating_count: 3, deskripsi: 'Inti buku.' }, myRating: 5, canRate: true, terpinjam: false, message: null, error: null },
  'user/pengembalian.ejs': { title: 'Kembali', currentUser: sampleSiswa, myPinjam: [{ id: 1, buku: { judul: 'J', penulis: 'P' }, tanggal_pinjam: new Date().toISOString(), tanggal_kembali: new Date().toISOString() }], message: null, error: null },
  'user/riwayat.ejs': { title: 'Riwayat', currentUser: sampleSiswa, trx: [{ id: 1, buku: { judul: 'J' }, tanggal_pinjam: new Date().toISOString(), tanggal_kembali_aktual: new Date().toISOString(), status: 'dikembalikan' }], search: '', message: null, error: null },
};

let failed = 0;
for (const [file, ctx] of Object.entries(contexts)) {
  try {
    const full = path.join(viewsDir, file);
    const content = fs.readFileSync(full, 'utf8');
    ejs.render(content, ctx);
    console.log(`OK   ${file}`);
  } catch (e) {
    failed++;
    console.log(`FAIL ${file}: ${e.message}`);
  }
}

if (failed > 0) {
  console.log(`\n${failed} template(s) failed`);
  process.exit(1);
}
console.log('\nAll templates render successfully.');
