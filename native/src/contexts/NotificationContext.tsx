import React, { createContext, useEffect, useState } from 'react';
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
}

export const NotificationContext = createContext<NotificationContextType>({} as NotificationContextType);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { userInfo } = useApp();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    let alive = true;

    const loadNotifications = async () => {
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

        if (alive) setNotifications(mapped);
      } catch (error) {
        console.error('알림 조회 오류:', error);
        if (alive) setNotifications([]);
      }
    };

    loadNotifications();
    const intervalId = setInterval(loadNotifications, 30000);

    return () => {
      alive = false;
      clearInterval(intervalId);
    };
  }, [userInfo?.id]);

  const unreadCount = notifications.filter(n => !n.isRead).length; // 안 읽은 알림 개수 계산

  return (
    <NotificationContext.Provider value={{ notifications, setNotifications, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};
