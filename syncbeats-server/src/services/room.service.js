const Room = require('../models/Room');
const RoomMember = require('../models/RoomMember');
const logger = require('../utils/logger');

class RoomService {
  static generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  static async createRoom(userId, name, settings) {
    let code = this.generateRoomCode();
    // Check collisions
    let existing = await Room.findByCode(code);
    while (existing) {
      code = this.generateRoomCode();
      existing = await Room.findByCode(code);
    }

    logger.info(`Creating room with name: ${name}, code: ${code} for host: ${userId}`);

    const room = await Room.create({
      code,
      name: name || 'Shared Listening Session',
      host_id: userId,
      settings: settings || {
        max_members: 10,
        democratic_queue: false,
        allow_guest_queue: true,
        require_song_match: true
      }
    });

    // Add host as a room member
    await RoomMember.join(room.id, userId, 'host');

    return room;
  }

  static async validateJoin(roomCode, userId) {
    const room = await Room.findByCode(roomCode);
    if (!room) {
      throw new Error('Room not found or closed');
    }

    const members = await Room.getMembers(room.id);
    const existing = members.find(m => m.id === userId);

    if (!existing && members.length >= room.max_members) {
      throw new Error('Room is full');
    }

    return room;
  }

  static async transferHost(roomId, currentHostId, newHostId) {
    const room = await Room.findById(roomId);
    if (!room || room.host_id !== currentHostId) {
      throw new Error('Unauthorized host transfer');
    }

    const newHostMember = await RoomMember.findByRoomAndUser(roomId, newHostId);
    if (!newHostMember) {
      throw new Error('New host must be in the room');
    }

    // Demote old host to member
    await RoomMember.join(roomId, currentHostId, 'member');
    // Promote new host
    await RoomMember.join(roomId, newHostId, 'host');
    // Update room table
    await Room.update(roomId, { host_id: newHostId });

    logger.info(`Host transfer in Room ${roomId}: ${currentHostId} -> ${newHostId}`);
    return true;
  }
}

module.exports = RoomService;
