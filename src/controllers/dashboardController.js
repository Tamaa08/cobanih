import { supabase } from '../config/db.js';

export async function showDashboardAdmin(req, res) {
  try {
    const { count: totalBuku } = await supabase.from('buku').select('*', { count: 'exact', head: true });
    const { count: totalAnggota } = await supabase.from('anggota').select('*', { count: 'exact', head: true });
    const { count: totalPeminjaman } = await supabase
      .from('transaksi')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'dipinjam');
    const { count: totalSelesai } = await supabase
      .from('transaksi')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'dikembalikan');

    const { data: recentTrx } = await supabase
      .from('transaksi')
      .select('*, buku(judul), anggota(nama)')
      .order('tanggal_pinjam', { ascending: false })
      .limit(8);

    const { count: totalDendaBelum = 0 } = await supabase
      .from('denda')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'belum_bayar');

    const { data: dendaBelumRows } = await supabase
      .from('denda')
      .select('jumlah')
      .eq('status', 'belum_bayar');
    const nominalDendaBelum = (dendaBelumRows || []).reduce((s, d) => s + (d.jumlah || 0), 0);

    res.render('admin/dashboard', {
      title: 'Dashboard Admin',
      stats: { totalBuku, totalAnggota, totalPeminjaman, totalSelesai },
      totalDendaBelum,
      nominalDendaBelum,
      recentTrx: recentTrx || [],
      user: req.session.user,
    });
  } catch (e) {
    res.render('admin/dashboard', {
      title: 'Dashboard Admin',
      stats: { totalBuku: 0, totalAnggota: 0, totalPeminjaman: 0, totalSelesai: 0 },
      totalDendaBelum: 0,
      nominalDendaBelum: 0,
      recentTrx: [],
      user: req.session.user,
    });
  }
}
