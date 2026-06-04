const Room = require('../models/Room');
const RoomMember = require('../models/RoomMember');
const RoomService = require('../services/room.service');

class RoomController {
  static async create(req, res, next) {
    try {
      const { name, settings } = req.body;
      const room = await RoomService.createRoom(req.user.id, name, settings);

      res.status(201).json({
        success: true,
        data: room
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const room = await Room.findById(req.params.id);
      if (!room) {
        return res.status(404).json({
          success: false,
          error: { code: 'ROOM_NOT_FOUND', message: 'Room not found' }
        });
      }

      const members = await Room.getMembers(room.id);

      res.status(200).json({
        success: true,
        data: {
          ...room,
          settings: typeof room.settings === 'string' ? JSON.parse(room.settings) : room.settings,
          playback_state: typeof room.playback_state === 'string' ? JSON.parse(room.playback_state) : room.playback_state,
          members
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async getByCode(req, res, next) {
    try {
      const room = await Room.findByCode(req.params.code.toUpperCase());
      if (!room) {
        return res.status(404).json({
          success: false,
          error: { code: 'ROOM_NOT_FOUND', message: 'Room not found with the specified code' }
        });
      }

      res.status(200).json({
        success: true,
        data: room
      });
    } catch (err) {
      next(err);
    }
  }

  static async join(req, res, next) {
    try {
      const { code, device_type } = req.body;
      const room = await RoomService.validateJoin(code.toUpperCase(), req.user.id);
      const member = await RoomMember.join(room.id, req.user.id, 'member', device_type);

      res.status(200).json({
        success: true,
        data: {
          room,
          member
        }
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: { code: 'JOIN_FAILED', message: err.message }
      });
    }
  }

  static async leave(req, res, next) {
    try {
      const roomId = req.params.id;
      const member = await RoomMember.leave(roomId, req.user.id);

      // If host leaves, demote role and check if we should assign another member as host
      const room = await Room.findById(roomId);
      if (room && room.host_id === req.user.id) {
        const members = await Room.getMembers(roomId);
        const nextHost = members.find(m => m.is_online && m.id !== req.user.id);
        if (nextHost) {
          await RoomService.transferHost(roomId, req.user.id, nextHost.id);
        } else {
          // close room if no online members left
          await Room.close(roomId);
        }
      }

      res.status(200).json({
        success: true,
        data: { message: 'Left room successfully' }
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateSettings(req, res, next) {
    try {
      const room = await Room.findById(req.params.id);
      if (!room || room.host_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Only the host can modify room settings' }
        });
      }

      const updated = await Room.update(room.id, {
        settings: req.body.settings
      });

      res.status(200).json({
        success: true,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }

  static async transferHost(req, res, next) {
    try {
      const { newHostId } = req.body;
      await RoomService.transferHost(req.params.id, req.user.id, newHostId);

      res.status(200).json({
        success: true,
        data: { message: 'Host role transferred successfully' }
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: { code: 'TRANSFER_FAILED', message: err.message }
      });
    }
  }
}

module.exports = RoomController;
