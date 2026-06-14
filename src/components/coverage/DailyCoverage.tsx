import { useState, useMemo } from 'react';
import { useI18n } from '@/lib/i18n';
import { useShifts } from '@/hooks/useShifts';
import { Shift } from '@/types/shift';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface TimeBlock {
  startMinute: number;
  endMinute: number;
  shift?: Shift;
  type: 'paid' | 'family' | 'gap';
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function computeTimeBlocks(shifts: Shift[]): TimeBlock[] {
  if (shifts.length === 0) {
    return [{ startMinute: 0, endMinute: 24 * 60, type: 'gap' }];
  }

  const sortedShifts = [...shifts].sort((a, b) => 
    timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );

  const blocks: TimeBlock[] = [];
  let currentMinute = 0;

  for (const shift of sortedShifts) {
    let startMin = timeToMinutes(shift.startTime);
    let endMin = timeToMinutes(shift.endTime);
    
    // Handle midnight crossing
    if (endMin < startMin) {
      endMin += 24 * 60;
    }

    // Gap before this shift
    if (startMin > currentMinute) {
      blocks.push({
        startMinute: currentMinute,
        endMinute: startMin,
        type: 'gap',
      });
    }

    // The shift itself
    const type = shift.caregiverType === 'family_member' ? 'family' : 'paid';
    blocks.push({
      startMinute: Math.max(startMin, currentMinute),
      endMinute: Math.min(endMin, 24 * 60),
      shift,
      type,
    });

    currentMinute = Math.max(currentMinute, Math.min(endMin, 24 * 60));
  }

  // Gap at end of day
  if (currentMinute < 24 * 60) {
    blocks.push({
      startMinute: currentMinute,
      endMinute: 24 * 60,
      type: 'gap',
    });
  }

  return blocks;
}

export function DailyCoverage() {
  const { t, isRTL } = useI18n();
  const { getShiftsByDate } = useShifts();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const shifts = getShiftsByDate(selectedDate);
  const timeBlocks = useMemo(() => computeTimeBlocks(shifts), [shifts]);

  const totalCoveredMinutes = timeBlocks
    .filter(b => b.type !== 'gap')
    .reduce((sum, b) => sum + (b.endMinute - b.startMinute), 0);
  
  const coveragePercent = Math.round((totalCoveredMinutes / (24 * 60)) * 100);

  const navigateDate = (direction: 'prev' | 'next') => {
    const date = new Date(selectedDate);
    const newDate = direction === 'prev' ? subDays(date, 1) : addDays(date, 1);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4">
            <Button variant="outline" size="icon" onClick={() => navigateDate('prev')}>
              {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
            <div className="flex-1 max-w-[200px]">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-center"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => navigateDate('next')}>
              {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Coverage Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center justify-between">
            <span>{t('dailyCoverage')}</span>
            {coveragePercent === 100 ? (
              <Badge className="bg-green-100 text-green-800 border-green-200">✓ Full Coverage</Badge>
            ) : (
              <Badge className="bg-warning/20 text-warning-foreground border-warning">⚠ Gap Detected</Badge>
            )}
            <span className="text-lg font-semibold">{coveragePercent}%</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Timeline */}
          <div className="space-y-4">
            {/* Hour markers */}
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>24:00</span>
            </div>
            
            {/* Timeline bar */}
            <div className="relative h-12 rounded-md bg-muted overflow-hidden flex" dir="ltr">
              {timeBlocks.map((block, index) => {
                const widthPercent = ((block.endMinute - block.startMinute) / (24 * 60)) * 100;
                return (
                  <div
                    key={index}
                    className={cn(
                      "h-full flex items-center justify-center text-xs font-medium transition-colors",
                      block.type === 'paid' && "bg-primary text-primary-foreground",
                      block.type === 'family' && "bg-muted-foreground/30 text-foreground",
                      block.type === 'gap' && "bg-warning/20 border border-warning text-warning"
                    )}
                    style={{ width: `${widthPercent}%` }}
                    title={block.shift?.caregiverName || t('uncovered')}
                  >
                    {widthPercent > 8 && block.shift && (
                      <span className="truncate px-1">{block.shift.caregiverName}</span>
                    )}
                    {widthPercent > 5 && block.type === 'gap' && (
                      <span className="truncate px-1">Gap</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-primary"></div>
                <span>{t('paidCaregiver')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-muted-foreground/30"></div>
                <span>{t('familyCaregiver')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-muted border border-border"></div>
                <span>{t('uncovered')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shifts for this day */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">{t('navShifts')}</CardTitle>
        </CardHeader>
        <CardContent>
          {shifts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">{t('noShifts')}</p>
          ) : (
            <div className="space-y-3">
              {shifts.map((shift) => (
                <div
                  key={shift.id}
                  className="flex items-center justify-between p-3 rounded-md border border-border"
                >
                  <div>
                    <div className="font-medium">{shift.caregiverName}</div>
                    <div className="text-sm text-muted-foreground">
                      {shift.startTime} - {shift.endTime} ({shift.totalHours.toFixed(1)}h)
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="font-mono text-sm">{t('currencySymbol')}{shift.paymentAmount}</div>
                    <div className="text-xs text-muted-foreground">{shift.locationName}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
