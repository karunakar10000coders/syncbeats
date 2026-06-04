const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const inMemoryQueue = new Map();

class QueueItem {
  static async add(roomId, songId, addedBy, position) {
    const id = uuidv4();
    const newItem = {
      id,
      room_id: roomId,
      song_id: songId,
      added_by: addedBy,
      position,
      upvotes: 0,
      downvotes: 0,
      status: 'pending',
      added_at: new Date()
    };

    try {
      const [inserted] = await db('queue_items').insert(newItem).returning('*');
      return inserted;
    } catch (e) {
      inMemoryQueue.set(id, newItem);
      return newItem;
    }
  }

  static async getByRoom(roomId) {
    try {
      const items = await db('queue_items')
        .join('songs', 'queue_items.song_id', 'songs.id')
        .join('users', 'queue_items.added_by', 'users.id')
        .where({ 'queue_items.room_id': roomId })
        .whereIn('queue_items.status', ['pending', 'playing'])
        .select(
          'queue_items.id',
          'queue_items.position',
          'queue_items.upvotes',
          'queue_items.downvotes',
          'queue_items.status',
          'queue_items.added_at',
          'songs.id as song_id',
          'songs.title',
          'songs.artist',
          'songs.album',
          'songs.duration_ms',
          'songs.file_hash',
          'songs.artwork_url',
          'users.id as user_id',
          'users.display_name as added_by_name',
          'users.avatar_url as added_by_avatar'
        )
        .orderBy('queue_items.position', 'asc');
      return items;
    } catch (e) {
      // Fallback
      return Array.from(inMemoryQueue.values())
        .filter(q => q.room_id === roomId && ['pending', 'playing'].includes(q.status))
        .map(q => {
          const Song = require('./Song');
          const User = require('./User');
          const s = Song.findById(q.song_id);
          const u = User.findById(q.added_by);
          return {
            id: q.id,
            position: q.position,
            upvotes: q.upvotes,
            downvotes: q.downvotes,
            status: q.status,
            added_at: q.added_at,
            song_id: q.song_id,
            title: s?.title || 'Unknown Title',
            artist: s?.artist || 'Unknown Artist',
            album: s?.album || 'Unknown Album',
            duration_ms: s?.duration_ms || 0,
            file_hash: s?.file_hash || '',
            artwork_url: s?.artwork_url || '',
            user_id: q.added_by,
            added_by_name: u?.display_name || 'User',
            added_by_avatar: u?.avatar_url || ''
          };
        })
        .sort((a, b) => a.position - b.position);
    }
  }

  static async remove(id) {
    try {
      await db('queue_items').where({ id }).del();
      return true;
    } catch (e) {
      inMemoryQueue.delete(id);
      return true;
    }
  }

  static async updateStatus(id, status) {
    try {
      const [updated] = await db('queue_items').where({ id }).update({ status }).returning('*');
      return updated;
    } catch (e) {
      const item = inMemoryQueue.get(id);
      if (!item) return null;
      const updated = { ...item, status };
      inMemoryQueue.set(id, updated);
      return updated;
    }
  }

  static async updatePosition(id, position) {
    try {
      const [updated] = await db('queue_items').where({ id }).update({ position }).returning('*');
      return updated;
    } catch (e) {
      const item = inMemoryQueue.get(id);
      if (!item) return null;
      const updated = { ...item, position };
      inMemoryQueue.set(id, updated);
      return updated;
    }
  }

  static async vote(id, direction) {
    const isUp = direction === 'up';
    try {
      const [updated] = await db('queue_items')
        .where({ id })
        .increment(isUp ? 'upvotes' : 'downvotes', 1)
        .returning('*');
      return updated;
    } catch (e) {
      const item = inMemoryQueue.get(id);
      if (!item) return null;
      const updated = {
        ...item,
        upvotes: isUp ? item.upvotes + 1 : item.upvotes,
        downvotes: !isUp ? item.downvotes + 1 : item.downvotes
      };
      inMemoryQueue.set(id, updated);
      return updated;
    }
  }
}

module.exports = QueueItem;
