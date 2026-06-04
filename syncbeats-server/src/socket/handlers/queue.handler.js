const QueueItem = require('../../models/QueueItem');
const logger = require('../../utils/logger');

module.exports = (io, socket) => {
  socket.on('queue:update', async ({ roomId }) => {
    try {
      const queue = await QueueItem.getByRoom(roomId);
      io.to(roomId).emit('queue:updated', { queue });
    } catch (err) {
      logger.error('Socket queue:update error: %O', err);
    }
  });
};
