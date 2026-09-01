import { Router } from 'express';
import { isSiswa } from '../middleware/auth.js';
import { showDashboardUser } from '../controllers/userDashboardController.js';
import {
  showPeminjamanBooking,
  createPeminjamanUser,
} from '../controllers/userPeminjamanController.js';
import { showPengembalian, processPengembalian } from '../controllers/userPengembalianController.js';
import { showKatalog, showRiwayat } from '../controllers/userCariController.js';

const router = Router();

router.use(isSiswa);

router.get('/dashboard', showDashboardUser);

router.get('/katalog', showKatalog);

router.get('/peminjaman', showPeminjamanBooking);
router.post('/peminjaman', createPeminjamanUser);

router.get('/pengembalian', showPengembalian);
router.post('/pengembalian/:id', processPengembalian);

router.get('/riwayat', showRiwayat);

export default router;
