import { logger } from '@/lib/logger';
import { useCallback, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { CaregiverType } from '@/types/shift';

export interface Caregiver {
  id: string;
  name: string;
  caregiver_type: CaregiverType;
  hourly_rate: number;
  created_at: string;
  updated_at: string;
}

export function useCaregivers() {
  const { user } = useAuth();
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCaregivers = useCallback(async () => {
    if (!user) {
      setCaregivers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('caregivers')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) {
      logger.error('Error fetching caregivers:', error);
      setCaregivers([]);
    } else {
      setCaregivers((data || []) as Caregiver[]);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCaregivers();
  }, [fetchCaregivers]);

  const saveCaregiver = useCallback(async (name: string, caregiverType: CaregiverType, hourlyRate: number = 0) => {
    if (!user) return;

    const { error } = await supabase
      .from('caregivers')
      .upsert(
        {
          user_id: user.id,
          name: name.trim(),
          caregiver_type: caregiverType,
          hourly_rate: hourlyRate,
        },
        {
          onConflict: 'user_id,name',
        }
      );

    if (error) {
      logger.error('Error saving caregiver:', error);
    } else {
      // Refresh the list
      fetchCaregivers();
    }
  }, [user, fetchCaregivers]);

  const updateCaregiver = useCallback(async (id: string, name: string, caregiverType?: CaregiverType, hourlyRate?: number) => {
    if (!user) return { error: new Error('Not authenticated') };

    const updates: { name: string; updated_at: string; caregiver_type?: CaregiverType; hourly_rate?: number } = {
      name: name.trim(),
      updated_at: new Date().toISOString(),
    };
    if (caregiverType) updates.caregiver_type = caregiverType;
    if (hourlyRate !== undefined) updates.hourly_rate = hourlyRate;

    const { error } = await supabase
      .from('caregivers')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      logger.error('Error updating caregiver:', error);
      return { error };
    }
    await fetchCaregivers();
    return { error: null };
  }, [user, fetchCaregivers]);

  const deleteCaregiver = useCallback(async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('caregivers')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      logger.error('Error deleting caregiver:', error);
    } else {
      // Refresh the list
      fetchCaregivers();
    }
  }, [user, fetchCaregivers]);

  return {
    caregivers,
    isLoading,
    saveCaregiver,
    updateCaregiver,
    deleteCaregiver,
    refetch: fetchCaregivers,
  };
}