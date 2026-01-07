import { useState, useCallback, useEffect } from 'react';
import { Shift, ShiftFormData, calculateShiftHours, generateShiftId } from '@/types/shift';

const STORAGE_KEY = 'aidflow_shifts';
const HOURLY_RATE = 70;

function loadShifts(): Shift[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    // Recalculate payment amounts for shifts that have 0 or missing values
    const shifts: Shift[] = JSON.parse(stored);
    return shifts.map(shift => {
      const calculatedAmount = shift.totalHours * HOURLY_RATE;
      return {
        ...shift,
        paymentAmount: shift.paymentAmount || calculatedAmount,
        travelCost: shift.travelCost || 0,
        parkingCost: shift.parkingCost || 0,
      };
    });
  } catch {
    return [];
  }
}

function saveShifts(shifts: Shift[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shifts));
}

export function useShifts() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setShifts(loadShifts());
    setIsLoading(false);
  }, []);

  const addShift = useCallback((formData: ShiftFormData): Shift => {
    const now = new Date().toISOString();
    const newShift: Shift = {
      id: generateShiftId(),
      ...formData,
      totalHours: calculateShiftHours(formData.startTime, formData.endTime),
      createdAt: now,
      updatedAt: now,
    };

    setShifts(prev => {
      const updated = [...prev, newShift];
      saveShifts(updated);
      return updated;
    });

    return newShift;
  }, []);

  const updateShift = useCallback((id: string, formData: Partial<ShiftFormData>): Shift | null => {
    let updatedShift: Shift | null = null;
    
    setShifts(prev => {
      const updated = prev.map(shift => {
        if (shift.id === id) {
          updatedShift = {
            ...shift,
            ...formData,
            totalHours: formData.startTime && formData.endTime 
              ? calculateShiftHours(formData.startTime, formData.endTime)
              : shift.totalHours,
            updatedAt: new Date().toISOString(),
          };
          return updatedShift;
        }
        return shift;
      });
      saveShifts(updated);
      return updated;
    });

    return updatedShift;
  }, []);

  const deleteShift = useCallback((id: string): void => {
    setShifts(prev => {
      const updated = prev.filter(shift => shift.id !== id);
      saveShifts(updated);
      return updated;
    });
  }, []);

  const getShiftsByDate = useCallback((date: string): Shift[] => {
    return shifts.filter(shift => shift.date === date);
  }, [shifts]);

  const getShiftsByWeek = useCallback((startDate: string, endDate: string): Shift[] => {
    return shifts.filter(shift => shift.date >= startDate && shift.date <= endDate);
  }, [shifts]);

  const getShiftsByCaregiver = useCallback((caregiverName: string): Shift[] => {
    return shifts.filter(shift => shift.caregiverName === caregiverName);
  }, [shifts]);

  const getUniqueCaregivers = useCallback((): string[] => {
    return [...new Set(shifts.map(shift => shift.caregiverName))];
  }, [shifts]);

  const getShiftById = useCallback((id: string): Shift | undefined => {
    return shifts.find(shift => shift.id === id);
  }, [shifts]);

  return {
    shifts,
    isLoading,
    addShift,
    updateShift,
    deleteShift,
    getShiftsByDate,
    getShiftsByWeek,
    getShiftsByCaregiver,
    getUniqueCaregivers,
    getShiftById,
  };
}
