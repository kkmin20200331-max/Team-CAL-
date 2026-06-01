import React, { createContext, useState } from 'react';

export interface NotificationItem {
  id: string;
  type: 'SCHEDULE' | 'SYSTEM' | 'NOTICE';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export const NotificationContext = createContext<any>(null);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  // 기존 알림 화면에 있던 더미 데이터를 이곳(전역)으로 이사시킵니다.
  const initialNotifications: NotificationItem[] = [
    { id: '1', type: 'SCHEDULE', title: '🚨 대타 요청 알림', message: '5월 28일 수요일 17:00~22:00 대타 요청이 있습니다. 앱에서 확인 후 지원해주세요!', createdAt: '10분 전', isRead: false },
    { id: '2', type: 'NOTICE', title: '📢 [공지] 가을 시즌 신메뉴 출시', message: '가을 시즌 신메뉴가 곧 출시됩니다!\n\n게시판에서 레시피 및 상세 매뉴얼을 꼭 확인해 주세요.', createdAt: '1시간 전', isRead: false },
    { id: '3', type: 'SYSTEM', title: '🏥 보건증 만료 임박', message: '보건증 만료일이 7일 남았습니다.\n보건소 방문 후 마이페이지에서 새 이미지를 업로드해주세요.', createdAt: '어제', isRead: true },
    { id: '4', type: 'SCHEDULE', title: '✅ 휴무 승인 완료', message: '요청하신 6/3(수) 휴무 신청이 승인되어 스케줄에 반영되었습니다.', createdAt: '2일 전', isRead: true },
  ];

  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const unreadCount = notifications.filter(n => !n.isRead).length; // 안 읽은 알림 개수 계산

  return (
    <NotificationContext.Provider value={{ notifications, setNotifications, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};
