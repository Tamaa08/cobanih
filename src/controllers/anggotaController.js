import { supabase } from '../config/db.js';

export async function showAnggota(req, res) {
  const search = req.query.search || '';
  const message = req.session.message || null;
  const error = req.session.error || null;
  delete req.session.message;
  delete req.session.error;

  try {
    let query = supabase.from('anggota').select('*').order('nama', { ascending: true });

    if (search) {
      query = query.or(`nama.ilike.%${search}%,nis.ilike.%${search}%,kelas.ilike.%${search}%`);
    }

    const { data: anggota, error: err } = await query;
    if (err) throw err;

    res.render('admin/anggota', { anggota, search, message, error, title: 'Kelola Anggota' });
  } catch (e) {
    res.render('admin/anggota', {
      anggota: [],
      search,
      message: null,
      error: e.message,
      title: 'Kelola Anggota',
    });
  }
}

export async function createAnggota(req, res) {
  const { nama, kelas, nis, username, password } = req.body;

  if (!nama || !kelas || !nis || !username || !password) {
    req.session.error = 'Semua field wajib diisi';
    return res.redirect('/admin/anggota');
  }

  try {
    const { data: existingNis } = await supabase
      .from('anggota')
      .select('id')
      .eq('nis', nis)
      .maybeSingle();

    if (existingNis) {
      req.session.error = 'NIS sudah terdaftar';
      return res.redirect('/admin/anggota');
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existingUser) {
      req.session.error = 'Username sudah digunakan';
      return res.redirect('/admin/anggota');
    }

    const bcrypt = (await import('bcryptjs')).default;
    const passwordHash = await bcrypt.hash(password, 10);

    const { data: newUser, error: userErr } = await supabase
      .from('users')
      .insert([{ username, password_hash: passwordHash, role: 'siswa', nama }])
      .select()
      .single();

    if (userErr) throw userErr;

    const { error: err } = await supabase.from('anggota').insert([
      { nama, kelas, nis, user_id: newUser.id, status: 'aktif' },
    ]);

    if (err) throw err;
    req.session.message = 'Anggota berhasil ditambahkan';
  } catch (e) {
    req.session.error = 'Gagal menambahkan anggota: ' + e.message;
  }
  res.redirect('/admin/anggota');
}

export async function renderEditAnggota(req, res) {
  const { id } = req.params;
  try {
    const { data: anggota } = await supabase.from('anggota').select('*').eq('id', id).single();
    if (!anggota) {
      req.session.error = 'Anggota tidak ditemukan';
      return res.redirect('/admin/anggota');
    }
    res.render('admin/edit-anggota', { anggota, error: null, title: 'Edit Anggota' });
  } catch (e) {
    req.session.error = e.message;
    res.redirect('/admin/anggota');
  }
}

export async function updateAnggota(req, res) {
  const { id } = req.params;
  const { nama, kelas, nis, status, password } = req.body;

  try {
    if (password && password.length > 0 && password.length < 6) {
      req.session.error = 'Password baru minimal 6 karakter';
      return res.redirect('/admin/anggota/' + id + '/edit');
    }

    const { error: err } = await supabase
      .from('anggota')
      .update({ nama, kelas, nis, status })
      .eq('id', id);

    if (err) throw err;

    if (password && password.length > 0) {
      const { data: anggota } = await supabase.from('anggota').select('user_id').eq('id', id).single();
      if (anggota && anggota.user_id) {
        const bcrypt = (await import('bcryptjs')).default;
        const passwordHash = await bcrypt.hash(password, 10);
        const { error: pwdErr } = await supabase
          .from('users')
          .update({ password_hash: passwordHash })
          .eq('id', anggota.user_id);
        if (pwdErr) throw pwdErr;
      }
    }

    req.session.message = 'Anggota berhasil diperbarui';
  } catch (e) {
    req.session.error = 'Gagal memperbarui anggota: ' + e.message;
  }
  res.redirect('/admin/anggota');
}

export async function deleteAnggota(req, res) {
  const { id } = req.params;
  try {
    const { data: anggota } = await supabase.from('anggota').select('*').eq('id', id).single();

    const { data: aktif } = await supabase
      .from('transaksi')
      .select('id')
      .eq('id_anggota', id)
      .eq('status', 'dipinjam');

    if (aktif && aktif.length > 0) {
      req.session.error = 'Tidak dapat menghapus anggota yang masih meminjam buku';
      return res.redirect('/admin/anggota');
    }

    if (anggota && anggota.user_id) {
      await supabase.from('users').delete().eq('id', anggota.user_id);
    }

    const { error: err } = await supabase.from('anggota').delete().eq('id', id);
    if (err) throw err;
    req.session.message = 'Anggota berhasil dihapus';
  } catch (e) {
    req.session.error = 'Gagal menghapus anggota: ' + e.message;
  }
  res.redirect('/admin/anggota');
}
