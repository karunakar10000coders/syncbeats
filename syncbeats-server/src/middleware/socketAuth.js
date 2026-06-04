const AuthService = require('../services/auth.service');
const logger = require('../utils/logger');

const authorizeSocket = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    
    if (!token) {
      logger.warn('Socket connection rejected: No token provided.');
      return next(new Error('Authentication token required'));
    }

    const decoded = AuthService.verifyToken(token);
    if (!decoded) {
      logger.warn('Socket connection rejected: Invalid or expired token.');
      return next(new Error('Invalid or expired authentication token'));
    }

    // Attach decoded user info to the socket instance
    socket.user = decoded;
    next();
  } catch (err) {
    logger.error('Socket authentication middleware error: %O', err);
    next(new Error('Internal connection authorization error'));
  }
};

module.exports = authorizeSocket;
