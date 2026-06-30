import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/api';
import { useAuth } from './AuthContext';

const SocketContext = createContext<Socket | null>(null);

// Connects once the rider is signed in and stays connected app-wide, so
// screens can listen for trip:matched/started/completed/cancelled without
// each one managing its own connection lifecycle.
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
      return;
    }

    const instance = io(API_BASE_URL, { transports: ['websocket'] });
    instance.on('connect', () => instance.emit('register', { userId: user.id }));
    socketRef.current = instance;
    setSocket(instance);

    return () => {
      instance.disconnect();
    };
  }, [user?.id]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
