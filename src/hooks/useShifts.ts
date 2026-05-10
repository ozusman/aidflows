import { logger } from '@/lib/logger';
import { useState, useCallback, useEffect } from 'react';
import { Shift, ShiftFormData, calculateShiftHours, generateShiftId } from '@/types/shift';
import { supabase } from '@/integrations/supabase/client';
import { shiftSchema } from '@/lib/shiftValidation';
import { useAuth } from './useAuth';

const HOURLY_RATE = 70;

export function useShifts() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchShifts = useCallback(async () => {
    if (!user) {
      setShifts([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      const mappedShifts: Shift[] = (data || []).map(row => ({
        id: row.id,
        date: row.date,
        startTime: row.start_time,
        endTime: row.end_time,
        totalHours: Number(row.total_hours),
        caregiverName: row.caregiver_name,
        caregiverType: row.caregiver_type as Shift['caregiverType'],
        locationType: row.location_type as Shift['locationType'],
        locationName: row.location_name,
        paymentAmount: Number(row.payment_amount),
        paymentMethod: row.payment_method as Shift['paymentMethod'],
        paymentStatus: row.payment_status as Shift['paymentStatus'],
        paymentDate: row.payment_date || undefined,
        travelCost: Number(row.travel_cost),
        parkingCost: Number(row.parking_cost),
        purpose: row.purpose as Shift['purpose'] | undefined,
        medicalEvent: row.medical_event as Shift['medicalEvent'] | undefined,
        enteredBy: row.entered_by || undefined,
        shiftPerformed: row.shift_performed ?? true,
        notes: row.notes || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      setShifts(mappedShifts);
    } catch (error) {
      logger.error('Error fetching shifts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  const addShift = useCallback(async (formData: ShiftFormData): Promise<Shift | null> => {
    if (!user) return null;

    const parsed = shiftSchema.safeParse(formData);
    if (!parsed.success) {
      logger.error('Shift validation failed:', parsed.error);
      return null;
    }

    const totalHours = calculateShiftHours(formData.startTime, formData.endTime);
    if (totalHours < 0 || totalHours > 24) {
      logger.error('Invalid shift duration');
      return null;
    }
    const shiftId = generateShiftId();

    const dbRow = {
      id: shiftId,
      user_id: user.id,
      date: formData.date,
      start_time: formData.startTime,
      end_time: formData.endTime,
      total_hours: totalHours,
      caregiver_name: formData.caregiverName,
      caregiver_type: formData.caregiverType,
      location_type: formData.locationType,
      location_name: formData.locationName,
      payment_amount: formData.paymentAmount,
      payment_method: formData.paymentMethod,
      payment_status: formData.paymentStatus,
      travel_cost: formData.travelCost,
      parking_cost: formData.parkingCost,
      purpose: formData.purpose || null,
      medical_event: formData.medicalEvent || null,
      entered_by: formData.enteredBy || null,
      shift_performed: formData.shiftPerformed,
      notes: formData.notes || null,
    };

    try {
      const { error } = await supabase.from('shifts').insert(dbRow);
      if (error) throw error;

      const newShift: Shift = {
        id: shiftId,
        ...formData,
        totalHours,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setShifts(prev => [newShift, ...prev]);
      return newShift;
    } catch (error) {
      logger.error('Error adding shift:', error);
      return null;
    }
  }, [user]);

  const updateShift = useCallback(async (id: string, formData: Partial<ShiftFormData>): Promise<Shift | null> => {
    if (!user) return null;

    const parsed = shiftSchema.partial().safeParse(formData);
    if (!parsed.success) {
      logger.error('Shift validation failed:', parsed.error);
      return null;
    }

    const totalHours = formData.startTime && formData.endTime
      ? calculateShiftHours(formData.startTime, formData.endTime)
      : undefined;

    const updateData: Record<string, unknown> = {};
    if (formData.date !== undefined) updateData.date = formData.date;
    if (formData.startTime !== undefined) updateData.start_time = formData.startTime;
    if (formData.endTime !== undefined) updateData.end_time = formData.endTime;
    if (totalHours !== undefined) updateData.total_hours = totalHours;
    if (formData.caregiverName !== undefined) updateData.caregiver_name = formData.caregiverName;
    if (formData.caregiverType !== undefined) updateData.caregiver_type = formData.caregiverType;
    if (formData.locationType !== undefined) updateData.location_type = formData.locationType;
    if (formData.locationName !== undefined) updateData.location_name = formData.locationName;
    if (formData.paymentAmount !== undefined) updateData.payment_amount = formData.paymentAmount;
    if (formData.paymentMethod !== undefined) updateData.payment_method = formData.paymentMethod;
    if (formData.paymentStatus !== undefined) updateData.payment_status = formData.paymentStatus;
    if (formData.travelCost !== undefined) updateData.travel_cost = formData.travelCost;
    if (formData.parkingCost !== undefined) updateData.parking_cost = formData.parkingCost;
    if (formData.purpose !== undefined) updateData.purpose = formData.purpose || null;
    if (formData.medicalEvent !== undefined) updateData.medical_event = formData.medicalEvent || null;
    if (formData.enteredBy !== undefined) updateData.entered_by = formData.enteredBy || null;
    if (formData.shiftPerformed !== undefined) updateData.shift_performed = formData.shiftPerformed;
    if (formData.notes !== undefined) updateData.notes = formData.notes || null;

    try {
      const { error } = await supabase
        .from('shifts')
        .update(updateData as never)
        .eq('id', id);

      if (error) throw error;

      let updatedShift: Shift | null = null;
      setShifts(prev => prev.map(shift => {
        if (shift.id === id) {
          updatedShift = {
            ...shift,
            ...formData,
            totalHours: totalHours ?? shift.totalHours,
            updatedAt: new Date().toISOString(),
          };
          return updatedShift;
        }
        return shift;
      }));

      return updatedShift;
    } catch (error) {
      logger.error('Error updating shift:', error);
      return null;
    }
  }, [user]);

  const deleteShift = useCallback(async (id: string): Promise<void> => {
    if (!user) return;

    try {
      const { error } = await supabase.from('shifts').delete().eq('id', id);
      if (error) throw error;

      setShifts(prev => prev.filter(shift => shift.id !== id));
    } catch (error) {
      logger.error('Error deleting shift:', error);
    }
  }, [user]);

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
    refetch: fetchShifts,
  };
}