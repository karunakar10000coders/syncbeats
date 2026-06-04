const Reaction = require('../../models/Reaction');
const logger = require('../../utils/logger');

module.exports = (io, socket) => {
  socket.on('reaction:send', async ({ roomId, emoji }) => {
    try {
      const userId = socket.user.id;
      
      await Reaction.create({
        room_id: roomId,
        user_id: userId,
        emoji
      });

      io.to(roomId).emit('reaction:broadcast', {
        userId,
        displayName: socket.user.display_name,
        emoji,
        sentAt: new Date()
      });
    } catch (err) {
      logger.error('Socket reaction:send error: %O', err);
    }
  });
};
