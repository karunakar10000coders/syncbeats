const User = require('../models/User');
const AuthService = require('../services/auth.service');
const { z } = require('zod');

class AuthController {
  static async register(req, res, next) {
    try {
      const { display_name, email, password } = req.body;

      const existing = await User.findByEmail(email);
      if (existing) {
        return res.status(400).json({
          success: false,
          error: { code: 'EMAIL_IN_USE', message: 'Email address is already in use' }
        });
      }

      const passwordHash = await AuthService.hashPassword(password);
      const user = await User.create({
        display_name,
        email,
        password_hash: passwordHash,
        auth_provider: 'email',
        is_guest: false
      });

      const { accessToken, refreshToken } = AuthService.generateTokens(user);

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            display_name: user.display_name,
            email: user.email,
            avatar_url: user.avatar_url,
            is_guest: user.is_guest
          },
          accessToken,
          refreshToken
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await User.findByEmail(email);
      if (!user || user.is_guest) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
        });
      }

      const isMatch = await AuthService.comparePassword(password, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
        });
      }

      const { accessToken, refreshToken } = AuthService.generateTokens(user);

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            display_name: user.display_name,
            email: user.email,
            avatar_url: user.avatar_url,
            is_guest: user.is_guest
          },
          accessToken,
          refreshToken
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async guest(req, res, next) {
    try {
      const { display_name } = req.body;
      const user = await AuthService.createGuestUser(display_name);
      const { accessToken, refreshToken } = AuthService.generateTokens(user);

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            display_name: user.display_name,
            email: user.email,
            avatar_url: user.avatar_url,
            is_guest: user.is_guest
          },
          accessToken,
          refreshToken
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async refreshToken(req, res, next) {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({
          success: false,
          error: { code: 'REFRESH_TOKEN_REQUIRED', message: 'Refresh token is required' }
        });
      }

      const decoded = AuthService.verifyToken(token, true);
      if (!decoded) {
        return res.status(401).json({
          success: false,
          error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token is invalid or expired' }
        });
      }

      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User not found' }
        });
      }

      const tokens = AuthService.generateTokens(user);
      res.status(200).json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async logout(req, res, next) {
    try {
      // In production, you would blacklist this refresh token in Redis.
      res.status(200).json({
        success: true,
        data: { message: 'Logged out successfully' }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuthController;
