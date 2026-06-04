const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const inMemoryMatches = new Map();

class SongMatch {
  static async create(matchData) {
    const id = uuidv4();
    const newMatch = {
      id,
      song_a_id: matchData.song_a_id,
      song_b_id: matchData.song_b_id,
      match_type: matchData.match_type,
      confidence: matchData.confidence,
      matched_at: new Date()
    };

    try {
      const [inserted] = await db('song_matches')
        .insert(newMatch)
        .onConflict(['song_a_id', 'song_b_id'])
        .merge()
        .returning('*');
      return inserted;
    } catch (e) {
      const key = `${matchData.song_a_id}:${matchData.song_b_id}`;
      inMemoryMatches.set(key, newMatch);
      return newMatch;
    }
  }

  static async findMatch(songAId, songBId) {
    try {
      const match = await db('song_matches')
        .where(function() {
          this.where({ song_a_id: songAId, song_b_id: songBId })
            .orWhere({ song_a_id: songBId, song_b_id: songAId });
        })
        .first();
      return match;
    } catch (e) {
      const key1 = `${songAId}:${songBId}`;
      const key2 = `${songBId}:${songAId}`;
      return inMemoryMatches.get(key1) || inMemoryMatches.get(key2) || null;
    }
  }
}

module.exports = SongMatch;
