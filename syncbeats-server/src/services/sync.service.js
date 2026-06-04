const Room = require('../models/Room');
const logger = require('../utils/logger');

// Store active intervals for room sync pulses (to avoid memory leaks)
const activeSyncIntervals = new Map();

class SyncService {
  /**
   * Processes a playback control signal from the host and calculates
   * the exact scheduled time for execution to offset network round trip time.
   */
  static async handlePlaybackAction(roomId, userId, action, songId, positionMs, clientTime, socketIoServer) {
    const room = await Room.findById(roomId);
    if (!room) throw new Error('Room not found');

    if (room.host_id !== userId) {
      throw new Error('Only the host can control playback');
    }

    const serverTime = Date.now();
    const networkDelay = Math.max(0, serverTime - clientTime);

    // Let's schedule the action 50ms in the future of the server time
    // to give clients buffer to receive and schedule the command
    const executeDelayBuffer = 80; 
    const executeAt = serverTime + executeDelayBuffer;

    let adjustedPosition = positionMs;
    let isPlaying = false;

    if (action === 'play') {
      isPlaying = true;
      // Since it will start playing in 80ms, the start position is exactly positionMs
    } else if (action === 'pause') {
      isPlaying = false;
    } else if (action === 'seek') {
      isPlaying = JSON.parse(typeof room.playback_state === 'string' ? room.playback_state : JSON.stringify(room.playback_state))?.is_playing || false;
    } else if (action === 'stop') {
      isPlaying = false;
      adjustedPosition = 0;
    }

    // Save state in the database
    const playbackState = {
      is_playing: isPlaying,
      position_ms: adjustedPosition,
      speed: 1.0,
      updated_at: serverTime
    };

    const updateFields = {
      playback_state: playbackState
    };
    if (songId) {
      updateFields.current_song_id = songId;
    }

    await Room.update(roomId, updateFields);

    logger.info(`Playback command in room ${room.code}: ${action} | song: ${songId} | position: ${positionMs}ms | executeAt: ${executeAt}`);

    // Broadcast the command to all participants
    socketIoServer.to(roomId).emit('playback:command', {
      action,
      songId: songId || room.current_song_id,
      positionMs: adjustedPosition,
      speed: 1.0,
      executeAt
    });

    // If starting play, make sure sync pulse is running
    if (isPlaying) {
      this.startSyncPulse(roomId, socketIoServer);
    } else {
      this.stopSyncPulse(roomId);
    }
  }

  /**
   * Starts periodic drift synchronization pulses.
   * Sends authoritative sync pulses every 5 seconds.
   */
  static startSyncPulse(roomId, io) {
    if (activeSyncIntervals.has(roomId)) return;

    logger.debug(`Starting sync pulse for room: ${roomId}`);

    const intervalId = setInterval(async () => {
      try {
        const room = await Room.findById(roomId);
        if (!room || room.status !== 'active') {
          this.stopSyncPulse(roomId);
          return;
        }

        const playbackState = typeof room.playback_state === 'string' 
          ? JSON.parse(room.playback_state) 
          : room.playback_state;

        if (!playbackState.is_playing) {
          this.stopSyncPulse(roomId);
          return;
        }

        // Calculate expected current position based on elapsed time since updated_at
        const elapsed = Date.now() - playbackState.updated_at;
        const currentPosition = playbackState.position_ms + elapsed;

        io.to(roomId).emit('playback:sync', {
          songId: room.current_song_id,
          positionMs: currentPosition,
          isPlaying: true,
          serverTime: Date.now(),
          speed: playbackState.speed || 1.0
        });
      } catch (err) {
        logger.error(`Error in sync pulse for room ${roomId}: %O`, err);
      }
    }, 5000);

    activeSyncIntervals.set(roomId, intervalId);
  }

  /**
   * Stops periodic sync pulses for a room.
   */
  static stopSyncPulse(roomId) {
    if (activeSyncIntervals.has(roomId)) {
      logger.debug(`Stopping sync pulse for room: ${roomId}`);
      clearInterval(activeSyncIntervals.get(roomId));
      activeSyncIntervals.delete(roomId);
    }
  }
}

module.exports = SyncService;
