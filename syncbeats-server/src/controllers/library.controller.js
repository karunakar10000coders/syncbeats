const Song = require('../models/Song');
const MatchingService = require('../services/matching.service');

class LibraryController {
  static async syncLibrary(req, res, next) {
    try {
      const { songs } = req.body;
      if (!Array.isArray(songs)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_FORMAT', message: 'Songs parameter must be an array' }
        });
      }

      const synced = await Song.bulkCreate(req.user.id, songs);

      res.status(200).json({
        success: true,
        data: {
          count: synced.length,
          songs: synced
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async getLibrary(req, res, next) {
    try {
      const songs = await Song.findByUser(req.user.id);
      res.status(200).json({
        success: true,
        data: songs
      });
    } catch (err) {
      next(err);
    }
  }

  static async removeSong(req, res, next) {
    try {
      await Song.remove(req.user.id, req.params.songId);
      res.status(200).json({
        success: true,
        data: { message: 'Song removed from library successfully' }
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMatchStatus(req, res, next) {
    try {
      const { roomId } = req.params;
      const { songId } = req.query; // Host's song ID in question

      if (!songId) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_PARAM', message: 'songId query parameter is required' }
        });
      }

      const status = await MatchingService.getSongAvailability(roomId, songId);

      res.status(200).json({
        success: true,
        data: {
          availability: status
        }
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: { code: 'MATCH_CHECK_FAILED', message: err.message }
      });
    }
  }
}

module.exports = LibraryController;
