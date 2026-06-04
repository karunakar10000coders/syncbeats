const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const inMemoryReactions = [];

class Reaction {
  static async create(reactionData) {
    const id = uuidv4();
    const newReaction = {
      id,
      room_id: reactionData.room_id,
      user_id: reactionData.user_id,
      emoji: reactionData.emoji,
      sent_at: new Date()
    };

    try {
      const [inserted] = await db('reactions').insert(newReaction).returning('*');
      return inserted;
    } catch (e) {
      inMemoryReactions.push(newReaction);
      return newReaction;
    }
  }

  static async getRecent(roomId, secondsLimit = 30) {
    const cutoff = new Date(Date.now() - secondsLimit * 1000);
    try {
      const reactions = await db('reactions')
        .join('users', 'reactions.user_id', 'users.id')
        .where({ 'reactions.room_id': roomId })
        .where('reactions.sent_at', '>=', cutoff)
        .select(
          'reactions.id',
          'reactions.emoji',
          'reactions.sent_at',
          'users.id as user_id',
          'users.display_name'
        )
        .orderBy('reactions.sent_at', 'asc');
      return reactions;
    } catch (e) {
      const User = require('./User');
      return inMemoryReactions
        .filter(r => r.room_id === roomId && r.sent_at >= cutoff)
        .map(r => {
          const u = User.findById(r.user_id);
          return {
            id: r.id,
            emoji: r.emoji,
            sent_at: r.sent_at,
            user_id: r.user_id,
            display_name: u?.display_name || 'User'
          };
        });
    }
  }
}

module.exports = Reaction;
