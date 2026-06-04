import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useRoom } from '../contexts/RoomContext';
import ApiService from '../services/api';
import useSocketEvent from './useSocket';

export const useQueue = () => {
  const { socket, connected } = useSocket();
  const { currentRoom } = useRoom();
  const [queue, setQueue] = useState([]);

  const loadQueue = useCallback(async () => {
    if (!currentRoom) return;
    try {
      const res = await ApiService.get(`/queue/${currentRoom.id}`);
      if (res.success) {
        setQueue(res.data);
      }
    } catch (err) {
      console.error('Failed to load queue:', err);
    }
  }, [currentRoom]);

  // Load queue on room mount
  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // Live WebSocket updates
  const handleQueueUpdated = useCallback(({ queue: newQueue }) => {
    setQueue(newQueue);
  }, []);

  useSocketEvent('queue:updated', handleQueueUpdated);

  const triggerQueueUpdateBroadcast = useCallback(() => {
    if (socket && connected && currentRoom) {
      socket.emit('queue:update', { roomId: currentRoom.id });
    }
  }, [socket, connected, currentRoom]);

  const addToQueue = async (songId) => {
    if (!currentRoom) return;
    const res = await ApiService.post(`/queue/${currentRoom.id}`, { songId });
    triggerQueueUpdateBroadcast();
    return res;
  };

  const removeFromQueue = async (itemId) => {
    if (!currentRoom) return;
    const res = await ApiService.delete(`/queue/${currentRoom.id}/${itemId}`);
    triggerQueueUpdateBroadcast();
    return res;
  };

  const voteOnItem = async (itemId, direction) => {
    if (!currentRoom) return;
    const res = await ApiService.post(`/queue/${currentRoom.id}/${itemId}/vote`, { direction });
    triggerQueueUpdateBroadcast();
    return res;
  };

  const reorderQueue = async (itemId, newPosition) => {
    if (!currentRoom) return;
    const res = await ApiService.put(`/queue/${currentRoom.id}/reorder`, { itemId, newPosition });
    triggerQueueUpdateBroadcast();
    return res;
  };

  return {
    queue,
    addToQueue,
    removeFromQueue,
    voteOnItem,
    reorderQueue,
    refreshQueue: loadQueue
  };
};

export default useQueue;
