import { Router } from 'express';
import { isAdmin } from '../middleware/auth.js';
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
  updateStatusPengembalian,
  deleteTransaksi,
} from '../controllers/transaksiController.js';

const router = Router();

router.use(isAdmin);

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
router.post('/transaksi/:id/kembalikan', updateStatusPengembalian);
router.post('/transaksi/:id/delete', deleteTransaksi);

export default router;
