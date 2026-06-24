import React, { createContext, useEffect, useState, useCallback } from 'react';
import { getNotificationsAPI } from '../../api/auth';
import { useApp } from './AppContext';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export interface NotificationContextType {
  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType>({} as NotificationContextType);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { userInfo } = useApp();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const refreshNotifications = useCallback(async () => {
    if (!userInfo?.id) {
      setNotifications([]);
      return;
    }

    try {
      const response = await getNotificationsAPI(userInfo.id);
      const mapped = Array.isArray(response.data)
        ? response.data.map((item: any) => ({
            id: item.id,
            type: item.type || 'SYSTEM',
            title: item.title || '알림',
            message: item.content || '',
            createdAt: item.created_at || item.createdAt || '',
            isRead: item.is_read === 'Y' || item.isRead === true,
          }))
        : [];

      setNotifications(mapped);
    } catch (error) {
      console.error('알림 조회 오류:', error);
      setNotifications([]);
    }
  }, [userInfo?.id]);

  useEffect(() => {
    refreshNotifications();
    const intervalId = setInterval(refreshNotifications, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [refreshNotifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length; // 안 읽은 알림 개수 계산

  return (
    <NotificationContext.Provider value={{ notifications, setNotifications, unreadCount, refreshNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};
