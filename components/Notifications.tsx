
import React, { useState, useEffect } from 'react';
import { User, Notification, NotificationType } from '../types';
import { storageService } from '../services/storageService';
import { Bell, Check, Megaphone, FileText, CheckCircle2, XCircle, X } from 'lucide-react';
import { Button } from './Button';

interface NotificationsProps {
  currentUser: User;
  onClose: () => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ currentUser, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, [currentUser]);

  const loadNotifications = async () => {
    setLoading(true);
    const data = await storageService.getNotifications(currentUser.id);
    setNotifications(data);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await storageService.markNotificationRead(id);
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = async () => {
    await storageService.markAllNotificationsRead(currentUser.id);
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const formatTime = (ts: number) => {
      const date = new Date(ts);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.round(diffMs / 60000);
      const diffHours = Math.round(diffMs / 3600000);
      const diffDays = Math.round(diffMs / 86400000);

      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
  };

  const getIcon = (type: NotificationType, title: string) => {
      switch (type) {
          case NotificationType.NEW_REPORT:
              return <FileText className="w-4 h-4 text-indigo-500" />;
          case NotificationType.NEW_ANNOUNCEMENT:
              return <Megaphone className="w-4 h-4 text-blue-500" />;
          case NotificationType.REPORT_STATUS:
              if (title.includes('Approved')) return <CheckCircle2 className="w-4 h-4 text-green-500" />;
              return <XCircle className="w-4 h-4 text-red-500" />;
          case NotificationType.FEEDBACK_RECEIVED:
              return <CheckCircle2 className="w-4 h-4 text-purple-500" />;
          default:
              return <Bell className="w-4 h-4 text-slate-500" />;
      }
  };

  return (
    <div className="absolute left-full top-4 ml-4 w-96 max-h-[calc(100vh-2rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col z-50 overflow-hidden animate-in slide-in-from-left-4 fade-in duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
           Notifications
           <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-[10px] px-1.5 py-0.5 rounded-full">
             {notifications.filter(n => !n.isRead).length}
           </span>
        </h3>
        <div className="flex gap-1">
             <button 
                onClick={markAllAsRead}
                disabled={!notifications.some(n => !n.isRead)}
                className="p-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 disabled:opacity-50 transition-colors"
                title="Mark all read"
             >
                 <Check className="w-4 h-4" />
             </button>
             <button 
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
             >
                 <X className="w-4 h-4" />
             </button>
        </div>
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1 p-2 space-y-1">
          {loading ? (
             <div className="p-8 text-center text-slate-400 text-sm">Loading...</div>
          ) : notifications.length === 0 ? (
             <div className="p-8 text-center flex flex-col items-center">
                 <Bell className="w-8 h-8 text-slate-200 dark:text-slate-700 mb-2" />
                 <p className="text-sm text-slate-500 dark:text-slate-400">No notifications.</p>
             </div>
          ) : (
             notifications.map(n => (
                  <div 
                    key={n.id} 
                    className={`p-3 rounded-xl flex items-start gap-3 transition-all ${
                        n.isRead 
                        ? 'hover:bg-slate-50 dark:hover:bg-slate-800' 
                        : 'bg-indigo-50/50 dark:bg-indigo-900/20 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                    }`}
                  >
                      <div className={`mt-0.5 p-1.5 rounded-full shrink-0 ${n.isRead ? 'bg-slate-100 dark:bg-slate-800' : 'bg-white dark:bg-slate-700 shadow-sm'}`}>
                          {getIcon(n.type, n.title)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-0.5">
                              <h4 className={`text-sm font-semibold truncate ${n.isRead ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                                  {n.title}
                              </h4>
                              <span className="text-[10px] text-slate-400 whitespace-nowrap ml-1">{formatTime(n.timestamp)}</span>
                          </div>
                          <p className={`text-xs line-clamp-2 ${n.isRead ? 'text-slate-500 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>
                              {n.message}
                          </p>
                          {!n.isRead && (
                             <button 
                               onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                               className="mt-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                             >
                               Mark as read
                             </button>
                          )}
                      </div>
                  </div>
              ))
          )}
      </div>
    </div>
  );
};
