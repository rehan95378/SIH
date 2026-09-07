// This service validates login details and returns safe user information.
const userRepository = require('../repository/userRepository');
const { randomUUID } = require('crypto');
const { hashPassword, verifyPassword, createAuthToken } = require('../utils/crypto');

const validateCredentials = ({ email, password } = {}) => {
  if (typeof email !== 'string' || email.trim() === '') {
    const error = new Error('email must be a non-empty string.');
    error.statusCode = 400;
    throw error;
  }

  if (typeof password !== 'string' || password.length < 8) {
    const error = new Error('password must contain at least 8 characters.');
    error.statusCode = 400;
    throw error;
  }
};

const registerUser = async ({ email, password } = {}) => {
  validateCredentials({ email, password });
  const normalisedEmail = email.trim().toLowerCase();
  const user = await userRepository.createUser({
    id: randomUUID(),
    email: normalisedEmail,
    passwordHash: await hashPassword(password),
    role: 'analyst'
  });

  const safeUser = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  return {
    user: safeUser,
    token: createAuthToken(safeUser)
  };
};

const loginUser = async ({ email, password } = {}) => {
  validateCredentials({ email, password });

  const user = await userRepository.getUserByEmail(email.trim().toLowerCase());
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const safeUser = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  return {
    user: safeUser,
    token: createAuthToken(safeUser)
  };
};

module.exports = { loginUser, registerUser };
