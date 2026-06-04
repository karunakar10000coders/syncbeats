const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const User = require('../models/User');

class AuthService {
  static generateTokens(user) {
    const payload = {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      is_guest: user.is_guest
    };

    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRY
    });

    const refreshToken = jwt.sign({ id: user.id }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRY
    });

    return { accessToken, refreshToken };
  }

  static verifyToken(token, isRefresh = false) {
    try {
      const secret = isRefresh ? env.JWT_REFRESH_SECRET : env.JWT_ACCESS_SECRET;
      return jwt.verify(token, secret);
    } catch (e) {
      return null;
    }
  }

  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  static async comparePassword(password, hash) {
    if (!password || !hash) return false;
    return bcrypt.compare(password, hash);
  }

  static async createGuestUser(displayName) {
    const name = displayName || `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
    const user = await User.create({
      display_name: name,
      auth_provider: 'guest',
      is_guest: true
    });
    return user;
  }
}

module.exports = AuthService;
