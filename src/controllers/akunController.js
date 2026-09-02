import { supabase } from '../config/db.js';

export async function showAkun(req, res) {
  if (req.session.user.role !== 'admin') {
    req.session.error = 'Hanya akun Admin yang dapat mengelola akun staf';
    return res.redirect('/admin/dashboard');
  }
  const message = req.session.message || null;
  const error = req.session.error || null;
  delete req.session.message;
  delete req.session.error;

  try {
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .in('role', ['admin', 'petugas'])
      .order('role', { ascending: true })
      .order('username', { ascending: true });

    res.render('admin/akun', { akun: users || [], message, error, title: 'Kelola Akun Admin & Petugas' });
  } catch (e) {
    res.render('admin/akun', {
      akun: [],
      message: null,
      error: e.message,
      title: 'Kelola Akun Admin & Petugas',
    });
  }
}

export async function createAkun(req, res) {
  if (req.session.user.role !== 'admin') return res.redirect('/admin/dashboard');
  const { username, nama, password, role } = req.body;
  const pilihanRole = role === 'petugas' || role === 'admin' ? role : 'petugas';

  if (!username || !nama || !password) {
    req.session.error = 'Username, nama, dan password wajib diisi';
    return res.redirect('/admin/akun');
  }
  if (password.length < 6) {
    req.session.error = 'Password minimal 6 karakter';
    return res.redirect('/admin/akun');
  }

  try {
    const bcrypt = (await import('bcryptjs')).default;
    const passwordHash = await bcrypt.hash(password, 10);

    const { error: err } = await supabase.from('users').insert([
      { username, nama, password_hash: passwordHash, role: pilihanRole },
    ]);
    if (err) {
      if (err.code === '23505') throw new Error('Username sudah digunakan');
      throw err;
    }
    req.session.message = `Akun ${pilihanRole} "${username}" berhasil dibuat`;
  } catch (e) {
    req.session.error = 'Gagal menambahkan akun: ' + e.message;
  }
  res.redirect('/admin/akun');
}

export async function updateAkun(req, res) {
  if (req.session.user.role !== 'admin') return res.redirect('/admin/dashboard');
  const { id } = req.params;
  const { nama, role, password } = req.body;

  try {
    const { data: target } = await supabase.from('users').select('*').eq('id', id).single();
    if (!target) {
      req.session.error = 'Akun tidak ditemukan';
      return res.redirect('/admin/akun');
    }
    if (!['admin', 'petugas'].includes(target.role)) {
      req.session.error = 'Akun ini dikelola lewat menu Kelola Anggota';
      return res.redirect('/admin/akun');
    }

    if (target.role === 'admin' && role === 'petugas') {
      const { count } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin');
      if (count <= 1) {
        req.session.error = 'Tidak dapat menurunkan akun admin terakhir';
        return res.redirect('/admin/akun');
      }
    }

    const patch = { nama, role };
    if (password && password.length > 0) {
      if (password.length < 6) {
        req.session.error = 'Password baru minimal 6 karakter';
        return res.redirect('/admin/akun');
      }
      const bcrypt = (await import('bcryptjs')).default;
      patch.password_hash = await bcrypt.hash(password, 10);
    }

    const { error: err } = await supabase.from('users').update(patch).eq('id', id);
    if (err) throw err;
    if (id === req.session.user.id && role !== 'admin') {
      req.session.user.role = role;
    }
    req.session.message = 'Akun berhasil diperbarui';
  } catch (e) {
    req.session.error = 'Gagal memperbarui akun: ' + e.message;
  }
  res.redirect('/admin/akun');
}

export async function deleteAkun(req, res) {
  if (req.session.user.role !== 'admin') return res.redirect('/admin/dashboard');
  const { id } = req.params;

  try {
    const { data: target } = await supabase.from('users').select('*').eq('id', id).single();
    if (!target) {
      req.session.error = 'Akun tidak ditemukan';
      return res.redirect('/admin/akun');
    }

    if (id === req.session.user.id) {
      req.session.error = 'Tidak dapat menghapus akun yang sedang digunakan';
      return res.redirect('/admin/akun');
    }

    if (target.role === 'admin') {
      const { count } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin');
      if (count <= 1) {
        req.session.error = 'Tidak dapat menghapus akun admin terakhir';
        return res.redirect('/admin/akun');
      }
    }

    const { error: err } = await supabase.from('users').delete().eq('id', id);
    if (err) throw err;
    req.session.message = `Akun "${target.username}" berhasil dihapus`;
  } catch (e) {
    req.session.error = 'Gagal menghapus akun: ' + e.message;
  }
  res.redirect('/admin/akun');
}