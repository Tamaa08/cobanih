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

    const { data: activeTrx } = await supabase
      .from('transaksi')
      .select('*, buku(judul), anggota(nama, kelas, nis)')
      .eq('status', 'dipinjam')
      .order('tanggal_pinjam', { ascending: false })
      .limit(6);
    const now = Date.now();
    const activeLoans = (activeTrx || []).map((t) => ({
      ...t,
      overdue: new Date(t.tanggal_kembali).getTime() < now,
      sisaHari: Math.ceil((new Date(t.tanggal_kembali).getTime() - now) / (1000 * 60 * 60 * 24)),
    }));

    const todays = new Date();
    todays.setHours(0, 0, 0, 0);
    const dayMap = new Map();
    const chartTokens = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todays);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dayMap.set(key, i);
      chartTokens.push(d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }));
    }
    const { data: allTrx } = await supabase
      .from('transaksi')
      .select('tanggal_pinjam')
      .limit(10000);
    const daily = [0, 0, 0, 0, 0, 0, 0];
    for (const t of allTrx || []) {
      const d = new Date(t.tanggal_pinjam);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (dayMap.has(key)) daily[dayMap.get(key)] = (daily[dayMap.get(key)] || 0) + 1;
    }

    res.render('admin/dashboard', {
      title: 'Dashboard Admin',
      stats: { totalBuku, totalAnggota, totalPeminjaman, totalSelesai },
      totalDendaBelum,
      nominalDendaBelum,
      recentTrx: recentTrx || [],
      activeLoans,
      chart: { tokens: chartTokens, daily },
      user: req.session.user,
    });
  } catch (e) {
    res.render('admin/dashboard', {
      title: 'Dashboard Admin',
      stats: { totalBuku: 0, totalAnggota: 0, totalPeminjaman: 0, totalSelesai: 0 },
      totalDendaBelum: 0,
      nominalDendaBelum: 0,
      recentTrx: [],
      activeLoans: [],
      chart: { tokens: [], daily: [] },
      user: req.session.user,
    });
  }
}
