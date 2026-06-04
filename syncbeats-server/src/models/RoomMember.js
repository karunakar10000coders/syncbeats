const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const inMemoryMembers = new Map();

class RoomMember {
  static async join(roomId, userId, role = 'member', deviceType = 'web') {
    const newMember = {
      id: uuidv4(),
      room_id: roomId,
      user_id: userId,
      role,
      is_online: true,
      device_type: deviceType,
      joined_at: new Date(),
      left_at: null
    };

    try {
      const [inserted] = await db('room_members')
        .insert(newMember)
        .onConflict(['room_id', 'user_id'])
        .merge({ is_online: true, left_at: null, role, device_type: deviceType })
        .returning('*');
      return inserted;
    } catch (e) {
      const key = `${roomId}:${userId}`;
      inMemoryMembers.set(key, newMember);
      return newMember;
    }
  }

  static async leave(roomId, userId) {
    try {
      const [updated] = await db('room_members')
        .where({ room_id: roomId, user_id: userId })
        .update({ is_online: false, left_at: new Date() })
        .returning('*');
      return updated;
    } catch (e) {
      const key = `${roomId}:${userId}`;
      const current = inMemoryMembers.get(key);
      if (!current) return null;
      const updated = { ...current, is_online: false, left_at: new Date() };
      inMemoryMembers.set(key, updated);
      return updated;
    }
  }

  static async updateOnlineStatus(roomId, userId, isOnline) {
    try {
      const [updated] = await db('room_members')
        .where({ room_id: roomId, user_id: userId })
        .update({ is_online: isOnline, last_seen_at: new Date() })
        .returning('*');
      return updated;
    } catch (e) {
      const key = `${roomId}:${userId}`;
      const current = inMemoryMembers.get(key);
      if (!current) return null;
      const updated = { ...current, is_online: isOnline };
      inMemoryMembers.set(key, updated);
      return updated;
    }
  }

  static async findByRoomAndUser(roomId, userId) {
    try {
      const member = await db('room_members').where({ room_id: roomId, user_id: userId }).first();
      return member;
    } catch (e) {
      const key = `${roomId}:${userId}`;
      return inMemoryMembers.get(key) || null;
    }
  }

  static getRoomMembersInMemory(roomId) {
    const list = [];
    const User = require('./User');
    for (const [key, value] of inMemoryMembers.entries()) {
      if (value.room_id === roomId) {
        // synchronously find user details
        const u = User.findById(value.user_id);
        list.push({
          id: value.user_id,
          display_name: u?.display_name || 'User',
          avatar_url: u?.avatar_url || '',
          is_guest: u?.is_guest || false,
          role: value.role,
          is_online: value.is_online,
          device_type: value.device_type,
          joined_at: value.joined_at
        });
      }
    }
    return list;
  }
}

module.exports = RoomMember;
