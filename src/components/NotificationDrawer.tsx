import React from 'react';
import { X, Bell, CheckCheck, Trash2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useNotifications, type Notification } from '@/hooks/useNotifications';

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const severityConfig: Record<string, { icon: React.ReactNode; bg: string; border: string }> = {
  CRITICAL: {
    icon: <AlertCircle className="w-4 h-4 text-destructive" />,
    bg: 'bg-destructive/5',
    border: 'border-l-destructive',
  },
  WARNING: {
    icon: <AlertTriangle className="w-4 h-4 text-band-warning" />,
    bg: 'bg-band-warning/5',
    border: 'border-l-band-warning',
  },
  INFO: {
    icon: <Info className="w-4 h-4 text-severity-info" />,
    bg: 'bg-severity-info/5',
    border: 'border-l-severity-info',
  },
};

const NotificationItem: React.FC<{ notification: Notification; onRead: (id: string) => void }> = ({ notification, onRead }) => {
  const config = severityConfig[notification.severity] || severityConfig.INFO;

  return (
    <button
      onClick={() => onRead(notification.id)}
      className={`w-full text-left p-3 border-l-[3px] ${config.border} ${!notification.read ? config.bg : 'bg-transparent'} hover:bg-secondary/50 transition-colors`}
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex-shrink-0">{config.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-xs font-semibold truncate ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
              {notification.title}
            </span>
            {!notification.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-mono text-muted-foreground/70">{notification.agencyId}</span>
            <span className="text-[10px] text-muted-foreground/50">•</span>
            <span className="text-[10px] text-muted-foreground/70">{timeAgo(notification.timestamp)}</span>
          </div>
        </div>
      </div>
    </button>
  );
};

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ open, onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 bg-foreground/10 backdrop-blur-sm z-40" onClick={onClose} />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-card border-l border-border shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h2 className="font-heading text-sm tracking-wider text-foreground">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors"
                title="Clear all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter chips */}
        <div className="px-4 py-2 border-b border-border flex gap-1.5">
          {['All', 'Critical', 'Warning', 'Info'].map(filter => (
            <span
              key={filter}
              className="text-[10px] font-medium px-2 py-1 rounded-full bg-secondary text-muted-foreground cursor-default"
            >
              {filter}
            </span>
          ))}
        </div>

        {/* Notification list */}
        <div className="overflow-y-auto h-[calc(100%-110px)] divide-y divide-border/50">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Bell className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            notifications.map(n => (
              <NotificationItem key={n.id} notification={n} onRead={markAsRead} />
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationDrawer;
