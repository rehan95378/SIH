// Auth controller receives login requests and returns the authenticated user.
const { asyncHandler } = require('../utils/asyncHandler');
const { loginUser, registerUser } = require('../services/authService');

const login = asyncHandler(async (req, res) => {
  const result = await loginUser(req.body);
  return res.json(result);
});

const register = asyncHandler(async (req, res) => {
  const user = await registerUser(req.body);
  return res.status(201).json({ user });
});

module.exports = { login, register };
