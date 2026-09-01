import { supabase } from '../config/db.js';
import bcrypt from 'bcryptjs';

export async function showLogin(req, res) {
  res.render('login', { error: null, message: null, title: 'Login' });
}

export async function login(req, res) {
  const { username, password } = req.body;
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

    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    if (user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    }
    return res.redirect('/user/dashboard');
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
