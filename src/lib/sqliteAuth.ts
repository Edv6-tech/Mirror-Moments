import 'server-only';
import { DatabaseSync } from 'node:sqlite';
import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'mirror_moment_session';
const SESSION_DAYS = 30;
const DEFAULT_DB_PATH = path.resolve(process.cwd(), 'data/mirror-moment.sqlite');
const DUMMY_PASSWORD_SALT = '4a6f686e446f654d6972726f724d6f6d656e74';

export interface LocalUser {
  id: string;
  email: string;
  displayName: string;
}

type UserRow = { id: string; email: string; display_name: string };

function database() {
  const databasePath = path.resolve(process.env.SQLITE_DB_PATH || DEFAULT_DB_PATH);
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const db = new DatabaseSync(databasePath, { timeout: 5000 });
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS local_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL DEFAULT '',
      delete_originals INTEGER NOT NULL DEFAULT 1,
      default_body_path TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS local_sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES local_users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS local_sessions_user_id ON local_sessions(user_id);
    CREATE TABLE IF NOT EXISTS local_login_limits (
      rate_key TEXT PRIMARY KEY,
      failures INTEGER NOT NULL DEFAULT 0,
      window_started INTEGER NOT NULL,
      blocked_until INTEGER NOT NULL DEFAULT 0
    );
  `);
  return db;
}

function toUser(row: UserRow): LocalUser {
  return { id: row.id, email: row.email, displayName: row.display_name };
}

function hashSession(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

async function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  const derived = await derivePassword(password, salt);
  return { salt, hash: derived.toString('hex') };
}

async function verifyPassword(password: string, salt: string, expectedHex: string) {
  const derived = await derivePassword(password, salt);
  const expected = Buffer.from(expectedHex, 'hex');
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

function derivePassword(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, derived) => {
      if (error) reject(error);
      else resolve(derived as Buffer);
    });
  });
}

async function createSession(user: LocalUser) {
  const token = randomBytes(32).toString('base64url');
  const expires = Math.floor(Date.now() / 1000) + SESSION_DAYS * 24 * 60 * 60;
  const jar = await cookies();
  const previousToken = jar.get(COOKIE_NAME)?.value;
  const db = database();
  try {
    db.prepare('DELETE FROM local_sessions WHERE expires_at <= ?').run(Math.floor(Date.now() / 1000));
    if (previousToken && previousToken.length <= 100) db.prepare('DELETE FROM local_sessions WHERE token_hash = ?').run(hashSession(previousToken));
    db.prepare('INSERT INTO local_sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
      .run(hashSession(token), user.id, expires, new Date().toISOString());
  } finally {
    db.close();
  }
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(expires * 1000),
  });
}

export async function registerLocalUser(emailInput: string, password: string, displayName: string): Promise<LocalUser> {
  const email = emailInput.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');
  if (password.length < 8 || password.length > 256) throw new Error('Password must be between 8 and 256 characters.');
  if (!displayName.trim()) throw new Error('Enter your name.');
  const credentials = await hashPassword(password);
  const user: LocalUser = { id: randomUUID(), email, displayName: displayName.trim().slice(0, 80) };
  const db = database();
  try {
    db.prepare('INSERT INTO local_users (id, email, password_hash, display_name, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(user.id, user.email, `${credentials.salt}:${credentials.hash}`, user.displayName, new Date().toISOString());
  } catch (error) {
    if (error instanceof Error && /UNIQUE constraint failed/i.test(error.message)) throw new Error('An account with this email already exists. Sign in instead.');
    throw error;
  } finally {
    db.close();
  }
  await createSession(user);
  return user;
}

export async function signInLocalUser(emailInput: string, password: string, rateKey: string): Promise<LocalUser> {
  const email = emailInput.trim().toLowerCase();
  const db = database();
  let row: (UserRow & { password_hash: string }) | undefined;
  const now = Math.floor(Date.now() / 1000);
  try {
    const limit = db.prepare('SELECT failures, window_started, blocked_until FROM local_login_limits WHERE rate_key = ?').get(rateKey) as { failures: number; window_started: number; blocked_until: number } | undefined;
    if (limit && limit.blocked_until > now) throw new Error('Too many sign-in attempts. Try again in 15 minutes.');
    row = db.prepare('SELECT id, email, display_name, password_hash FROM local_users WHERE email = ? COLLATE NOCASE').get(email) as typeof row;
  } finally {
    db.close();
  }
  const [salt, hash] = row?.password_hash.split(':') ?? ['', ''];
  const passwordMatches = row && salt && hash
    ? await verifyPassword(password, salt, hash)
    : Boolean(await derivePassword(password, DUMMY_PASSWORD_SALT));
  const valid = Boolean(row && passwordMatches);
  if (!valid || !row) {
    const writeDb = database();
    try {
      const previous = writeDb.prepare('SELECT failures, window_started FROM local_login_limits WHERE rate_key = ?').get(rateKey) as { failures: number; window_started: number } | undefined;
      const windowStarted = previous && now - previous.window_started < 900 ? previous.window_started : now;
      const failures = previous && windowStarted === previous.window_started ? previous.failures + 1 : 1;
      const blockedUntil = failures >= 5 ? now + 900 : 0;
      writeDb.prepare(`INSERT INTO local_login_limits (rate_key, failures, window_started, blocked_until) VALUES (?, ?, ?, ?)
        ON CONFLICT(rate_key) DO UPDATE SET failures = excluded.failures, window_started = excluded.window_started, blocked_until = excluded.blocked_until`)
        .run(rateKey, failures, windowStarted, blockedUntil);
    } finally { writeDb.close(); }
    throw new Error('That email and password combination wasn’t recognized. Check them and try again.');
  }
  const clearDb = database();
  try { clearDb.prepare('DELETE FROM local_login_limits WHERE rate_key = ?').run(rateKey); }
  finally { clearDb.close(); }
  const user = toUser(row);
  await createSession(user);
  return user;
}

export async function getLocalUser(): Promise<LocalUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token || token.length > 100) return null;
  const db = database();
  try {
    const row = db.prepare(`
      SELECT u.id, u.email, u.display_name
      FROM local_sessions s JOIN local_users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > ?
    `).get(hashSession(token), Math.floor(Date.now() / 1000)) as UserRow | undefined;
    return row ? toUser(row) : null;
  } finally {
    db.close();
  }
}

export async function getLocalUserForRequest(request: Request): Promise<LocalUser | null> {
  const token = request.headers.get('cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
  if (!token || token.length > 100) return null;
  let decodedToken: string;
  try { decodedToken = decodeURIComponent(token); } catch { return null; }
  const db = database();
  try {
    const row = db.prepare(`
      SELECT u.id, u.email, u.display_name
      FROM local_sessions s JOIN local_users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > ?
    `).get(hashSession(decodedToken), Math.floor(Date.now() / 1000)) as UserRow | undefined;
    return row ? toUser(row) : null;
  } finally {
    db.close();
  }
}

export async function signOutLocalUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token && token.length <= 100) {
    const db = database();
    try { db.prepare('DELETE FROM local_sessions WHERE token_hash = ?').run(hashSession(token)); }
    finally { db.close(); }
  }
  jar.set(COOKIE_NAME, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', expires: new Date(0) });
}

export async function removeLocalUser(userId: string) {
  const db = database();
  try { db.prepare('DELETE FROM local_users WHERE id = ?').run(userId); }
  finally { db.close(); }
}

export async function readLocalProfile(userId: string) {
  const db = database();
  try {
    const row = db.prepare('SELECT display_name, delete_originals, default_body_path FROM local_users WHERE id = ?').get(userId) as { display_name: string; delete_originals: number; default_body_path: string | null } | undefined;
    return row ? { display_name: row.display_name, delete_originals: Boolean(row.delete_originals), default_body_path: row.default_body_path } : null;
  } finally { db.close(); }
}

export async function updateLocalProfile(userId: string, update: { display_name?: string; delete_originals?: boolean; default_body_path?: string | null }) {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];
  if (update.display_name !== undefined) { fields.push('display_name = ?'); values.push(update.display_name); }
  if (update.delete_originals !== undefined) { fields.push('delete_originals = ?'); values.push(update.delete_originals ? 1 : 0); }
  if (update.default_body_path !== undefined) { fields.push('default_body_path = ?'); values.push(update.default_body_path); }
  if (!fields.length) return;
  values.push(userId);
  const db = database();
  try { db.prepare(`UPDATE local_users SET ${fields.join(', ')} WHERE id = ?`).run(...values); }
  finally { db.close(); }
}
