const AuthService = require('../services/auth.service');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authorization header is missing or malformed' }
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = AuthService.verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Token is invalid or expired' }
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    logger.error('Authentication middleware error: %O', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An internal authentication error occurred' }
    });
  }
};

module.exports = authenticate;
