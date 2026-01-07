import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { CaregiverType } from '@/types/shift';

export function useCaregivers() {
  const { user } = useAuth();

  const saveCaregiver = useCallback(async (name: string, caregiverType: CaregiverType) => {
    if (!user) return;

    // Upsert caregiver - insert or update if exists
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
    }
  }, [user]);

  const getCaregivers = useCallback(async () => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('caregivers')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) {
      console.error('Error fetching caregivers:', error);
      return [];
    }

    return data || [];
  }, [user]);

  return {
    saveCaregiver,
    getCaregivers,
  };
}