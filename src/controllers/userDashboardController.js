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
    if (idAnggota) {
      const { data } = await supabase
        .from('transaksi')
        .select('*, buku(judul, penulis)')
        .eq('id_anggota', idAnggota)
        .order('tanggal_pinjam', { ascending: false })
        .limit(10);
      myTrx = data || [];
    }

    res.render('user/dashboard', {
      title: 'Dashboard Siswa',
      nama: user.nama || 'Siswa',
      anggota,
      stats: { totalPinjam, totalKembali },
      myTrx,
    });
  } catch (e) {
    res.render('user/dashboard', {
      title: 'Dashboard Siswa',
      nama: req.session.user.nama || 'Siswa',
      anggota: null,
      stats: { totalPinjam: 0, totalKembali: 0 },
      myTrx: [],
    });
  }
}
