import { logger } from '@/lib/logger';
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Shift } from '@/types/shift';

export interface PaymentReceipt {
  id: string;
  shiftId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

// Ensure shift exists in cloud database before uploading receipts
async function ensureShiftInDatabase(shift: Shift, userId: string): Promise<boolean> {
  // Check if shift already exists
  const { data: existing } = await supabase
    .from('shifts')
    .select('id')
    .eq('id', shift.id)
    .single();

  if (existing) return true;

  // Insert shift into database with user_id
  const { error } = await supabase
    .from('shifts')
    .insert({
      id: shift.id,
      user_id: userId,
      date: shift.date,
      start_time: shift.startTime,
      end_time: shift.endTime,
      total_hours: shift.totalHours,
      caregiver_name: shift.caregiverName,
      caregiver_type: shift.caregiverType,
      location_type: shift.locationType,
      location_name: shift.locationName,
      payment_amount: shift.paymentAmount,
      payment_method: shift.paymentMethod,
      payment_date: shift.paymentDate || null,
      travel_cost: shift.travelCost,
      parking_cost: shift.parkingCost,
      payment_status: shift.paymentStatus,
      purpose: shift.purpose || null,
      medical_event: shift.medicalEvent || null,
      entered_by: shift.enteredBy || null,
      shift_performed: shift.shiftPerformed ?? true,
      notes: shift.notes || null,
      created_at: shift.createdAt,
      updated_at: shift.updatedAt,
    });

  if (error) {
    logger.error('Error syncing shift to database:', error);
    return false;
  }

  return true;
}

export function usePaymentReceipts() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadReceipts = useCallback(async (shift: Shift, files: File[]): Promise<PaymentReceipt[]> => {
    setIsUploading(true);
    const uploadedReceipts: PaymentReceipt[] = [];

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        logger.error('User not authenticated');
        return [];
      }

      // Ensure shift exists in database first
      const synced = await ensureShiftInDatabase(shift, user.id);
      if (!synced) {
        logger.error('Failed to sync shift to database');
        return [];
      }

      const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
      for (const file of files) {
        if (file.size > MAX_FILE_BYTES) {
          logger.warn('Skipping oversized file:', file.name, file.size);
          continue;
        }
        const fileExt = file.name.split('.').pop();
        // Use user_id as the folder prefix for storage RLS
        const fileName = `${user.id}/${shift.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('payment-receipts')
          .upload(fileName, file);

        if (uploadError) {
          logger.error('Upload error:', uploadError);
          continue;
        }

        // Save metadata to database with user_id
        const { data, error: dbError } = await supabase
          .from('payment_receipts')
          .insert({
            shift_id: shift.id,
            user_id: user.id,
            file_name: file.name,
            file_path: fileName,
            file_type: file.type,
            file_size: file.size,
          })
          .select()
          .single();

        if (dbError) {
          logger.error('DB error:', dbError);
          continue;
        }

        uploadedReceipts.push({
          id: data.id,
          shiftId: data.shift_id,
          fileName: data.file_name,
          filePath: data.file_path,
          fileType: data.file_type,
          fileSize: data.file_size,
          createdAt: data.created_at,
        });
      }

      return uploadedReceipts;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const getReceiptsByShift = useCallback(async (shiftId: string): Promise<PaymentReceipt[]> => {
    const { data, error } = await supabase
      .from('payment_receipts')
      .select('*')
      .eq('shift_id', shiftId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching receipts:', error);
      return [];
    }

    return data.map(item => ({
      id: item.id,
      shiftId: item.shift_id,
      fileName: item.file_name,
      filePath: item.file_path,
      fileType: item.file_type,
      fileSize: item.file_size,
      createdAt: item.created_at,
    }));
  }, []);

  const deleteReceipt = useCallback(async (receipt: PaymentReceipt): Promise<boolean> => {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('payment-receipts')
      .remove([receipt.filePath]);

    if (storageError) {
      logger.error('Storage delete error:', storageError);
      return false;
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('payment_receipts')
      .delete()
      .eq('id', receipt.id);

    if (dbError) {
      logger.error('DB delete error:', dbError);
      return false;
    }

    return true;
  }, []);

  const getReceiptUrl = useCallback(async (filePath: string): Promise<string> => {
    // Use signed URL for private bucket (1 hour expiry)
    const { data, error } = await supabase.storage
      .from('payment-receipts')
      .createSignedUrl(filePath, 3600);
    
    if (error || !data) {
      logger.error('Error creating signed URL:', error);
      return '';
    }
    
    return data.signedUrl;
  }, []);

  const getReceiptCountByShift = useCallback(async (shiftId: string): Promise<number> => {
    const { count, error } = await supabase
      .from('payment_receipts')
      .select('*', { count: 'exact', head: true })
      .eq('shift_id', shiftId);

    if (error) {
      logger.error('Error counting receipts:', error);
      return 0;
    }

    return count || 0;
  }, []);

  return {
    isUploading,
    uploadReceipts,
    getReceiptsByShift,
    deleteReceipt,
    getReceiptUrl,
    getReceiptCountByShift,
  };
}
