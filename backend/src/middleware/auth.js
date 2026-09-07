// Authentication middleware checks the signed token sent by the client.
const { verifyAuthToken } = require('../utils/crypto');

const authMiddleware = (req, res, next) => {
  const header = req.get('Authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Authorization token is required.' });
  }

  const user = verifyAuthToken(token);
  if (!user) {
    return res.status(401).json({ message: 'Authorization token is invalid or expired.' });
  }

  req.user = user;
  return next();
};

module.exports = { authMiddleware };
