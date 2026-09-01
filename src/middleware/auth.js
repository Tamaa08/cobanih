export function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.redirect('/login');
}

export function isAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  return res.redirect('/login');
}

export function isSiswa(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'siswa') {
    return next();
  }
  return res.redirect('/login');
}
