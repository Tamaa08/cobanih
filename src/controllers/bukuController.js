import { supabase } from '../config/db.js';
import crypto from 'crypto';

const BUCKET = 'covers';

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = (buckets || []).some((b) => b.name === BUCKET);
  if (!exists) {
    await supabase.storage.createBucket(BUCKET, { public: true });
  }
}

function getPublicUrl(path) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadCoverImage(file) {
  if (!file) return null;
  await ensureBucket();
  const ext = file.originalname.split('.').pop().toLowerCase();
  const fileName = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });
  if (upErr) throw new Error('Gagal upload sampul: ' + upErr.message);
  return getPublicUrl(fileName);
}

export async function deleteCoverImage(url) {
  if (!url) return;
  try {
    const path = decodeURIComponent(url.split('/').pop() || '');
    if (!path) return;
    await supabase.storage.from(BUCKET).remove([path]);
  } catch {
    // abaikan bila gagal menghapus file storage
  }
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
  const { judul, penulis, penerbit, tahun_terbit, kategori, stok, lokasi, deskripsi, rating, isbn } = req.body;

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

    const cover_url = await uploadCoverImage(req.file);

    const ratingNum = parseFloat(rating);
    const initialRating = !isNaN(ratingNum) && ratingNum >= 0 && ratingNum <= 5 ? ratingNum : 0;
    const initialCount = initialRating > 0 ? 1 : 0;

    const { error: err } = await supabase.from('buku').insert([
      {
        judul,
        penulis,
        penerbit: penerbit || null,
        tahun_terbit: tahun_terbit ? parseInt(tahun_terbit) : null,
        kategori,
        stok: parseInt(stok) || 0,
        lokasi: lokasi || null,
        cover_url,
        deskripsi: deskripsi || null,
        isbn: isbn || null,
        rating: initialRating,
        rating_count: initialCount,
      },
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
  const { judul, penulis, penerbit, tahun_terbit, kategori, stok, lokasi, deskripsi, isbn } = req.body;

  try {
    const { data: current } = await supabase.from('buku').select('cover_url').eq('id', id).single();

    let cover_url = current ? current.cover_url : null;
    if (req.file) {
      const newUrl = await uploadCoverImage(req.file);
      if (newUrl) {
        await deleteCoverImage(cover_url);
        cover_url = newUrl;
      }
    }

    const { error: err } = await supabase
      .from('buku')
      .update({
        judul,
        penulis,
        penerbit: penerbit || null,
        tahun_terbit: tahun_terbit ? parseInt(tahun_terbit) : null,
        kategori,
        stok: parseInt(stok) || 0,
        lokasi: lokasi || null,
        cover_url,
        deskripsi: deskripsi || null,
        isbn: isbn || null,
      })
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

    const { data: bukuRow } = await supabase.from('buku').select('cover_url').eq('id', id).single();
    const { error: err } = await supabase.from('buku').delete().eq('id', id);
    if (err) throw err;
    if (bukuRow) await deleteCoverImage(bukuRow.cover_url);
    req.session.message = 'Buku berhasil dihapus';
  } catch (e) {
    req.session.error = 'Gagal menghapus buku: ' + e.message;
  }
  res.redirect('/admin/buku');
}
