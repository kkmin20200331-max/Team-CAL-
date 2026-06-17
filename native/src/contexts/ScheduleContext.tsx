import React, { createContext, useState, ReactNode, useContext, useEffect } from 'react';
import { format, getDaysInMonth } from 'date-fns';
import { Shift } from '../types/Schedule';
import { User } from '../types/User';
import { useApp } from './AppContext';
import { getMyScheduleAPI, updateUserStatusAPI } from '../../api/auth';

const dummyEmployees: (User & { color: string, payType: 'HOURLY' | 'SALARY', payRate: number })[] = [
  { id: 'user_0', username: 'admin', name: '관리자', role: 'ADMIN', color: '#FF5A5F', payType: 'SALARY' as const, payRate: 4000000, status: 'ACTIVE' },
  { id: 'user_1', username: 'mjkim', name: '김민준', role: '매니저', color: '#4A90E2', payType: 'SALARY' as const, payRate: 3000000, status: 'ACTIVE' },
  { id: 'user_2', username: 'sylee', name: '이서연', role: '파트타임', color: '#50E3C2', payType: 'HOURLY' as const, payRate: 10000, status: 'ACTIVE' },
  { id: 'user_3', username: 'dypark', name: '박도윤', role: '파트타임', color: '#F5A623', payType: 'HOURLY' as const, payRate: 9860, status: 'ACTIVE' },
  { id: 'user_4', username: 'jwchoi', name: '최지우', role: '풀타임', color: '#BD10E0', payType: 'SALARY' as const, payRate: 2500000, status: 'ACTIVE' },
  { id: 'user_5', username: 'swjung', name: '정시우', role: '파트타임', color: '#9013FE', payType: 'HOURLY' as const, payRate: 11000, status: 'ACTIVE' },
  { id: 'user_6', username: 'yjhwang', name: '황예지', role: '파트타임', color: '#FF7A00', payType: 'HOURLY' as const, payRate: 9860, status: 'PENDING' },
  { id: 'user_7', username: 'ryushin', name: '신류진', role: '파트타임', color: '#00C4FF', payType: 'HOURLY' as const, payRate: 9860, status: 'PENDING' },
];

const generateDummyShifts = (month: Date): Shift[] => {
  const shifts: any[] = [];
  const daysInMonth = getDaysInMonth(month);
  const monthStr = format(month, 'yyyy-MM');

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${monthStr}-${String(day).padStart(2, '0')}`;
    const dayOfWeek = new Date(dateStr).getDay();

    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      if (day % 5 === 1) { // 월요일 같은 특정일에 휴무 요청 추가
        shifts.push({ id: `s_${day}_1`, userId: dummyEmployees[day % 5].id, date: dateStr, time: '09:00-17:00', status: 'LEAVE_REQ', reason: '병원 방문' });
        shifts.push({ id: `s_${day}_2`, userId: dummyEmployees[(day + 1) % 5].id, date: dateStr, time: '15:00-23:00', status: 'CONFIRMED', reason: '' });
      } else if (day % 4 === 0) {
        shifts.push({ id: `s_${day}_3`, userId: dummyEmployees[day % 5].id, date: dateStr, time: '08:00-16:00', status: 'CONFIRMED', reason: '' });
        shifts.push({ id: `s_${day}_4`, userId: dummyEmployees[(day + 2) % 5].id, date: dateStr, time: '12:00-20:00', status: 'SUBSTITUTE_REQ', reason: '병원 진료' });
        shifts.push({ id: `s_${day}_5`, userId: dummyEmployees[(day + 3) % 5].id, date: dateStr, time: '16:00-23:00', status: 'CONFIRMED', reason: '' });
      } else {
        shifts.push({ id: `s_${day}_generic`, userId: dummyEmployees[day % 5].id, date: dateStr, time: '10:00-18:00', status: 'CONFIRMED', reason: '' });
      }
    } else if (dayOfWeek === 6) {
      shifts.push({ id: `s_${day}_6`, userId: dummyEmployees[day % 5].id, date: dateStr, time: '10:00-18:00', status: 'CONFIRMED', reason: '' });
      shifts.push({ id: `s_${day}_7`, userId: dummyEmployees[(day + 1) % 5].id, date: dateStr, time: '12:00-20:00', status: 'CONFIRMED', reason: '' });
      shifts.push({ id: `s_${day}_8`, userId: dummyEmployees[(day + 2) % 5].id, date: dateStr, time: '14:00-22:00', status: 'SUBSTITUTE_REQ', reason: '가족 행사' });
    }
  }
  return shifts;
};

interface ScheduleContextType {
  employees: (User & { color: string, payType: 'HOURLY' | 'SALARY', payRate: number })[];
  shifts: Shift[];
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  updateEmployeeStatus: (employeeId: string, newStatus: 'ACTIVE' | 'INACTIVE' | 'PENDING') => Promise<void>;
  removeEmployee: (employeeId: string) => void;
  addShift: (newShift: Omit<Shift, 'id'>) => void;
  updateShift: (updatedShift: Shift) => void;
  deleteShift: (shiftId: string) => void;
  fetchSchedules: () => void;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};

interface ScheduleProviderProps {
  children: ReactNode;
}

export const ScheduleProvider = ({ children }: ScheduleProviderProps) => {
  const { userInfo } = useApp();
  const [shifts, setShifts] = useState<Shift[]>(generateDummyShifts(new Date()));
  const [employees, setEmployees] = useState(dummyEmployees);

  const fetchSchedules = async () => {
    if (userInfo?.id && userInfo.store_id) {
      try {
        const response = await getMyScheduleAPI(userInfo.id, userInfo.store_id);
        setShifts(response.data);
      } catch (error) {
        console.error("스케줄 데이터 로딩 실패:", error);
      }
    }
  };

  useEffect(() => {
    if (userInfo) {
      const userExists = employees.some(emp => emp.id === userInfo.id);
      if (!userExists) {
        const userWithDefaults = {
          ...userInfo,
          color: '#888888',
          payType: 'HOURLY' as const,
          payRate: userInfo.payRate || 10000,
        };
        setEmployees(prev => [...prev, userWithDefaults]);
      }
    }
    // fetchSchedules(); 
  }, [userInfo]);

  const updateEmployeeStatus = async (employeeId: string, newStatus: 'ACTIVE' | 'INACTIVE' | 'PENDING') => {
    try {
      await updateUserStatusAPI(employeeId, newStatus);
      setEmployees(prev => prev.map(emp => emp.id === employeeId ? { ...emp, status: newStatus } : emp));
    } catch (error) {
      console.error("직원 상태 업데이트 실패:", error);
      throw error;
    }
  };

  const removeEmployee = (employeeId: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
  };

  const addShift = (newShift: Omit<Shift, 'id'>) => {
    const shiftWithId = { ...newShift, id: `shift_${Date.now()}` } as Shift;
    setShifts(prev => [...prev, shiftWithId]);
  };

  const updateShift = (updatedShift: Shift) => {
    setShifts(prev => prev.map(s => s.id === updatedShift.id ? updatedShift : s));
  };

  const deleteShift = (shiftId: string) => {
    setShifts(prev => prev.filter(s => s.id !== shiftId));
  };
  
  const value = {
    employees,
    shifts,
    setShifts,
    updateEmployeeStatus,
    removeEmployee,
    addShift,
    updateShift,
    deleteShift,
    fetchSchedules,
  };

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>;
};