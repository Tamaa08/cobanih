import { supabase } from '../config/db.js';
import bcrypt from 'bcryptjs';

export async function showLogin(req, res) {
  res.render('login', { error: null, message: null, title: 'Login' });
}

const ROLE_LABEL = { admin: 'Admin', petugas: 'Petugas', siswa: 'Siswa' };

export async function login(req, res) {
  const { username, password, role: selectedRole } = req.body;
  const chosenRole = selectedRole === 'petugas' || selectedRole === 'admin' || selectedRole === 'siswa'
    ? selectedRole
    : null;
  let error = null;

  try {
    const { data: user, error: err } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (err || !user) {
      error = 'Username atau password salah';
    } else {
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        error = 'Username atau password salah';
      }
    }

    if (error) {
      return res.render('login', { error, message: null, title: 'Login' });
    }

    if (chosenRole && user.role !== chosenRole) {
      const pokok = chosenRole === 'siswa' ? 'login sebagai Siswa' : `pilih tab ${ROLE_LABEL[chosenRole]}`;
      error = `Login role tidak cocok. Akun ini berperan ${ROLE_LABEL[user.role]}, silakan ${pokok} pada tab di atas.`;
      return res.render('login', { error, message: null, title: 'Login' });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    if (user.role === 'siswa') {
      return res.redirect('/user/dashboard');
    }
    return res.redirect('/admin/dashboard');
  } catch (e) {
    error = 'Terjadi kesalahan: ' + e.message;
    return res.render('login', { error, message: null, title: 'Login' });
  }
}

export function logout(req, res) {
  req.session.destroy(() => {
    res.redirect('/login');
  });
}
