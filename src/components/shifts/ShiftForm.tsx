import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useShifts } from '@/hooks/useShifts';
import { ShiftFormData, CaregiverType, LocationType, PaymentMethod, ShiftPurpose, MedicalEvent, calculateShiftHours } from '@/types/shift';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export function ShiftForm() {
  const { t } = useI18n();
  const { addShift } = useShifts();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState<ShiftFormData>({
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    caregiverName: '',
    caregiverType: 'private_paid',
    locationType: 'hospital',
    locationName: '',
    paymentAmount: 0,
    paymentMethod: 'bank_transfer',
    paymentStatus: 'unpaid',
    travelCost: 0,
    parkingCost: 0,
    purpose: undefined,
    medicalEvent: undefined,
    enteredBy: '',
    shiftPerformed: false,
    notes: '',
  });

  const HOURLY_RATE = 70; // shekels per hour
  
  const calculatedHours = formData.startTime && formData.endTime 
    ? calculateShiftHours(formData.startTime, formData.endTime)
    : 0;

  const calculatedAmount = calculatedHours * HOURLY_RATE;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.startTime || !formData.endTime || !formData.caregiverName) {
      toast({
        title: t('error'),
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    addShift(formData);
    toast({
      title: t('success'),
      description: t('shiftSaved'),
    });
    navigate('/');
  };

  const updateField = <K extends keyof ShiftFormData>(field: K, value: ShiftFormData[K]) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-calculate payment amount when times change
      if (field === 'startTime' || field === 'endTime') {
        const hours = updated.startTime && updated.endTime 
          ? calculateShiftHours(updated.startTime, updated.endTime)
          : 0;
        updated.paymentAmount = hours * HOURLY_RATE;
      }
      return updated;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      {/* Time & Date */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">{t('shiftEntry')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">{t('shiftDate')} *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => updateField('date', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startTime">{t('startTime')} *</Label>
            <Input
              id="startTime"
              type="time"
              value={formData.startTime}
              onChange={(e) => updateField('startTime', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">{t('endTime')} *</Label>
            <Input
              id="endTime"
              type="time"
              value={formData.endTime}
              onChange={(e) => updateField('endTime', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>{t('totalHours')}</Label>
            <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted text-foreground flex items-center">
              {calculatedHours.toFixed(2)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Caregiver Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">{t('caregiver')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="caregiverName">{t('caregiverName')} *</Label>
            <Input
              id="caregiverName"
              type="text"
              value={formData.caregiverName}
              onChange={(e) => updateField('caregiverName', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>{t('caregiverType')} *</Label>
            <Select
              value={formData.caregiverType}
              onValueChange={(value: CaregiverType) => updateField('caregiverType', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private_paid">{t('typePrivatePaid')}</SelectItem>
                <SelectItem value="family_member">{t('typeFamilyMember')}</SelectItem>
                <SelectItem value="foreign_caregiver">{t('typeForeignCaregiver')}</SelectItem>
                <SelectItem value="other">{t('typeOther')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">{t('location')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t('locationType')} *</Label>
            <Select
              value={formData.locationType}
              onValueChange={(value: LocationType) => updateField('locationType', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hospital">{t('locationHospital')}</SelectItem>
                <SelectItem value="home">{t('locationHome')}</SelectItem>
                <SelectItem value="institution">{t('locationInstitution')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="locationName">{t('locationName')} *</Label>
            <Input
              id="locationName"
              type="text"
              value={formData.locationName}
              onChange={(e) => updateField('locationName', e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">{t('payment')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="paymentAmount">{t('paymentAmount')}</Label>
            <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted text-foreground flex items-center">
              ₪{formData.paymentAmount.toFixed(2)}
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('paymentMethod')}</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value: PaymentMethod) => updateField('paymentMethod', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">{t('methodBankTransfer')}</SelectItem>
                <SelectItem value="paybox">{t('methodPayBox')}</SelectItem>
                <SelectItem value="bit">{t('methodBit')}</SelectItem>
                <SelectItem value="cash">{t('methodCash')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('paymentStatus')}</Label>
            <Select
              value={formData.paymentStatus}
              onValueChange={(value: 'paid' | 'unpaid') => updateField('paymentStatus', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">{t('statusPaid')}</SelectItem>
                <SelectItem value="unpaid">{t('statusUnpaid')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="travelCost">{t('travelCost')}</Label>
            <Input
              id="travelCost"
              type="number"
              min="0"
              step="0.01"
              value={formData.travelCost}
              onChange={(e) => updateField('travelCost', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parkingCost">{t('parkingCost')}</Label>
            <Input
              id="parkingCost"
              type="number"
              min="0"
              step="0.01"
              value={formData.parkingCost}
              onChange={(e) => updateField('parkingCost', parseFloat(e.target.value) || 0)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Optional: Purpose & Medical Event */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">{t('shiftPurpose')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t('shiftPurpose')}</Label>
            <Select
              value={formData.purpose || ''}
              onValueChange={(value: ShiftPurpose) => updateField('purpose', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="-" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="guarding">{t('purposeGuarding')}</SelectItem>
                <SelectItem value="supervision">{t('purposeSupervision')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('medicalEvent')}</Label>
            <Select
              value={formData.medicalEvent || ''}
              onValueChange={(value: MedicalEvent) => updateField('medicalEvent', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="-" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hospitalization">{t('eventHospitalization')}</SelectItem>
                <SelectItem value="deterioration">{t('eventDeterioration')}</SelectItem>
                <SelectItem value="rehabilitation">{t('eventRehabilitation')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="enteredBy">{t('dataEnteredBy')}</Label>
            <Input
              id="enteredBy"
              type="text"
              value={formData.enteredBy || ''}
              onChange={(e) => updateField('enteredBy', e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Checkbox
              id="shiftPerformed"
              checked={formData.shiftPerformed}
              onCheckedChange={(checked) => updateField('shiftPerformed', checked === true)}
            />
            <Label htmlFor="shiftPerformed" className="cursor-pointer">{t('shiftPerformed')}</Label>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">{t('notes')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes || ''}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={3}
            placeholder=""
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => navigate('/')}>
          {t('cancel')}
        </Button>
        <Button type="submit">
          {t('save')}
        </Button>
      </div>
    </form>
  );
}
