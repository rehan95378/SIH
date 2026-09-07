// Shared password helpers. Passwords are never stored as plain text.
const crypto = require('crypto');

const getTokenSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'replace-with-a-long-secret') {
    throw new Error('JWT_SECRET must be configured before authentication is used.');
  }

  return secret;
};

const hashPassword = async (password) => {
  if (typeof password !== 'string' || password.length < 8) {
    throw new Error('Password must contain at least 8 characters.');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });

  return `${salt}:${derivedKey.toString('hex')}`;
};

const verifyPassword = async (password, storedPassword) => {
  const [salt, storedKey] = String(storedPassword).split(':');
  if (!salt || !storedKey) return false;

  const derivedKey = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });

  const expectedKey = Buffer.from(storedKey, 'hex');
  return expectedKey.length === derivedKey.length
    && crypto.timingSafeEqual(expectedKey, derivedKey);
};

// Creates a small signed token without adding another dependency.
const createAuthToken = ({ id, email, role }, expiresInSeconds = 3600) => {
  const payload = {
    sub: id,
    email,
    role,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getTokenSecret())
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
};

const verifyAuthToken = (token) => {
  const [encodedPayload, signature] = String(token).split('.');
  if (!encodedPayload || !signature) return null;

  const expectedSignature = crypto
    .createHmac('sha256', getTokenSecret())
    .update(encodedPayload)
    .digest('base64url');
  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (
    actual.length !== expected.length
    || !crypto.timingSafeEqual(actual, expected)
  ) {
    return null;
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  } catch (error) {
    return null;
  }

  if (!payload.sub || !payload.email || !payload.role || payload.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role
  };
};

module.exports = {
  hashPassword,
  verifyPassword,
  createAuthToken,
  verifyAuthToken
};
