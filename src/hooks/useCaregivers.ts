import { useCallback, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { CaregiverType } from '@/types/shift';

export interface Caregiver {
  id: string;
  name: string;
  caregiver_type: CaregiverType;
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
      console.error('Error fetching caregivers:', error);
      setCaregivers([]);
    } else {
      setCaregivers((data || []) as Caregiver[]);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCaregivers();
  }, [fetchCaregivers]);

  const saveCaregiver = useCallback(async (name: string, caregiverType: CaregiverType) => {
    if (!user) return;

    const { error } = await supabase
      .from('caregivers')
      .upsert(
        {
          user_id: user.id,
          name: name.trim(),
          caregiver_type: caregiverType,
        },
        {
          onConflict: 'user_id,name',
        }
      );

    if (error) {
      console.error('Error saving caregiver:', error);
    } else {
      // Refresh the list
      fetchCaregivers();
    }
  }, [user, fetchCaregivers]);

  const deleteCaregiver = useCallback(async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('caregivers')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting caregiver:', error);
    } else {
      // Refresh the list
      fetchCaregivers();
    }
  }, [user, fetchCaregivers]);

  return {
    caregivers,
    isLoading,
    saveCaregiver,
    deleteCaregiver,
    refetch: fetchCaregivers,
  };
}