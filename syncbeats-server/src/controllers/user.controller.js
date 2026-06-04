const User = require('../models/User');

class UserController {
  static async getProfile(req, res, next) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User not found' }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          id: user.id,
          display_name: user.display_name,
          email: user.email,
          avatar_url: user.avatar_url,
          is_guest: user.is_guest,
          created_at: user.created_at
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const { display_name, avatar_url } = req.body;
      const updated = await User.update(req.user.id, {
        display_name,
        avatar_url
      });

      res.status(200).json({
        success: true,
        data: {
          id: updated.id,
          display_name: updated.display_name,
          email: updated.email,
          avatar_url: updated.avatar_url,
          is_guest: updated.is_guest
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = UserController;
