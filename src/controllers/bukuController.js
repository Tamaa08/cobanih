import { supabase } from '../config/db.js';

// Deteksi kolom "kualitas" (ditambahkan lewat migrasi SQL di Supabase Dashboard).
// Selama kolom belum ada, aplikasi tetap berfungsi penuh tanpa fitur kualitas;
// begitu migrasi dijalankan, fitur kualitas aktif otomatis.
let _kualitasAvailable = null;
async function kualitasColumnExists() {
  if (_kualitasAvailable !== null) return _kualitasAvailable;
  try {
    const { error } = await supabase.from('buku').select('kualitas').limit(0);
    _kualitasAvailable = !error;
  } catch {
    _kualitasAvailable = false;
  }
  return _kualitasAvailable;
}

export async function showBuku(req, res) {
  const search = req.query.search || '';
  const kategori = req.query.kategori || '';
  const message = req.session.message || null;
  const error = req.session.error || null;
  delete req.session.message;
  delete req.session.error;

  try {
    let query = supabase.from('buku').select('*').order('judul', { ascending: true });

    if (search) {
      query = query.or(`judul.ilike.%${search}%,kategori.ilike.%${search}%,penulis.ilike.%${search}%,isbn.ilike.%${search}%`);
    }
    if (kategori) {
      query = query.eq('kategori', kategori);
    }

    const { data: buku, error: err } = await query;
    if (err) throw err;

    const { data: katRows } = await supabase.from('buku').select('kategori');
    const kategoriList = [...new Set((katRows || []).map((k) => k.kategori))].sort();

    res.render('admin/buku', { buku, search, kategori, kategoriList, message, error, title: 'Kelola Data Buku' });
  } catch (e) {
    res.render('admin/buku', {
      buku: [],
      search,
      kategori,
      kategoriList: [],
      message: null,
      error: e.message,
      title: 'Kelola Data Buku',
    });
  }
}

export async function createBuku(req, res) {
  const { judul, penulis, penerbit, tahun_terbit, kategori, stok, lokasi, deskripsi, rating, isbn, kualitas, cover_url } = req.body;

  if (!judul || !penulis || !kategori || !stok) {
    req.session.error = 'Judul, penulis, kategori, dan stok wajib diisi';
    return res.redirect('/admin/buku');
  }

  try {
    const { data: existing } = await supabase
      .from('buku')
      .select('id')
      .eq('judul', judul)
      .eq('penulis', penulis)
      .maybeSingle();

    if (existing) {
      req.session.error = 'Buku dengan judul dan penulis yang sama sudah ada';
      return res.redirect('/admin/buku');
    }

    const ratingNum = parseFloat(rating);
    const initialRating = !isNaN(ratingNum) && ratingNum >= 0 && ratingNum <= 5 ? ratingNum : 0;
    const initialCount = initialRating > 0 ? 1 : 0;

    const row = {
      judul,
      penulis,
      penerbit: penerbit || null,
      tahun_terbit: tahun_terbit ? parseInt(tahun_terbit) : null,
      kategori,
      stok: parseInt(stok) || 0,
      lokasi: lokasi || null,
      cover_url: cover_url || null,
      deskripsi: deskripsi || null,
      isbn: isbn || null,
      rating: initialRating,
      rating_count: initialCount,
    };
    if (await kualitasColumnExists()) {
      row.kualitas = kualitas || null;
    }

    const { error: err } = await supabase.from('buku').insert([
      row,
    ]);

    if (err) throw err;
    req.session.message = 'Buku berhasil ditambahkan';
  } catch (e) {
    req.session.error = 'Gagal menambahkan buku: ' + e.message;
  }
  res.redirect('/admin/buku');
}

export async function renderEditBuku(req, res) {
  const { id } = req.params;
  try {
    const { data: buku } = await supabase.from('buku').select('*').eq('id', id).single();
    if (!buku) {
      req.session.error = 'Buku tidak ditemukan';
      return res.redirect('/admin/buku');
    }
    res.render('admin/edit-buku', { buku, error: null, title: 'Edit Buku' });
  } catch (e) {
    req.session.error = e.message;
    res.redirect('/admin/buku');
  }
}

export async function updateBuku(req, res) {
  const { id } = req.params;
  const { judul, penulis, penerbit, tahun_terbit, kategori, stok, lokasi, deskripsi, isbn, kualitas, cover_url } = req.body;

  try {
    const fields = {
      judul,
      penulis,
      penerbit: penerbit || null,
      tahun_terbit: tahun_terbit ? parseInt(tahun_terbit) : null,
      kategori,
      stok: parseInt(stok) || 0,
      lokasi: lokasi || null,
      cover_url: cover_url || null,
      deskripsi: deskripsi || null,
      isbn: isbn || null,
    };
    if (await kualitasColumnExists()) {
      fields.kualitas = kualitas || null;
    }

    const { error: err } = await supabase
      .from('buku')
      .update(fields)
      .eq('id', id);

    if (err) throw err;
    req.session.message = 'Buku berhasil diperbarui';
  } catch (e) {
    req.session.error = 'Gagal memperbarui buku: ' + e.message;
  }
  res.redirect('/admin/buku');
}

export async function deleteBuku(req, res) {
  const { id } = req.params;
  try {
    const { data: aktif } = await supabase
      .from('transaksi')
      .select('id')
      .eq('id_buku', id)
      .eq('status', 'dipinjam');

    if (aktif && aktif.length > 0) {
      req.session.error = 'Tidak dapat menghapus buku yang sedang dipinjam';
      return res.redirect('/admin/buku');
    }

    const { error: err } = await supabase.from('buku').delete().eq('id', id);
    if (err) throw err;
    req.session.message = 'Buku berhasil dihapus';
  } catch (e) {
    req.session.error = 'Gagal menghapus buku: ' + e.message;
  }
  res.redirect('/admin/buku');
}
