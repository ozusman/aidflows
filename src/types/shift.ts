export type CaregiverType = 'private_paid' | 'family_member' | 'volunteer';
export type LocationType = 'hospital' | 'home' | 'institution';
export type PaymentMethod = 'bank_transfer' | 'paybox' | 'bit' | 'cash';
export type PaymentStatus = 'paid' | 'unpaid';
export type ShiftPurpose = 'guarding' | 'supervision';
export type MedicalEvent = 'hospitalization' | 'deterioration' | 'rehabilitation';

export interface Shift {
  id: string;
  date: string; // ISO date string
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  totalHours: number; // Calculated automatically
  
  // Worker Identity
  caregiverName: string;
  caregiverType: CaregiverType;
  
  // Location
  locationType: LocationType;
  locationName: string;
  
  // Payment
  paymentAmount: number;
  paymentMethod: PaymentMethod;
  paymentDate?: string;
  travelCost: number;
  parkingCost: number;
  paymentStatus: PaymentStatus;
  
  // Layer 2: Strong Legal Reinforcement
  purpose?: ShiftPurpose;
  medicalEvent?: MedicalEvent;
  enteredBy?: string;
  shiftPerformed?: boolean;
  
  // Layer 3: Smart Evidence Enhancers
  notes?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface ShiftFormData {
  date: string;
  startTime: string;
  endTime: string;
  caregiverName: string;
  caregiverType: CaregiverType;
  locationType: LocationType;
  locationName: string;
  paymentAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  travelCost: number;
  parkingCost: number;
  purpose?: ShiftPurpose;
  medicalEvent?: MedicalEvent;
  enteredBy?: string;
  shiftPerformed?: boolean;
  notes?: string;
}

// Calculate hours between start and end time, handling midnight crossing
export function calculateShiftHours(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let startMinutes = startHour * 60 + startMin;
  let endMinutes = endHour * 60 + endMin;
  
  // If end time is before start time, assume it crosses midnight
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }
  
  return Math.round(((endMinutes - startMinutes) / 60) * 100) / 100;
}

export function generateShiftId(): string {
  return `SFT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
