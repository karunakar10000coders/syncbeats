const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const inMemoryRooms = new Map();

class Room {
  static async findById(id) {
    try {
      const room = await db('rooms').where({ id }).first();
      return room;
    } catch (e) {
      return inMemoryRooms.get(id) || null;
    }
  }

  static async findByCode(code) {
    try {
      const room = await db('rooms').where({ code, status: 'active' }).first();
      return room;
    } catch (e) {
      return Array.from(inMemoryRooms.values()).find(r => r.code === code && r.status === 'active') || null;
    }
  }

  static async create(roomData) {
    const id = uuidv4();
    const newRoom = {
      id,
      code: roomData.code,
      name: roomData.name,
      host_id: roomData.host_id,
      status: 'active',
      settings: JSON.stringify(roomData.settings || {
        max_members: 10,
        democratic_queue: false,
        allow_guest_queue: true,
        require_song_match: true
      }),
      max_members: roomData.max_members || 10,
      current_song_id: null,
      playback_state: JSON.stringify({
        is_playing: false,
        position_ms: 0,
        speed: 1.0,
        updated_at: new Date().getTime()
      }),
      created_at: new Date(),
      closed_at: null
    };

    try {
      const [inserted] = await db('rooms').insert({
        ...newRoom,
        settings: roomData.settings || {
          max_members: 10,
          democratic_queue: false,
          allow_guest_queue: true,
          require_song_match: true
        },
        playback_state: {
          is_playing: false,
          position_ms: 0,
          speed: 1.0,
          updated_at: new Date().getTime()
        }
      }).returning('*');
      return inserted;
    } catch (e) {
      inMemoryRooms.set(id, newRoom);
      return newRoom;
    }
  }

  static async update(id, updateData) {
    const formattedData = { ...updateData };
    if (formattedData.settings && typeof formattedData.settings === 'object') {
      formattedData.settings = JSON.stringify(formattedData.settings);
    }
    if (formattedData.playback_state && typeof formattedData.playback_state === 'object') {
      formattedData.playback_state = JSON.stringify(formattedData.playback_state);
    }

    try {
      const [updated] = await db('rooms')
        .where({ id })
        .update({
          ...updateData
        })
        .returning('*');
      return updated;
    } catch (e) {
      const current = inMemoryRooms.get(id);
      if (!current) return null;
      const updated = {
        ...current,
        ...formattedData
      };
      inMemoryRooms.set(id, updated);
      return updated;
    }
  }

  static async close(id) {
    return this.update(id, { status: 'closed', closed_at: new Date() });
  }

  static async getMembers(id) {
    try {
      const members = await db('room_members')
        .join('users', 'room_members.user_id', 'users.id')
        .where({ room_id: id })
        .select(
          'users.id',
          'users.display_name',
          'users.avatar_url',
          'users.is_guest',
          'room_members.role',
          'room_members.is_online',
          'room_members.device_type',
          'room_members.joined_at'
        );
      return members;
    } catch (e) {
      const RoomMember = require('./RoomMember');
      return RoomMember.getRoomMembersInMemory(id);
    }
  }
}

module.exports = Room;
