import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import ApiService from '../services/api';

const RoomContext = createContext();

export const RoomProvider = ({ children }) => {
  const { socket, connected } = useSocket();
  const [currentRoom, setCurrentRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!socket || !connected) return;

    // Attach real-time updates listeners
    socket.on('room:user_joined', ({ user }) => {
      setMembers((prev) => {
        // Dedup members list
        const exists = prev.some((m) => m.id === user.id);
        if (exists) {
          return prev.map((m) => (m.id === user.id ? { ...m, is_online: true } : m));
        }
        return [...prev, user];
      });
    });

    socket.on('room:user_left', ({ userId, reason }) => {
      setMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, is_online: false } : m))
      );
    });

    socket.on('room:host_changed', ({ newHostId, previousHostId }) => {
      setMembers((prev) =>
        prev.map((m) => {
          if (m.id === newHostId) return { ...m, role: 'host' };
          if (m.id === previousHostId) return { ...m, role: 'member' };
          return m;
        })
      );
      setCurrentRoom((prev) => (prev ? { ...prev, host_id: newHostId } : null));
    });

    return () => {
      socket.off('room:user_joined');
      socket.off('room:user_left');
      socket.off('room:host_changed');
    };
  }, [socket, connected]);

  const createRoom = async (name, settings) => {
    setLoading(true);
    try {
      const res = await ApiService.post('/rooms', { name, settings });
      return res;
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (code, deviceType = 'web') => {
    setLoading(true);
    try {
      const res = await ApiService.post('/rooms/join', { code, device_type: deviceType });
      return res;
    } finally {
      setLoading(false);
    }
  };

  const leaveRoom = async (roomId) => {
    if (socket && connected) {
      socket.emit('room:leave', { roomId });
    }
    await ApiService.post(`/rooms/${roomId}/leave`);
    setCurrentRoom(null);
    setMembers([]);
  };

  return (
    <RoomContext.Provider
      value={{
        currentRoom,
        setCurrentRoom,
        members,
        setMembers,
        loading,
        createRoom,
        joinRoom,
        leaveRoom
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = () => useContext(RoomContext);
export default RoomContext;
