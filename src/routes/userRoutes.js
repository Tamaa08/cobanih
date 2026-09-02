import { Router } from 'express';
import { isSiswa } from '../middleware/auth.js';
import { showDashboardUser } from '../controllers/userDashboardController.js';
import {
  showPeminjamanBooking,
  createPeminjamanUser,
} from '../controllers/userPeminjamanController.js';
import { showPengembalian, processPengembalian } from '../controllers/userPengembalianController.js';
import { showKatalog, showRiwayat, showBukuDetail } from '../controllers/userCariController.js';
import { rateBook } from '../controllers/ratingController.js';

const router = Router();

router.use(isSiswa);

router.get('/dashboard', showDashboardUser);

router.get('/katalog', showKatalog);
router.get('/buku/:id', showBukuDetail);

router.get('/peminjaman', showPeminjamanBooking);
router.post('/peminjaman', createPeminjamanUser);

router.get('/pengembalian', showPengembalian);
router.post('/pengembalian/:id', processPengembalian);

router.get('/riwayat', showRiwayat);

router.post('/rate', rateBook);

export default router;
