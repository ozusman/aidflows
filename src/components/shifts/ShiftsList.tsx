import { useI18n } from '@/lib/i18n';
import { useShifts } from '@/hooks/useShifts';
import { Shift } from '@/types/shift';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Trash2, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

function getCaregiverTypeLabel(type: Shift['caregiverType'], t: (key: any) => string): string {
  const labels = {
    private_paid: t('typePrivatePaid'),
    family_member: t('typeFamilyMember'),
    foreign_caregiver: t('typeForeignCaregiver'),
    other: t('typeOther'),
  };
  return labels[type];
}

function getLocationTypeLabel(type: Shift['locationType'], t: (key: any) => string): string {
  const labels = {
    hospital: t('locationHospital'),
    home: t('locationHome'),
    institution: t('locationInstitution'),
  };
  return labels[type];
}

export function ShiftsList() {
  const { t, isRTL } = useI18n();
  const { shifts, isLoading, deleteShift } = useShifts();

  const sortedShifts = [...shifts].sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    return b.startTime.localeCompare(a.startTime);
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {t('loading')}
        </CardContent>
      </Card>
    );
  }

  if (shifts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">{t('noShifts')}</p>
          <Link to="/new-shift">
            <Button>{t('navNewShift')}</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">{t('date')}</TableHead>
                <TableHead className="text-start">{t('startTime')}</TableHead>
                <TableHead className="text-start">{t('endTime')}</TableHead>
                <TableHead className="text-start">{t('caregiver')}</TableHead>
                <TableHead className="text-start">{t('location')}</TableHead>
                <TableHead className="text-start">{t('hours')}</TableHead>
                <TableHead className="text-start">{t('paymentAmount')}</TableHead>
                <TableHead className="text-start">{t('paymentStatus')}</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedShifts.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell className="font-medium">
                    {format(new Date(shift.date), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell>{shift.startTime}</TableCell>
                  <TableCell>{shift.endTime}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{shift.caregiverName}</div>
                      <div className="text-xs text-muted-foreground">
                        {getCaregiverTypeLabel(shift.caregiverType, t)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{shift.locationName}</div>
                      <div className="text-xs text-muted-foreground">
                        {getLocationTypeLabel(shift.locationType, t)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">
                    {shift.totalHours.toFixed(2)}
                  </TableCell>
                  <TableCell className="font-mono">
                    ₪{shift.paymentAmount.toFixed(0)}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={shift.paymentStatus === 'paid' ? 'default' : 'secondary'}
                      className={cn(
                        shift.paymentStatus === 'paid' 
                          ? 'bg-success text-success-foreground' 
                          : ''
                      )}
                    >
                      {shift.paymentStatus === 'paid' ? t('statusPaid') : t('statusUnpaid')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Link to={`/edit-shift/${shift.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteShift(shift.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
