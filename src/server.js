import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { cookieSession } from './middleware/session.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

async function runMigrations() {
  try {
    const { supabase } = await import('./config/db.js');
    await supabase.rpc('add_cover_url_column');
    await supabase.rpc('ensure_covers_bucket');
  } catch (e) {
    // Abaikan bila RPC tidak tersedia (mis. belum menjalankan SQL migrasi).
    console.error('[migrasi] Tidak dapat menjalankan auto-migrasi:', e?.message || e);
  }
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(
  cookieSession()
);

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/user', userRoutes);

app.get('/', (req, res) => {
  if (req.session.user) {
    if (req.session.user.role === 'admin') return res.redirect('/admin/dashboard');
    return res.redirect('/user/dashboard');
  }
  res.render('landing', { title: 'Perpustakaan SMA N 1 Sleman' });
});

app.use((req, res) => {
  res.status(404).render('404', { title: 'Halaman Tidak Ditemukan' });
});

export default app;

const isServerless = process.env.VERCEL === '1';
if (!isServerless) {
  runMigrations();
  app.listen(PORT, () => {
    console.log(`Aplikasi Perpustakaan Sekolah berjalan di http://localhost:${PORT}`);
  });
}
