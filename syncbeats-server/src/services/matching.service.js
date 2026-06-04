const Song = require('../models/Song');
const SongMatch = require('../models/SongMatch');
const Room = require('../models/Room');
const logger = require('../utils/logger');

class MatchingService {
  /**
   * Simple string normalization to make comparisons robust (case, spaces, symbols).
   */
  static normalize(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Levenshtein Distance for fuzzy string matching
   */
  static levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  /**
   * Checks if two string values are closely matched.
   */
  static isFuzzyMatch(str1, str2) {
    const s1 = this.normalize(str1);
    const s2 = this.normalize(str2);
    if (!s1 || !s2) return false;
    if (s1 === s2) return true;

    const maxLength = Math.max(s1.length, s2.length);
    if (maxLength === 0) return true;

    const distance = this.levenshteinDistance(s1, s2);
    const similarity = 1 - distance / maxLength;
    return similarity >= 0.82; // 82% threshold
  }

  /**
   * Matches a host's song against a participant's library.
   */
  static async findMatchForUser(hostSong, userId) {
    const userSongs = await Song.findByUser(userId);

    // 1. Hash Matching (highest confidence)
    if (hostSong.file_hash) {
      const match = userSongs.find(s => s.file_hash === hostSong.file_hash);
      if (match) {
        logger.debug(`Match found via hash for user ${userId} and song ${hostSong.title}`);
        return { song: match, type: 'hash', confidence: 1.0 };
      }
    }

    // 2. Exact Metadata Matching
    const exactMatch = userSongs.find(s => 
      this.normalize(s.title) === this.normalize(hostSong.title) &&
      this.normalize(s.artist) === this.normalize(hostSong.artist) &&
      Math.abs((s.duration_ms || 0) - (hostSong.duration_ms || 0)) < 3000
    );
    if (exactMatch) {
      return { song: exactMatch, type: 'metadata', confidence: 0.9 };
    }

    // 3. Fuzzy Metadata Matching
    const fuzzyMatch = userSongs.find(s => 
      this.isFuzzyMatch(s.title, hostSong.title) &&
      this.isFuzzyMatch(s.artist, hostSong.artist) &&
      Math.abs((s.duration_ms || 0) - (hostSong.duration_ms || 0)) < 6000
    );
    if (fuzzyMatch) {
      return { song: fuzzyMatch, type: 'fuzzy', confidence: 0.7 };
    }

    // 4. Filename-based Match
    const filenameMatch = userSongs.find(s => {
      const fn1 = s.file_path.split(/[/\\]/).pop();
      const fn2 = hostSong.file_path.split(/[/\\]/).pop();
      return fn1 && fn2 && this.isFuzzyMatch(fn1.split('.')[0], fn2.split('.')[0]);
    });
    if (filenameMatch) {
      return { song: filenameMatch, type: 'filename', confidence: 0.5 };
    }

    return null;
  }

  /**
   * Get availability status of a host's song in a room.
   * Returns:
   * - 'available_all': all room members have a matching song
   * - 'available_some': some room members have it, but not all
   * - 'not_available': no members other than host have it
   */
  static async getSongAvailability(roomId, hostSongId) {
    const room = await Room.findById(roomId);
    if (!room) throw new Error('Room not found');

    const hostSong = await Song.findById(hostSongId);
    if (!hostSong) throw new Error('Song not found');

    const members = await Room.getMembers(roomId);
    const activeMembers = members.filter(m => m.is_online);

    if (activeMembers.length <= 1) {
      return 'available_all';
    }

    let matchCount = 1; // Host has it

    for (const member of activeMembers) {
      if (member.id === room.host_id) continue;
      const match = await this.findMatchForUser(hostSong, member.id);
      if (match) {
        matchCount++;
        // Cache the match in DB if PostgreSQL works
        await SongMatch.create({
          song_a_id: hostSongId,
          song_b_id: match.song.id,
          match_type: match.type,
          confidence: match.confidence
        }).catch(() => {});
      }
    }

    if (matchCount === activeMembers.length) {
      return 'available_all';
    } else if (matchCount > 1) {
      return 'available_some';
    } else {
      return 'not_available';
    }
  }
}

module.exports = MatchingService;
