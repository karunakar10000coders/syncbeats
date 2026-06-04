const QueueService = require('../services/queue.service');
const Room = require('../models/Room');

class QueueController {
  static async getQueue(req, res, next) {
    try {
      const queue = await QueueService.getQueue(req.params.roomId);
      res.status(200).json({
        success: true,
        data: queue
      });
    } catch (err) {
      next(err);
    }
  }

  static async addToQueue(req, res, next) {
    try {
      const { songId } = req.body;
      const item = await QueueService.addToQueue(req.params.roomId, songId, req.user.id);
      res.status(201).json({
        success: true,
        data: item
      });
    } catch (err) {
      next(err);
    }
  }

  static async removeFromQueue(req, res, next) {
    try {
      const { roomId, itemId } = req.params;
      await QueueService.removeFromQueue(roomId, itemId);
      res.status(200).json({
        success: true,
        data: { message: 'Item removed from queue successfully' }
      });
    } catch (err) {
      next(err);
    }
  }

  static async reorderQueue(req, res, next) {
    try {
      const { roomId } = req.params;
      const { itemId, newPosition } = req.body;

      const room = await Room.findById(roomId);
      if (!room || room.host_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Only the host can manually reorder queue' }
        });
      }

      await QueueService.reorderQueue(roomId, itemId, newPosition);
      res.status(200).json({
        success: true,
        data: { message: 'Queue reordered successfully' }
      });
    } catch (err) {
      next(err);
    }
  }

  static async voteOnItem(req, res, next) {
    try {
      const { roomId, itemId } = req.params;
      const { direction } = req.body; // 'up' | 'down'

      if (!['up', 'down'].includes(direction)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_VOTE', message: "Direction must be 'up' or 'down'" }
        });
      }

      await QueueService.voteOnItem(roomId, itemId, direction);
      res.status(200).json({
        success: true,
        data: { message: 'Vote recorded successfully' }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = QueueController;
