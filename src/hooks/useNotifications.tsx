import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { type AlertSeverity } from '@/lib/constants';
import { useData } from '@/contexts/DataContext';

export interface Notification {
  id: string;
  severity: AlertSeverity;
  agencyName: string;
  agencyId: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { agencies } = useData();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // TODO: Fetch notifications via API or WebSocket

  const onNewNotification = useRef<((n: Notification) => void) | null>(null);

  // Expose the callback setter
  useEffect(() => {
    onNewNotification.current = latestCallback.current;
  });

  const latestCallback = useRef<((n: Notification) => void) | null>(null);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}

// Hook to subscribe to new notifications (for toasts)
export function useNotificationListener(callback: (n: Notification) => void) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const { notifications } = useNotifications();
  const prevCountRef = useRef(notifications.length);

  useEffect(() => {
    if (notifications.length > prevCountRef.current && notifications[0]) {
      callbackRef.current(notifications[0]);
    }
    prevCountRef.current = notifications.length;
  }, [notifications]);
}
