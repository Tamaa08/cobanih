import { supabase } from '../config/db.js';

export async function showDashboardUser(req, res) {
  try {
    const user = req.session.user;
    const { data: anggota } = await supabase
      .from('anggota')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const idAnggota = anggota ? anggota.id : null;

    let { count: totalPinjam = 0 } = await supabase
      .from('transaksi')
      .select('*', { count: 'exact', head: true })
      .eq('id_anggota', idAnggota)
      .eq('status', 'dipinjam');

    let { count: totalKembali = 0 } = await supabase
      .from('transaksi')
      .select('*', { count: 'exact', head: true })
      .eq('id_anggota', idAnggota)
      .eq('status', 'dikembalikan');

    let myTrx = [];
    let totalDenda = 0;
    let jumlahDenda = 0;
    if (idAnggota) {
      const { data } = await supabase
        .from('transaksi')
        .select('*, buku(judul, penulis)')
        .eq('id_anggota', idAnggota)
        .order('tanggal_pinjam', { ascending: false })
        .limit(10);
      myTrx = data || [];

      const { count: dendaCount = 0 } = await supabase
        .from('denda')
        .select('*', { count: 'exact', head: true })
        .eq('id_anggota', idAnggota)
        .eq('status', 'belum_bayar');
      totalDenda = dendaCount;

      const { data: dendaBelum } = await supabase
        .from('denda')
        .select('jumlah')
        .eq('id_anggota', idAnggota)
        .eq('status', 'belum_bayar');
      jumlahDenda = (dendaBelum || []).reduce((s, d) => s + (d.jumlah || 0), 0);
    }

    res.render('user/dashboard', {
      title: 'Dashboard Siswa',
      nama: user.nama || 'Siswa',
      anggota,
      stats: { totalPinjam, totalKembali, totalDenda },
      totalDenda,
      jumlahDenda,
      myTrx,
    });
  } catch (e) {
    res.render('user/dashboard', {
      title: 'Dashboard Siswa',
      nama: req.session.user.nama || 'Siswa',
      anggota: null,
      stats: { totalPinjam: 0, totalKembali: 0, totalDenda: 0 },
      totalDenda: 0,
      jumlahDenda: 0,
      myTrx: [],
    });
  }
}
