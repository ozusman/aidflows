import { z } from 'zod';
import type { ShiftFormData } from '@/types/shift';

export const shiftSchema = z.object({
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  caregiverName: z.string().trim().min(1).max(200),
  caregiverType: z.string().min(1),
  locationType: z.string().min(1),
  locationName: z.string().trim().max(200),
  paymentAmount: z.number().min(0),
  paymentMethod: z.string().min(1),
  paymentStatus: z.string().min(1),
  travelCost: z.number().min(0).max(10000),
  parkingCost: z.number().min(0).max(1000),
  purpose: z.string().max(200).optional().nullable(),
  medicalEvent: z.string().max(200).optional().nullable(),
  enteredBy: z.string().max(100).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  shiftPerformed: z.boolean().optional(),
});

export function validateShift(data: Partial<ShiftFormData>) {
  return shiftSchema.partial().safeParse(data);
}
