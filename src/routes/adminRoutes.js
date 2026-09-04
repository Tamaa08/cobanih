import { Router } from 'express';
import { isStaff } from '../middleware/auth.js';
import { showDashboardAdmin } from '../controllers/dashboardController.js';
import {
  showBuku,
  createBuku,
  renderEditBuku,
  updateBuku,
  deleteBuku,
} from '../controllers/bukuController.js';
import {
  showAnggota,
  createAnggota,
  renderEditAnggota,
  updateAnggota,
  deleteAnggota,
} from '../controllers/anggotaController.js';
import {
  showTransaksi,
  createPeminjamanAdmin,
  renderEditTransaksi,
  updateTransaksi,
  deleteTransaksi,
  setujuiPeminjaman,
  tolakPeminjaman,
  setujuiPengembalian,
} from '../controllers/transaksiController.js';
import { showLaporan, generateLaporanPdf, generateLaporanExcel, renderLaporanCetak } from '../controllers/laporanController.js';
import {
  showAkun,
  createAkun,
  updateAkun,
  deleteAkun,
} from '../controllers/akunController.js';
import { showStatistik } from '../controllers/statistikController.js';
import { showPengaturan, updatePengaturan } from '../controllers/pengaturanController.js';
import {
  showBantuanAdmin,
  jawabBantuan,
  tandaiSelesaiBantuan,
} from '../controllers/adminBantuanController.js';
import {
  showDenda,
  createDendaRusakHilang,
  markDendaLunas,
  deleteDenda,
} from '../controllers/adminDendaController.js';

const router = Router();

// Admin ATAU Petugas dapat membuka halaman /admin/*
router.use(isStaff);

// Kelola akun Admin/Petugas: khusus Admin
const adminOnly = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'admin') return next();
  return res.redirect('/admin/dashboard');
};

router.get('/akun', adminOnly, showAkun);
router.post('/akun', adminOnly, createAkun);
router.post('/akun/:id/edit', adminOnly, updateAkun);
router.post('/akun/:id/delete', adminOnly, deleteAkun);

router.get('/dashboard', showDashboardAdmin);

router.get('/buku', showBuku);
router.post('/buku', createBuku);
router.get('/buku/:id/edit', renderEditBuku);
router.post('/buku/:id/edit', updateBuku);
router.post('/buku/:id/delete', deleteBuku);

router.get('/anggota', showAnggota);
router.post('/anggota', createAnggota);
router.get('/anggota/:id/edit', renderEditAnggota);
router.post('/anggota/:id/edit', updateAnggota);
router.post('/anggota/:id/delete', deleteAnggota);

router.get('/transaksi', showTransaksi);
router.post('/transaksi/peminjaman', createPeminjamanAdmin);
router.post('/transaksi/:id/setujui', setujuiPeminjaman);
router.post('/transaksi/:id/tolak', tolakPeminjaman);
router.post('/transaksi/:id/setujui-kembali', setujuiPengembalian);
router.get('/transaksi/:id/edit', renderEditTransaksi);
router.post('/transaksi/:id/delete', deleteTransaksi);

router.get('/laporan', showLaporan);
router.get('/laporan/pdf', generateLaporanPdf);
router.get('/laporan/excel', generateLaporanExcel);
router.get('/laporan/cetak', renderLaporanCetak);

router.get('/statistik', showStatistik);

router.get('/pengaturan', showPengaturan);
router.post('/pengaturan', updatePengaturan);

router.get('/bantuan', showBantuanAdmin);
router.post('/bantuan/:id/jawab', jawabBantuan);
router.post('/bantuan/:id/selesai', tandaiSelesaiBantuan);

router.get('/denda', showDenda);
router.post('/denda', createDendaRusakHilang);
router.post('/denda/:id/lunas', markDendaLunas);
router.post('/denda/:id/delete', deleteDenda);

export default router;
