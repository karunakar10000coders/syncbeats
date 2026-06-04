const Message = require('../../models/Message');
const logger = require('../../utils/logger');

module.exports = (io, socket) => {
  socket.on('chat:message', async ({ roomId, type, content, metadata }) => {
    try {
      const userId = socket.user.id;
      
      const message = await Message.create({
        room_id: roomId,
        user_id: userId,
        type: type || 'text',
        content,
        metadata: metadata || {}
      });

      logger.info(`Chat message in room ${roomId} from ${socket.user.display_name}: ${content}`);

      io.to(roomId).emit('chat:broadcast', {
        id: message.id,
        userId,
        displayName: socket.user.display_name,
        avatarUrl: socket.user.avatar_url,
        type: message.type,
        content: message.content,
        sentAt: message.sent_at,
        metadata: typeof message.metadata === 'string' ? JSON.parse(message.metadata) : message.metadata
      });
    } catch (err) {
      logger.error('Socket chat:message error: %O', err);
    }
  });
};
