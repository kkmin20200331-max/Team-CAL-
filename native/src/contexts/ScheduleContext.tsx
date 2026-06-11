import React, { createContext, useState, ReactNode, useContext } from 'react';
import { format, getDaysInMonth } from 'date-fns';
import { Shift } from '../types/Schedule';

const dummyEmployees = [
  { id: 'user_1', name: '김민준', role: '매니저', color: '#4A90E2', payType: 'SALARY' as const, payRate: 3000000 },
  { id: 'user_2', name: '이서연', role: '파트타임', color: '#50E3C2', payType: 'HOURLY' as const, payRate: 10000 },
  { id: 'user_3', name: '박도윤', role: '파트타임', color: '#F5A623', payType: 'HOURLY' as const, payRate: 9860 },
  { id: 'user_4', name: '최지우', role: '풀타임', color: '#BD10E0', payType: 'SALARY' as const, payRate: 2500000 },
  { id: 'user_5', name: '정시우', role: '파트타임', color: '#9013FE', payType: 'HOURLY' as const, payRate: 11000 },
];

const generateDummyShifts = (month: Date): Shift[] => {
  const shifts: any[] = [];
  const daysInMonth = getDaysInMonth(month);
  const monthStr = format(month, 'yyyy-MM');

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${monthStr}-${String(day).padStart(2, '0')}`;
    const dayOfWeek = new Date(dateStr).getDay();

    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      if (day % 2 !== 0) {
        shifts.push({ id: `s_${day}_1`, userId: dummyEmployees[day % 5].id, date: dateStr, time: '09:00-17:00', status: 'CONFIRMED', reason: '' });
        shifts.push({ id: `s_${day}_2`, userId: dummyEmployees[(day + 1) % 5].id, date: dateStr, time: '15:00-23:00', status: 'CONFIRMED', reason: '' });
      } else if (day % 4 === 0) {
        shifts.push({ id: `s_${day}_3`, userId: dummyEmployees[day % 5].id, date: dateStr, time: '08:00-16:00', status: 'CONFIRMED', reason: '' });
        shifts.push({ id: `s_${day}_4`, userId: dummyEmployees[(day + 2) % 5].id, date: dateStr, time: '12:00-20:00', status: 'SUBSTITUTE_REQ', reason: '병원 진료' });
        shifts.push({ id: `s_${day}_5`, userId: dummyEmployees[(day + 3) % 5].id, date: dateStr, time: '16:00-23:00', status: 'CONFIRMED', reason: '' });
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
  employees: typeof dummyEmployees;
  shifts: Shift[];
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
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
  const [shifts, setShifts] = useState<Shift[]>(generateDummyShifts(new Date()));
  
  const value = {
    employees: dummyEmployees,
    shifts,
    setShifts,
  };

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>;
};