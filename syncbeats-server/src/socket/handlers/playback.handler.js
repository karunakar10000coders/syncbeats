const SyncService = require('../../services/sync.service');
const logger = require('../../utils/logger');

module.exports = (io, socket) => {
  socket.on('playback:play', async ({ roomId, songId, positionMs, clientTime }) => {
    try {
      await SyncService.handlePlaybackAction(
        roomId,
        socket.user.id,
        'play',
        songId,
        positionMs,
        clientTime,
        io
      );
    } catch (err) {
      logger.error('Socket playback:play error: %O', err);
      socket.emit('error', { code: 'PLAYBACK_ERROR', message: err.message });
    }
  });

  socket.on('playback:pause', async ({ roomId, positionMs, clientTime }) => {
    try {
      await SyncService.handlePlaybackAction(
        roomId,
        socket.user.id,
        'pause',
        null,
        positionMs,
        clientTime,
        io
      );
    } catch (err) {
      logger.error('Socket playback:pause error: %O', err);
      socket.emit('error', { code: 'PLAYBACK_ERROR', message: err.message });
    }
  });

  socket.on('playback:seek', async ({ roomId, positionMs, clientTime }) => {
    try {
      await SyncService.handlePlaybackAction(
        roomId,
        socket.user.id,
        'seek',
        null,
        positionMs,
        clientTime,
        io
      );
    } catch (err) {
      logger.error('Socket playback:seek error: %O', err);
      socket.emit('error', { code: 'PLAYBACK_ERROR', message: err.message });
    }
  });

  socket.on('playback:speed', async ({ roomId, speed, clientTime }) => {
    try {
      await SyncService.handlePlaybackAction(
        roomId,
        socket.user.id,
        'speed',
        null,
        0, // position not modified by speed alteration
        clientTime,
        io
      );
    } catch (err) {
      logger.error('Socket playback:speed error: %O', err);
      socket.emit('error', { code: 'PLAYBACK_ERROR', message: err.message });
    }
  });
};
