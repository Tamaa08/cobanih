import crypto from 'crypto';

const COOKIE_NAME = 'perpustakaan.sid';
const MAX_AGE_MS = 1000 * 60 * 60 * 8; // 8 jam, samakan dengan konfigurasi sebelumnya

function sign(body) {
  return crypto.createHmac('sha256', process.env.SESSION_SECRET || 'rahasia-sesi-app-perpustakaan').update(body).digest('base64url');
}

function encodePayload(payload) {
  const json = JSON.stringify(payload);
  const body = Buffer.from(json, 'utf8').toString('base64url');
  return `${body}.${sign(body)}`;
}

function decodeCookie(token) {
  const sep = token.indexOf('.');
  if (sep < 1) return null;
  const body = token.slice(0, sep);
  const sig = token.slice(sep + 1);
  const expected = sign(body);
  const a = Buffer.from(sig, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload || typeof payload !== 'object') return null;
    if (!payload.__exp || Date.now() > payload.__exp) return null;
    const { __exp, __v, ...rest } = payload;
    return rest;
  } catch {
    return null;
  }
}

function readCookie(header) {
  if (!header) return null;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    const name = part.slice(0, idx).trim();
    if (name === COOKIE_NAME) return decodeCookie(part.slice(idx + 1).trim());
  }
  return null;
}

function setCookie(res, value) {
  res.append(
    'Set-Cookie',
    `${COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(MAX_AGE_MS / 1000)}`
  );
}

function clearCookie(res) {
  res.append(
    'Set-Cookie',
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

/**
 * Sesi berbasis cookie stateless (HMAC-sign).
 * Menggantikan express-session MemoryStore yang tidak persisten di
 * environment serverless (Vercel) sehingga pengguna tidak terlempar
 * kembali ke halaman login saat berpindah instance / cold start.
 */
export function cookieSession() {
  return function sessionMiddleware(req, res, next) {
    const data = readCookie(req.headers.cookie) || {};
    let dirty = false;

    const session = new Proxy(data, {
      set(target, prop, value) {
        target[prop] = value;
        dirty = true;
        return true;
      },
      deleteProperty(target, prop) {
        if (prop in target) {
          delete target[prop];
          dirty = true;
        }
        return true;
      },
    });

    // Sediakan API yang setara dengan express-session yang dipakai di kode
    session.destroy = (cb) => {
      for (const k of Object.keys(data)) delete data[k];
      dirty = false;
      clearCookie(res);
      if (typeof cb === 'function') cb();
    };

    req.session = session;

    const origEnd = res.end;
    res.end = function (...args) {
      if (dirty) {
        const payload = { __exp: Date.now() + MAX_AGE_MS, ...data };
        setCookie(res, encodePayload(payload));
      }
      return origEnd.apply(this, args);
    };

    next();
  };
}