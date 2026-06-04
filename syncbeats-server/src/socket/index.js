const authorizeSocket = require('../middleware/socketAuth');
const logger = require('../utils/logger');

// Handlers
const registerConnectionHandlers = require('./handlers/connection.handler');
const registerRoomHandlers = require('./handlers/room.handler');
const registerPlaybackHandlers = require('./handlers/playback.handler');
const registerQueueHandlers = require('./handlers/queue.handler');
const registerChatHandlers = require('./handlers/chat.handler');
const registerReactionHandlers = require('./handlers/reaction.handler');
const registerTimeHandlers = require('./handlers/time.handler');

const initSocketServer = (io) => {
  // Apply authorization middleware
  io.use(authorizeSocket);

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} | User: ${socket.user.display_name} (${socket.user.id})`);

    // Register all event sub-handlers
    registerConnectionHandlers(io, socket);
    registerRoomHandlers(io, socket);
    registerPlaybackHandlers(io, socket);
    registerQueueHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerReactionHandlers(io, socket);
    registerTimeHandlers(io, socket);
  });
};

module.exports = initSocketServer;
