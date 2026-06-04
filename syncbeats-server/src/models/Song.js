const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const inMemorySongs = new Map();

class Song {
  static async findById(id) {
    try {
      const song = await db('songs').where({ id }).first();
      return song;
    } catch (e) {
      return inMemorySongs.get(id) || null;
    }
  }

  static async findByUser(userId) {
    try {
      const songs = await db('songs').where({ user_id: userId });
      return songs;
    } catch (e) {
      return Array.from(inMemorySongs.values()).filter(s => s.user_id === userId);
    }
  }

  static async create(songData) {
    const id = uuidv4();
    const newSong = {
      id,
      user_id: songData.user_id,
      title: songData.title || 'Unknown Title',
      artist: songData.artist || 'Unknown Artist',
      album: songData.album || 'Unknown Album',
      duration_ms: songData.duration_ms || 0,
      file_path: songData.file_path,
      file_hash: songData.file_hash,
      format: songData.format || 'mp3',
      file_size: songData.file_size || 0,
      fingerprint: songData.fingerprint || null,
      artwork_url: songData.artwork_url || null,
      metadata: JSON.stringify(songData.metadata || {}),
      scanned_at: new Date()
    };

    try {
      const [inserted] = await db('songs')
        .insert({
          ...newSong,
          metadata: songData.metadata || {}
        })
        .onConflict(['user_id', 'file_hash'])
        .merge()
        .returning('*');
      return inserted;
    } catch (e) {
      inMemorySongs.set(id, newSong);
      return newSong;
    }
  }

  static async bulkCreate(userId, songsList) {
    const insertedSongs = [];
    for (const song of songsList) {
      const inserted = await this.create({ ...song, user_id: userId });
      insertedSongs.push(inserted);
    }
    return insertedSongs;
  }

  static async findByHash(userId, hash) {
    try {
      const song = await db('songs').where({ user_id: userId, file_hash: hash }).first();
      return song;
    } catch (e) {
      return Array.from(inMemorySongs.values()).find(s => s.user_id === userId && s.file_hash === hash) || null;
    }
  }

  static async remove(userId, songId) {
    try {
      await db('songs').where({ id: songId, user_id: userId }).del();
      return true;
    } catch (e) {
      const current = inMemorySongs.get(songId);
      if (current && current.user_id === userId) {
        inMemorySongs.delete(songId);
        return true;
      }
      return false;
    }
  }
}

module.exports = Song;
