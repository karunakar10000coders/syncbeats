import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import socketService from '../services/socket';
import timeSyncService from '../services/timeSync';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem('access_token');
      const socketInstance = socketService.connect(token);
      setSocket(socketInstance);

      socketInstance.on('connect', () => {
        setConnected(true);
        // Start clock sync when socket connects!
        timeSyncService.startSync();
      });

      socketInstance.on('disconnect', () => {
        setConnected(false);
        timeSyncService.stopSync();
      });

      return () => {
        socketInstance.off('connect');
        socketInstance.off('disconnect');
        socketService.disconnect();
        setSocket(null);
        setConnected(false);
        timeSyncService.stopSync();
      };
    } else {
      socketService.disconnect();
      setSocket(null);
      setConnected(false);
      timeSyncService.stopSync();
    }
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
export default SocketContext;
