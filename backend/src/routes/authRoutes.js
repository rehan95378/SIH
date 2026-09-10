// Authentication routes for login and token-based access.
const express = require('express');
const { login, register } = require('../controllers/authController');
const { loginBody, registerBody } = require('../validators/schemas');
const router = express.Router();

router.post('/login', loginBody, login);
router.post('/register', registerBody, register);
router.post('/auth/login', loginBody, login);
router.post('/auth/signup', registerBody, register);

module.exports = router;
