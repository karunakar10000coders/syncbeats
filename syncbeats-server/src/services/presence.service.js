const { redisClient } = require('../config/redis');
const RoomMember = require('../models/RoomMember');
const logger = require('../utils/logger');

class PresenceService {
  /**
   * Tracks a user's presence under a room using Redis set or local tracking
   */
  static async trackUserPresence(roomId, userId, isOnline) {
    logger.debug(`User presence update: user ${userId} is ${isOnline ? 'online' : 'offline'} in room ${roomId}`);
    
    // Update DB member state
    await RoomMember.updateOnlineStatus(roomId, userId, isOnline);

    if (redisClient) {
      const redisKey = `presence:room:${roomId}`;
      if (isOnline) {
        await redisClient.sadd(redisKey, userId);
      } else {
        await redisClient.srem(redisKey, userId);
      }
    }
  }

  static async getOnlineUsers(roomId) {
    if (redisClient) {
      const redisKey = `presence:room:${roomId}`;
      const onlineIds = await redisClient.smembers(redisKey);
      return onlineIds;
    }
    
    const members = await RoomMember.getRoomMembersInMemory(roomId);
    return members.filter(m => m.is_online).map(m => m.id);
  }
}

module.exports = PresenceService;
