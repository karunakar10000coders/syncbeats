const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const inMemoryMessages = [];

class Message {
  static async create(msgData) {
    const id = uuidv4();
    const newMsg = {
      id,
      room_id: msgData.room_id,
      user_id: msgData.user_id,
      type: msgData.type || 'text',
      content: msgData.content,
      metadata: JSON.stringify(msgData.metadata || {}),
      sent_at: new Date()
    };

    try {
      const [inserted] = await db('messages').insert({
        ...newMsg,
        metadata: msgData.metadata || {}
      }).returning('*');
      return inserted;
    } catch (e) {
      inMemoryMessages.push(newMsg);
      return newMsg;
    }
  }

  static async getByRoom(roomId, limit = 50, offset = 0) {
    try {
      const msgs = await db('messages')
        .join('users', 'messages.user_id', 'users.id')
        .where({ 'messages.room_id': roomId })
        .select(
          'messages.id',
          'messages.type',
          'messages.content',
          'messages.metadata',
          'messages.sent_at',
          'users.id as user_id',
          'users.display_name',
          'users.avatar_url'
        )
        .orderBy('messages.sent_at', 'desc')
        .limit(limit)
        .offset(offset);
      return msgs.reverse(); // Chronological order for front-end
    } catch (e) {
      const User = require('./User');
      return inMemoryMessages
        .filter(m => m.room_id === roomId)
        .slice(-limit)
        .map(m => {
          const u = User.findById(m.user_id);
          return {
            id: m.id,
            type: m.type,
            content: m.content,
            metadata: typeof m.metadata === 'string' ? JSON.parse(m.metadata) : m.metadata,
            sent_at: m.sent_at,
            user_id: m.user_id,
            display_name: u?.display_name || 'User',
            avatar_url: u?.avatar_url || ''
          };
        });
    }
  }
}

module.exports = Message;
