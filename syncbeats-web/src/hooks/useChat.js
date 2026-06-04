import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useRoom } from '../contexts/RoomContext';
import ApiService from '../services/api';
import useSocketEvent from './useSocket';

export const useChat = () => {
  const { socket, connected } = useSocket();
  const { currentRoom } = useRoom();
  const [messages, setMessages] = useState([]);
  const [reactions, setReactions] = useState([]);

  // Load message history on joining room
  useEffect(() => {
    if (!currentRoom) {
      setMessages([]);
      return;
    }

    ApiService.get(`/chat/${currentRoom.id}/messages`)
      .then((res) => {
        if (res.success) {
          setMessages(res.data);
        }
      })
      .catch((err) => console.error('Failed to load chat history:', err));
  }, [currentRoom]);

  // Listen for real-time broadcasts
  const handleChatBroadcast = useCallback((msg) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const handleReactionBroadcast = useCallback((rx) => {
    setReactions((prev) => [...prev, { ...rx, id: Math.random().toString() }]);
  }, []);

  useSocketEvent('chat:broadcast', handleChatBroadcast);
  useSocketEvent('reaction:broadcast', handleReactionBroadcast);

  const sendMessage = (content, type = 'text', metadata = {}) => {
    if (!socket || !connected || !currentRoom) return;
    socket.emit('chat:message', {
      roomId: currentRoom.id,
      type,
      content,
      metadata
    });
  };

  const sendReaction = (emoji) => {
    if (!socket || !connected || !currentRoom) return;
    socket.emit('reaction:send', {
      roomId: currentRoom.id,
      emoji
    });
  };

  return {
    messages,
    reactions,
    setReactions,
    sendMessage,
    sendReaction
  };
};

export default useChat;
