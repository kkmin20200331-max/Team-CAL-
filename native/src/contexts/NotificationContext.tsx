import React, { createContext, useState } from 'react';
import { useLanguage } from './LanguageContext';

export interface NotificationItem {
  id: string;
  type: 'SCHEDULE' | 'SYSTEM' | 'NOTICE';
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
  // 기존 알림 화면에 있던 더미 데이터를 이곳(전역)으로 이사시킵니다.
  const initialNotifications: NotificationItem[] = [
    { id: '1', type: 'SCHEDULE', title: 'notifSubReqTitle', message: 'notifSubReqMsg', createdAt: 'time10Min', isRead: false },
    { id: '2', type: 'NOTICE', title: 'notifNoticeTitle', message: 'notifNoticeMsg', createdAt: 'time1Hour', isRead: false },
    { id: '3', type: 'SYSTEM', title: 'notifHealthTitle', message: 'notifHealthMsg', createdAt: 'timeYesterday', isRead: true },
    { id: '4', type: 'SCHEDULE', title: 'notifLeaveTitle', message: 'notifLeaveMsg', createdAt: 'time2Days', isRead: true },
  ];

  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const unreadCount = notifications.filter(n => !n.isRead).length; // 안 읽은 알림 개수 계산

  return (
    <NotificationContext.Provider value={{ notifications, setNotifications, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};
