import { supabase } from '../config/db.js';
import { formatRupiah } from '../utils/fungsiDenda.js';

export async function showProfil(req, res) {
  const message = req.session.message || null;
  const error = req.session.error || null;
  delete req.session.message;
  delete req.session.error;

  try {
    const { data: anggota } = await supabase
      .from('anggota')
      .select('*')
      .eq('user_id', req.session.user.id)
      .maybeSingle();

    let denda = [];
    let totalBelumBayar = 0;
    if (anggota) {
      const { data } = await supabase
        .from('denda')
        .select('*, buku(judul, cover_url, penulis), transaksi(tanggal_pinjam, tanggal_kembali, tanggal_kembali_aktual)')
        .eq('id_anggota', anggota.id)
        .order('created_at', { ascending: false });
      denda = data || [];
      totalBelumBayar = denda
        .filter((d) => d.status === 'belum_bayar')
        .reduce((s, d) => s + (d.jumlah || 0), 0);
    }

    res.render('user/profil', {
      anggota,
      username: req.session.user.username,
      role: req.session.user.role,
      denda,
      totalBelumBayar,
      formatRupiah,
      message,
      error,
      title: 'Profil Saya',
    });
  } catch (e) {
    res.render('user/profil', {
      anggota: null,
      username: req.session.user.username,
      role: req.session.user.role,
      denda: [],
      totalBelumBayar: 0,
      formatRupiah,
      message: null,
      error: e.message,
      title: 'Profil Saya',
    });
  }
}