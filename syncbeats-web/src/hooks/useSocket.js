import { useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';

export const useSocketEvent = (eventName, callback) => {
  const { socket, connected } = useSocket();

  useEffect(() => {
    if (!socket || !connected) return;

    socket.on(eventName, callback);

    return () => {
      socket.off(eventName, callback);
    };
  }, [socket, connected, eventName, callback]);
};

export default useSocketEvent;
