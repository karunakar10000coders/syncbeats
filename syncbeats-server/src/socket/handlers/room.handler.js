const Room = require('../../models/Room');
const RoomMember = require('../../models/RoomMember');
const PresenceService = require('../../services/presence.service');
const QueueItem = require('../../models/QueueItem');
const logger = require('../../utils/logger');

module.exports = (io, socket) => {
  socket.on('room:join', async ({ roomId, deviceType }) => {
    try {
      const userId = socket.user.id;
      
      logger.info(`Socket User ${socket.user.display_name} joining room namespace: ${roomId}`);
      
      // Join Socket.io room channel
      socket.join(roomId);

      // Track online status
      await PresenceService.trackUserPresence(roomId, userId, true);

      // Fetch latest state to return
      const room = await Room.findById(roomId);
      const members = await Room.getMembers(roomId);
      const queue = await QueueItem.getByRoom(roomId);

      const parsedSettings = typeof room.settings === 'string' ? JSON.parse(room.settings) : room.settings;
      const parsedPlayback = typeof room.playback_state === 'string' ? JSON.parse(room.playback_state) : room.playback_state;

      // Broadcast join event to other members
      const newMemberDetails = members.find(m => m.id === userId);
      socket.to(roomId).emit('room:user_joined', {
        user: newMemberDetails
      });

      // Emits current full state to the joined user
      socket.emit('room:state', {
        room: {
          id: room.id,
          code: room.code,
          name: room.name,
          host_id: room.host_id,
          status: room.status,
          settings: parsedSettings
        },
        members,
        queue,
        playbackState: parsedPlayback
      });
    } catch (err) {
      logger.error('Socket room:join error: %O', err);
      socket.emit('error', { code: 'JOIN_ERROR', message: err.message });
    }
  });

  socket.on('room:leave', async ({ roomId }) => {
    try {
      const userId = socket.user.id;
      logger.info(`Socket User ${socket.user.display_name} leaving room namespace: ${roomId}`);

      socket.leave(roomId);
      await PresenceService.trackUserPresence(roomId, userId, false);

      socket.to(roomId).emit('room:user_left', {
        userId,
        reason: 'left'
      });
    } catch (err) {
      logger.error('Socket room:leave error: %O', err);
    }
  });
};
