import React, { createContext, ReactNode, useContext, useState, useCallback } from 'react';
import { Shift } from '../types/Schedule';

type ScheduleEmployee = {
  id: string;
  name: string;
  role?: string;
  color?: string;
  payType?: 'HOURLY' | 'SALARY';
  payRate?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING';
};

interface ScheduleContextType {
  employees: ScheduleEmployee[];
  shifts: Shift[];
  setEmployees: React.Dispatch<React.SetStateAction<ScheduleEmployee[]>>;
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  updateEmployeeStatus: (employeeId: string, newStatus: 'ACTIVE' | 'INACTIVE' | 'PENDING') => void;
  removeEmployee: (employeeId: string) => void;
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
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<ScheduleEmployee[]>([]);

  const updateEmployeeStatus = useCallback((employeeId: string, newStatus: 'ACTIVE' | 'INACTIVE' | 'PENDING') => {
    setEmployees((prev) => prev.map((employee) => (
      employee.id === employeeId ? { ...employee, status: newStatus } : employee
    )));
  }, []);

  const removeEmployee = useCallback((employeeId: string) => {
    setEmployees((prev) => prev.filter((employee) => employee.id !== employeeId));
  }, []);

  const value = {
    employees,
    shifts,
    setEmployees,
    setShifts,
    updateEmployeeStatus,
    removeEmployee,
  };

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>;
};
