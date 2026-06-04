const PresenceService = require('../../services/presence.service');
const Room = require('../../models/Room');
const RoomMember = require('../../models/RoomMember');
const RoomService = require('../../services/room.service');
const logger = require('../../utils/logger');

module.exports = (io, socket) => {
  // Track room user joined (helper cache for quick disconnect cleanup)
  let activeRoomId = null;

  socket.on('room:join_track', (roomId) => {
    activeRoomId = roomId;
  });

  socket.on('disconnect', async () => {
    logger.info(`Socket disconnected: ${socket.id} | User: ${socket.user.display_name}`);

    if (activeRoomId) {
      try {
        const roomId = activeRoomId;
        const userId = socket.user.id;

        // Mark user as offline
        await PresenceService.trackUserPresence(roomId, userId, false);

        // Broadcast user left event to other members
        socket.to(roomId).emit('room:user_left', {
          userId,
          reason: 'disconnected'
        });

        // If the disconnected user was the host, re-assign
        const room = await Room.findById(roomId);
        if (room && room.host_id === userId) {
          const members = await Room.getMembers(roomId);
          const nextHost = members.find(m => m.is_online && m.id !== userId);

          if (nextHost) {
            await RoomService.transferHost(roomId, userId, nextHost.id);
            io.to(roomId).emit('room:host_changed', {
              newHostId: nextHost.id,
              previousHostId: userId
            });
          } else {
            // Close room in 1 minute if no one returns (delayed cleanup)
            setTimeout(async () => {
              const currentMembers = await Room.getMembers(roomId);
              const activeMembers = currentMembers.filter(m => m.is_online);
              if (activeMembers.length === 0) {
                await Room.close(roomId);
                logger.info(`Auto-closed room ${room.code} due to inactivity`);
              }
            }, 60000);
          }
        }
      } catch (err) {
        logger.error('Error handling socket disconnect presence cleanup: %O', err);
      }
    }
  });
};
