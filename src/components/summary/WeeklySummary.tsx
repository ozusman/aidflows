import { useState, useMemo } from 'react';
import { useI18n } from '@/lib/i18n';
import { useShifts } from '@/hooks/useShifts';
import { formatHoursToHHMM } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';

function getWeekRange(date: Date): { start: string; end: string } {
  const start = startOfWeek(date, { weekStartsOn: 0 });
  const end = endOfWeek(date, { weekStartsOn: 0 });
  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd'),
  };
}

export function WeeklySummary() {
  const { t, isRTL } = useI18n();
  const { shifts, getUniqueCaregivers } = useShifts();
  
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedCaregiver, setSelectedCaregiver] = useState<string>('all');

  const caregivers = getUniqueCaregivers();
  const weekRange = getWeekRange(currentWeek);

  const weekShifts = useMemo(() => {
    return shifts
      .filter(shift => shift.date >= weekRange.start && shift.date <= weekRange.end)
      .filter(shift => selectedCaregiver === 'all' || shift.caregiverName === selectedCaregiver)
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  }, [shifts, weekRange, selectedCaregiver]);

  const totals = useMemo(() => {
    return weekShifts.reduce(
      (acc, shift) => ({
        hours: acc.hours + shift.totalHours,
        payment: acc.payment + (shift.caregiverType !== 'family_member' ? shift.paymentAmount : 0),
        expenses: acc.expenses + (shift.travelCost || 0) + (shift.parkingCost || 0),
      }),
      { hours: 0, payment: 0, expenses: 0 }
    );
  }, [weekShifts]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1));
  };

  const exportCSV = () => {
    const headers = ['Date', 'Start', 'End', 'Hours', 'Caregiver', 'Type', 'Location', 'Payment'];
    const rows = weekShifts.map(s => [
      s.date,
      s.startTime,
      s.endTime,
      s.totalHours.toFixed(2),
      s.caregiverName,
      s.caregiverType,
      s.locationName,
      s.paymentAmount.toFixed(0),
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shifts-${weekRange.start}-${weekRange.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Week navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')} aria-label={t('previous')}>
                {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </Button>
              <div className="text-sm font-medium min-w-[180px] text-center">
                {format(new Date(weekRange.start), 'dd/MM')} - {format(new Date(weekRange.end), 'dd/MM/yyyy')}
              </div>
              <Button variant="outline" size="icon" onClick={() => navigateWeek('next')} aria-label={t('next')}>
                {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>

            {/* Caregiver filter */}
            <Select value={selectedCaregiver} onValueChange={setSelectedCaregiver}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('selectCaregiver')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allCaregivers')}</SelectItem>
                {caregivers.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Export */}
            <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
              <Download className="w-4 h-4" />
              {t('export')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary totals */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="text-sm text-muted-foreground">{t('totalHours')}</div>
            <div className="text-2xl font-semibold">{formatHoursToHHMM(totals.hours)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-sm text-muted-foreground">{t('totalPayment')}</div>
            <div className="text-2xl font-semibold">{t('currencySymbol')}{totals.payment.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-sm text-muted-foreground">Total Expenses</div>
            <div className="text-2xl font-semibold">{t('currencySymbol')}{totals.expenses.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Shifts table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">{t('navShifts')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {weekShifts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">{t('noShifts')}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('date')}</TableHead>
                    <TableHead>{t('startTime')}</TableHead>
                    <TableHead>{t('endTime')}</TableHead>
                    <TableHead className="text-center">{t('hours')}</TableHead>
                    <TableHead>{t('caregiver')}</TableHead>
                    <TableHead>{t('location')}</TableHead>
                    <TableHead className="text-center">Travel</TableHead>
                    <TableHead className="text-center">{t('paymentAmount')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weekShifts.map((shift) => (
                    <TableRow key={shift.id}>
                      <TableCell className="font-medium">
                        {format(new Date(shift.date), 'dd/MM')}
                      </TableCell>
                      <TableCell>{shift.startTime}</TableCell>
                      <TableCell>{shift.endTime}</TableCell>
                      <TableCell className="text-center">
                        {formatHoursToHHMM(shift.totalHours)}
                      </TableCell>
                      <TableCell>{shift.caregiverName}</TableCell>
                      <TableCell>{shift.locationName}</TableCell>
                      <TableCell className="text-center">
                        {(shift.travelCost || 0) + (shift.parkingCost || 0) === 0 ? '—' : `${t('currencySymbol')}${((shift.travelCost || 0) + (shift.parkingCost || 0)).toFixed(2)}`}
                      </TableCell>
                      <TableCell className="text-center">
                        {shift.caregiverType === 'family_member' ? '-' : `${t('currencySymbol')}${shift.paymentAmount.toFixed(2)}`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
