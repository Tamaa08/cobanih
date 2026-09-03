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
  'landing.ejs': { title: 'Landing' },
  'admin/dashboard.ejs': {
    title: 'Dashboard', currentUser: sampleUser,
    stats: { totalBuku: 1, totalAnggota: 1, totalPeminjaman: 1, totalSelesai: 1 },
    totalDendaBelum: 1, nominalDendaBelum: 10000,
    recentTrx: [{ buku: { judul: 'B1' }, anggota: { nama: 'A' }, tanggal_pinjam: new Date().toISOString(), status: 'dipinjam' }],
    activeLoans: [{ buku: { judul: 'B1' }, anggota: { nama: 'A', kelas: 'X' }, tanggal_kembali: new Date().toISOString(), overdue: false, sisaHari: 3 }],
    chart: { tokens: ['01 Sep', '02 Sep'], daily: [1, 0] },
  },
  'admin/statistik.ejs': {
    title: 'Statistik', currentUser: sampleUser,
    totalTransaksi: 5, totalDipinjam: 2, totalDikembalikan: 3,
    topBook: { nama: 'B1', count: 3 },
    dendaStats: { belum: 1, lunas: 2, nominalBelum: 10000, nominalLunas: 20000 },
    formatRupiah: (v) => v.toLocaleString('id-ID'),
    chart: {
      labels: ['01 Sep', '02 Sep'], daily: [1, 1],
      byBook: [{ nama: 'B1', count: 3 }], byMember: [{ nama: 'Budi', count: 2 }],
      status: { dipinjam: 2, dikembalikan: 3 }, byCategory: [{ kategori: 'Fiksi', nilai: 2 }],
    },
    loans: [{ id: 1, buku: { judul: 'B1', cover_url: null }, anggota: { nama: 'Budi', nis: 'N', kelas: 'X' }, tanggal_pinjam: new Date().toISOString(), tanggal_kembali: new Date().toISOString(), overdue: false, sisaHari: 3 }],
  },
  'admin/buku.ejs': {
    title: 'Buku', currentUser: sampleUser, buku: [{ id: 1, judul: 'J', penulis: 'P', kategori: 'K', isbn: '978-1', stok: 2, lokasi: 'L', cover_url: null, rating: 4.2, rating_count: 3, deskripsi: 'Desc' }],
    search: '', kategori: '', kategoriList: ['Fiksi', 'Sains'], message: null, error: null,
  },
  'admin/edit-buku.ejs': { title: 'Edit', currentUser: sampleUser, buku: { id: 1, judul: 'J', penulis: 'P', penerbit: null, tahun_terbit: 2000, kategori: 'K', isbn: '978-1', stok: 2, lokasi: null, cover_url: null, deskripsi: null }, error: null },
  'admin/anggota.ejs': { title: 'Anggota', currentUser: sampleUser, anggota: [{ id: 1, nama: 'N', nis: 'X', kelas: 'K', status: 'aktif' }], search: '', message: null, error: null },
  'admin/edit-anggota.ejs': { title: 'Edit', currentUser: sampleUser, anggota: { id: 1, nama: 'N', kelas: 'K', nis: 'X', status: 'aktif' }, error: null },
  'admin/akun.ejs': {
    title: 'Kelola Akun', currentUser: sampleUser,
    akun: [{ id: 'u1', username: 'admin', nama: 'Admin', role: 'admin', created_at: new Date().toISOString() },
           { id: 'u2', username: 'petugas1', nama: 'Petugas', role: 'petugas', created_at: new Date().toISOString() }],
    message: null, error: null,
  },
  'admin/transaksi.ejs': {
    title: 'Transaksi', currentUser: sampleUser,
    transaksi: [{ id: 1, buku: { judul: 'J' }, anggota: { nama: 'N' }, tanggal_pinjam: new Date().toISOString(), tanggal_kembali: new Date().toISOString(), status: 'dipinjam' }],
    buku: [{ id: 1, judul: 'J', penulis: 'P' }], anggota: [{ id: 1, nama: 'N', nis: 'X' }],
    search: '', status: '', message: null, error: null,
  },
  'admin/edit-transaksi.ejs': {
    title: 'Edit', currentUser: sampleUser,
    trx: { id: 1, buku: { judul: 'J' }, anggota: { nama: 'N' }, tanggal_pinjam: new Date().toISOString(), tanggal_kembali: new Date().toISOString(), tanggal_kembali_aktual: null, status: 'dipinjam' },
    error: null,
  },
  'admin/laporan.ejs': { title: 'Laporan', currentUser: sampleUser, message: null, error: null },
  'admin/laporan-cetak.ejs': {
    title: 'Cetak',
    data: [{ tanggal_pinjam: new Date().toISOString(), tanggal_kembali: new Date().toISOString(), tanggal_kembali_aktual: new Date().toISOString(), anggota: { nama: 'N', kelas: 'X', nis: '1' }, buku: { judul: 'J' }, status: 'dikembalikan', denda_total: 0 }],
    mulai: '01/09/2026', selesai: '02/09/2026', statusLabel: 'Semua',
    tanggalCetak: '02/09/2026', total: 1, dipinjam: 0, dikembalikan: 1, totalDenda: 0,
  },
  'admin/denda.ejs': {
    title: 'Denda', currentUser: sampleUser,
    denda: [{ id: 1, jenis: 'telat', jumlah: 10000, hari_keterlambatan: 1, status: 'belum_bayar', keterangan: 'k', metode: 'qris', buku: { judul: 'J' }, anggota: { nama: 'N', nis: 'X', kelas: 'K' } }],
    transaksiDikembalikan: [{ id: 1, buku: { judul: 'J' }, anggota: { nama: 'N', nis: 'X' } }],
    filter: '', message: null, error: null,
  },
  'user/dashboard.ejs': {
    title: 'Dashboard', currentUser: sampleSiswa, nama: 'Budi', anggota: { id: 1 }, stats: { totalPinjam: 1, totalKembali: 1, totalDenda: 1 },
    totalDenda: 1, jumlahDenda: 10000,
    myTrx: [{ buku: { judul: 'J' }, tanggal_pinjam: new Date().toISOString(), tanggal_kembali: new Date().toISOString(), status: 'dipinjam' }],
  },
  'user/bantuan.ejs': { title: 'Bantuan', currentUser: sampleSiswa },
  'user/katalog.ejs': { title: 'Katalog', currentUser: sampleSiswa, buku: [{ id: 1, judul: 'J', penulis: 'P', kategori: 'K', isbn: '978-1', stok: 2, cover_url: null, rating: 4.2, rating_count: 3, deskripsi: 'Desc' }], pinjamIds: new Set(), search: '', kategori: '', kategoriList: ['Fiksi'], message: null, error: null },
  'user/peminjaman.ejs': { title: 'Pinjam', currentUser: sampleSiswa, buku: [{ id: 1, judul: 'J', penulis: 'P', kategori: 'K', isbn: '978-1', stok: 2, cover_url: null, rating: 4.2, rating_count: 3, deskripsi: 'Desc' }], pinjamIds: new Set(), search: '', kategori: '', kategoriList: ['Fiksi'], message: null, error: null },
  'user/detail.ejs': { title: 'Detail', currentUser: sampleSiswa, buku: { id: 1, judul: 'J', penulis: 'P', penerbit: 'X', tahun_terbit: 2000, kategori: 'K', stok: 2, lokasi: 'L', cover_url: null, rating: 4.2, rating_count: 3, deskripsi: 'Inti buku.' }, myRating: 5, canRate: true, terpinjam: false, message: null, error: null },
  'user/pengembalian.ejs': { title: 'Kembali', currentUser: sampleSiswa, myPinjam: [{ id: 1, buku: { judul: 'J', penulis: 'P' }, tanggal_pinjam: new Date().toISOString(), tanggal_kembali: new Date().toISOString() }], message: null, error: null },
  'user/riwayat.ejs': { title: 'Riwayat', currentUser: sampleSiswa, trx: [{ id: 1, buku: { judul: 'J' }, tanggal_pinjam: new Date().toISOString(), tanggal_kembali_aktual: new Date().toISOString(), status: 'dikembalikan' }], search: '', message: null, error: null },
  'user/struk.ejs': {
    title: 'Struk', currentUser: sampleSiswa,
    trx: { id: 'uuid-1234', tanggal_pinjam: new Date().toISOString(), tanggal_kembali: new Date().toISOString(), buku: { judul: 'J', penulis: 'P', kategori: 'K', lokasi: 'Rak' }, anggota: { nama: 'N', nis: 'X', kelas: 'K' } },
    durasiHari: 7, jumlahBuku: 1, message: null, error: null,
  },
  'user/denda.ejs': {
    title: 'Denda', currentUser: sampleSiswa, totalBelumBayar: 10000,
    denda: [{ id: 1, jenis: 'telat', jumlah: 10000, hari_keterlambatan: 1, status: 'belum_bayar', keterangan: 'k', buku: { judul: 'J', cover_url: null, penulis: 'P', kategori: 'Fiksi' } }],
    message: null, error: null,
  },
  'user/bayar-denda.ejs': {
    title: 'Bayar', currentUser: sampleSiswa,
    denda: { id: 1, jenis: 'telat', jumlah: 10000, hari_keterlambatan: 1, keterangan: 'k', buku: { judul: 'J', cover_url: null } },
    infoQris: { nama: 'Perpustakaan', kode: 'ID-001' },
    infoRekening: { bank: 'Bank', nomor: '123', atasNama: 'Perpus' },
    metodeList: { cash: 'Tunai', qris: 'QRIS', transfer: 'Transfer' },
    message: null, error: null,
  },
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
