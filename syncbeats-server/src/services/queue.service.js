const QueueItem = require('../models/QueueItem');
const Room = require('../models/Room');
const logger = require('../utils/logger');

class QueueService {
  static async getQueue(roomId) {
    return QueueItem.getByRoom(roomId);
  }

  static async addToQueue(roomId, songId, addedBy) {
    const currentQueue = await this.getQueue(roomId);
    const position = currentQueue.length; // Appends at the end
    logger.info(`Adding song ${songId} to queue in room ${roomId} by ${addedBy} at position ${position}`);
    return QueueItem.add(roomId, songId, addedBy, position);
  }

  static async removeFromQueue(roomId, itemId) {
    logger.info(`Removing queue item ${itemId} from room ${roomId}`);
    await QueueItem.remove(itemId);
    
    // Shift remaining items forward
    const currentQueue = await this.getQueue(roomId);
    for (let i = 0; i < currentQueue.length; i++) {
      await QueueItem.updatePosition(currentQueue[i].id, i);
    }
    return true;
  }

  static async reorderQueue(roomId, itemId, newPosition) {
    const queue = await this.getQueue(roomId);
    const item = queue.find(q => q.id === itemId);
    if (!item) throw new Error('Queue item not found');

    const oldPosition = item.position;
    if (oldPosition === newPosition) return;

    logger.info(`Reordering queue item ${itemId}: ${oldPosition} -> ${newPosition}`);

    // Update positions
    if (oldPosition < newPosition) {
      // Shifting down
      for (const q of queue) {
        if (q.position > oldPosition && q.position <= newPosition) {
          await QueueItem.updatePosition(q.id, q.position - 1);
        }
      }
    } else {
      // Shifting up
      for (const q of queue) {
        if (q.position >= newPosition && q.position < oldPosition) {
          await QueueItem.updatePosition(q.id, q.position + 1);
        }
      }
    }

    await QueueItem.updatePosition(itemId, newPosition);
    return true;
  }

  static async voteOnItem(roomId, itemId, direction) {
    logger.info(`Voting ${direction} on queue item ${itemId} in room ${roomId}`);
    await QueueItem.vote(itemId, direction);

    // If democratic mode is active, resort queue by net votes
    const room = await Room.findById(roomId);
    const settings = typeof room.settings === 'string' ? JSON.parse(room.settings) : room.settings;

    if (settings?.democratic_queue) {
      const queue = await this.getQueue(roomId);
      // Sort: playing items stay at the top, then sort by (upvotes - downvotes) desc, then added_at asc
      const playingItem = queue.find(q => q.status === 'playing');
      const sortable = queue.filter(q => q.status === 'pending');

      sortable.sort((a, b) => {
        const netA = (a.upvotes || 0) - (a.downvotes || 0);
        const netB = (b.upvotes || 0) - (b.downvotes || 0);
        if (netA !== netB) return netB - netA;
        return new Date(a.added_at) - new Date(b.added_at);
      });

      let pos = 0;
      if (playingItem) {
        await QueueItem.updatePosition(playingItem.id, 0);
        pos = 1;
      }
      for (const q of sortable) {
        await QueueItem.updatePosition(q.id, pos++);
      }
    }

    return true;
  }

  static async getNextSong(roomId) {
    const queue = await this.getQueue(roomId);
    // Find next pending song
    const nextItem = queue.find(q => q.status === 'pending');
    if (!nextItem) return null;
    return nextItem;
  }
}

module.exports = QueueService;
