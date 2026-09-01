import { supabase } from '../config/db.js';
import bcrypt from 'bcryptjs';

export async function showRegister(req, res) {
  res.render('register', { error: null, message: null, title: 'Daftar Anggota' });
}

export async function register(req, res) {
  const { nama, kelas, nis, username, password, confirm_password } = req.body;
  let error = null;

  if (!nama || !kelas || !nis || !username || !password) {
    error = 'Semua field wajib diisi';
  } else if (password !== confirm_password) {
    error = 'Password dan konfirmasi password tidak sama';
  } else if (password.length < 6) {
    error = 'Password minimal 6 karakter';
  }

  if (error) {
    return res.render('register', { error, message: null, title: 'Daftar Anggota' });
  }

  try {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existingUser) {
      error = 'Username sudah digunakan';
      return res.render('register', { error, message: null, title: 'Daftar Anggota' });
    }

    const { data: existingNis } = await supabase
      .from('anggota')
      .select('id')
      .eq('nis', nis)
      .maybeSingle();

    if (existingNis) {
      error = 'NIS sudah terdaftar';
      return res.render('register', { error, message: null, title: 'Daftar Anggota' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { data: newUser, error: userErr } = await supabase
      .from('users')
      .insert([{ username, password_hash: passwordHash, role: 'siswa', nama, kelas, nis }])
      .select()
      .single();

    if (userErr) {
      error = 'Gagal mendaftar: ' + userErr.message;
      return res.render('register', { error, message: null, title: 'Daftar Anggota' });
    }

    const { error: anggotaErr } = await supabase
      .from('anggota')
      .insert([{ nama, kelas, nis, user_id: newUser.id, status: 'aktif' }]);

    if (anggotaErr) {
      error = 'Gagal membuat data anggota: ' + anggotaErr.message;
      return res.render('register', { error, message: null, title: 'Daftar Anggota' });
    }

    return res.render('register', {
      error: null,
      message: 'Pendaftaran berhasil! Silakan login.',
      title: 'Daftar Anggota',
    });
  } catch (e) {
    error = 'Terjadi kesalahan: ' + e.message;
    return res.render('register', { error, message: null, title: 'Daftar Anggota' });
  }
}
