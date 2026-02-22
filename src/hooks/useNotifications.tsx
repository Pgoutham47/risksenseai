import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { agencies, type AlertSeverity } from '@/data/mockData';

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

const EVENT_TEMPLATES: { title: string; message: (name: string) => string; severity: AlertSeverity }[] = [
  { title: 'Score Drop Alert', message: (n) => `${n} trust score dropped by 12 points in the last cycle.`, severity: 'CRITICAL' },
  { title: 'Velocity Spike', message: (n) => `${n} booking velocity is 4.2x above hourly average.`, severity: 'CRITICAL' },
  { title: 'Credit Utilization High', message: (n) => `${n} credit utilization has crossed 80% threshold.`, severity: 'WARNING' },
  { title: 'Invoice Overdue', message: (n) => `${n} has 2 invoices overdue by 5+ days.`, severity: 'WARNING' },
  { title: 'Cancellation Pattern', message: (n) => `${n} cancelled 6 of 8 bookings within 4 hours.`, severity: 'WARNING' },
  { title: 'Band Changed', message: (n) => `${n} moved from CAUTION to WARNING band.`, severity: 'WARNING' },
  { title: 'New Booking', message: (n) => `${n} booked DEL→DXB for 3 passengers.`, severity: 'INFO' },
  { title: 'Score Recovery', message: (n) => `${n} trust score improved by 8 points.`, severity: 'INFO' },
  { title: 'Settlement Received', message: (n) => `${n} settled ₹2.4L in outstanding invoices.`, severity: 'INFO' },
  { title: 'Refundable Ratio Surge', message: (n) => `${n} refundable bookings jumped to 92% from 45% baseline.`, severity: 'CRITICAL' },
];

let notifCounter = 0;

function generateNotification(): Notification {
  const agency = agencies[Math.floor(Math.random() * agencies.length)];
  const template = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
  notifCounter++;
  return {
    id: `notif-${Date.now()}-${notifCounter}`,
    severity: template.severity,
    agencyName: agency.name,
    agencyId: agency.id,
    title: template.title,
    message: template.message(agency.name),
    timestamp: new Date(),
    read: false,
  };
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    // Seed with a few initial notifications
    const initial: Notification[] = [];
    for (let i = 0; i < 5; i++) {
      const n = generateNotification();
      n.timestamp = new Date(Date.now() - (i + 1) * 60000 * (3 + Math.random() * 10));
      if (i > 2) n.read = true;
      initial.push(n);
    }
    return initial;
  });

  const onNewNotification = useRef<((n: Notification) => void) | null>(null);

  // Simulate real-time events every 8-15 seconds
  useEffect(() => {
    const scheduleNext = () => {
      const delay = 8000 + Math.random() * 7000;
      return setTimeout(() => {
        const notif = generateNotification();
        setNotifications(prev => [notif, ...prev].slice(0, 50));
        if (onNewNotification.current) {
          onNewNotification.current(notif);
        }
        timerRef = scheduleNext();
      }, delay);
    };
    let timerRef = scheduleNext();
    return () => clearTimeout(timerRef);
  }, []);

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
