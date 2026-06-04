const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');
const initSocketServer = require('./socket');

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with WebSocket priority
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

// Configure Socket.IO behaviors
initSocketServer(io);

// Start server listening
const PORT = env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`SyncBeats Backend server is running in ${env.NODE_ENV} mode on port ${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});
