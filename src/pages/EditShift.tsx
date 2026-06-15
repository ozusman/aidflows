import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useShifts } from '@/hooks/useShifts';
import { useCaregivers } from '@/hooks/useCaregivers';
import { ShiftFormData, CaregiverType, LocationType, PaymentMethod, ShiftPurpose, MedicalEvent, calculateShiftHours } from '@/types/shift';
import { formatHoursToHHMM } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CaregiverAutocomplete } from '@/components/shifts/CaregiverAutocomplete';
import { CaregiverTypeBadge } from '@/components/caregivers/CaregiverTypeBadge';

const HOURLY_RATE = 70;

export default function EditShift() {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const { getShiftById, updateShift } = useShifts();
  const { saveCaregiver } = useCaregivers();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState<ShiftFormData | null>(null);

  useEffect(() => {
    if (id) {
      const shift = getShiftById(id);
      if (shift) {
        setFormData({
          date: shift.date,
          startTime: shift.startTime,
          endTime: shift.endTime,
          caregiverName: shift.caregiverName,
          caregiverType: shift.caregiverType,
          locationType: shift.locationType,
          locationName: shift.locationName,
          paymentAmount: shift.paymentAmount,
          paymentMethod: shift.paymentMethod,
          paymentStatus: shift.paymentStatus,
          travelCost: shift.travelCost || 0,
          parkingCost: shift.parkingCost || 0,
          purpose: shift.purpose,
          medicalEvent: shift.medicalEvent,
          enteredBy: shift.enteredBy,
          shiftPerformed: shift.shiftPerformed,
          notes: shift.notes,
        });
      }
    }
  }, [id, getShiftById]);

  if (!formData) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t('loading')}
      </div>
    );
  }

  const calculatedHours = formData.startTime && formData.endTime 
    ? calculateShiftHours(formData.startTime, formData.endTime)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || !formData.startTime || !formData.endTime || !formData.caregiverName) {
      toast({
        title: t('error'),
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    // Save caregiver to database
    await saveCaregiver(formData.caregiverName, formData.caregiverType);

    updateShift(id, formData);
    toast({
      title: t('success'),
      description: t('shiftSaved'),
    });
    navigate('/');
  };

  const isFamilyMember = formData.caregiverType === 'family_member';

  const updateField = <K extends keyof ShiftFormData>(field: K, value: ShiftFormData[K]) => {
    setFormData(prev => {
      if (!prev) return prev;
      const updated = { ...prev, [field]: value };
      
      // When caregiver type changes to family_member, clear all costs
      if (field === 'caregiverType' && value === 'family_member') {
        updated.paymentAmount = 0;
        updated.travelCost = 0;
        updated.parkingCost = 0;
      }
      
      // Auto-calculate payment amount when times change (only for non-family members)
      if ((field === 'startTime' || field === 'endTime') && updated.caregiverType !== 'family_member') {
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">{t('edit')}</CardTitle>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">{t('caregiver')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t('caregiverName')} *</Label>
            <CaregiverAutocomplete
              value={formData.caregiverName}
              onChange={(name, caregiverType) => {
                updateField('caregiverName', name);
                if (caregiverType) {
                  updateField('caregiverType', caregiverType as CaregiverType);
                }
              }}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>{t('caregiverType')}</Label>
            <div className="h-10 flex items-center">
              {formData.caregiverName ? (
                <CaregiverTypeBadge type={formData.caregiverType} />
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Payment - only show for non-family members */}
      {!isFamilyMember && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">{t('payment')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentAmount">{t('paymentAmount')}</Label>
              <div dir="ltr" className="h-10 px-3 py-2 rounded-md border border-input bg-hover-light text-foreground flex items-center">
                {t('currencySymbol')}{formData.paymentAmount.toFixed(2)}
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
                dir="ltr"
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
                dir="ltr"
                min="0"
                step="0.01"
                value={formData.parkingCost}
                onChange={(e) => updateField('parkingCost', parseFloat(e.target.value) || 0)}
              />
            </div>
          </CardContent>
        </Card>
      )}

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">{t('notes')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes || ''}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

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
