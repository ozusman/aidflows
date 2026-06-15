import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useCaregivers } from '@/hooks/useCaregivers';
import { CaregiverType } from '@/types/shift';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { RowActionButton, RowActions } from '@/components/ui/row-actions';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

function getCaregiverTypeLabel(type: string, t: (key: any) => string): string {
  const labels: Record<string, string> = {
    private_paid: t('typePrivatePaid'),
    family_member: t('typeFamilyMember'),
    foreign_caregiver: t('typeForeignCaregiver'),
    other: t('typeOther'),
  };
  return labels[type] || type;
}

const TYPE_BADGE_CLASSES: Record<string, string> = {
  private_paid: 'bg-caregiver-private text-caregiver-private-foreground hover:bg-caregiver-private/90',
  family_member: 'bg-caregiver-family text-caregiver-family-foreground hover:bg-caregiver-family/90',
  foreign_caregiver: 'bg-caregiver-foreign text-caregiver-foreign-foreground hover:bg-caregiver-foreign/90',
  other: 'bg-caregiver-other text-caregiver-other-foreground hover:bg-caregiver-other/90',
};

function CaregiverTypeBadge({ type, label }: { type: string; label: string }) {
  return (
    <Badge className={`border-transparent ${TYPE_BADGE_CLASSES[type] || TYPE_BADGE_CLASSES.other}`}>
      {label}
    </Badge>
  );
}

export default function Caregivers() {
  const { t } = useI18n();
  const { caregivers, isLoading, saveCaregiver, updateCaregiver, deleteCaregiver } = useCaregivers();
  const { toast } = useToast();

  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<CaregiverType>('private_paid');
  const [newRate, setNewRate] = useState<number>(0);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingType, setEditingType] = useState<CaregiverType>('private_paid');
  const [editingRate, setEditingRate] = useState<number>(0);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const startEdit = (id: string, name: string, type: CaregiverType, rate: number) => {
    setEditingId(id);
    setEditingName(name);
    setEditingType(type);
    setEditingRate(rate);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const approveEdit = async () => {
    if (!editingId) return;
    const trimmed = editingName.trim();
    if (!trimmed) {
      toast({ title: t('error'), description: 'Please enter a name', variant: 'destructive' });
      return;
    }
    setIsSavingEdit(true);
    const { error } = await updateCaregiver(editingId, trimmed, editingType, editingRate);
    setIsSavingEdit(false);
    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: t('success'), description: t('shiftSaved') });
    cancelEdit();
  };
  const handleAddCaregiver = async () => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      toast({
        title: t('error'),
        description: 'Please enter a name',
        variant: 'destructive',
      });
      return;
    }

    setIsAdding(true);
    try {
      await saveCaregiver(trimmedName, newType, newRate);
      setNewName('');
      setNewType('private_paid');
      setNewRate(0);
      toast({
        title: t('success'),
        description: t('shiftSaved'),
      });
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {t('loading')}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t('caregiversTitle')}</h1>

      {/* Add Caregiver Form */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <Label>{t('caregiverName')}</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t('caregiverName')}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('caregiverType')}</Label>
              <Select value={newType} onValueChange={(v: CaregiverType) => setNewType(v)}>
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
            <div className="space-y-2">
              <Label>Hourly rate (€/hr)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={newRate}
                onChange={(e) => setNewRate(Number(e.target.value) || 0)}
              />
            </div>
            <div className="flex sm:justify-end">
              <Button onClick={handleAddCaregiver} disabled={isAdding}>
                <Plus className="w-4 h-4 me-2" />
                {t('addNewCaregiver')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Caregivers Table */}
      <Card>
        <CardContent className="p-0">
          {caregivers.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {t('noCaregivers')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-start">{t('caregiverName')}</TableHead>
                    <TableHead className="text-start">{t('caregiverType')}</TableHead>
                    <TableHead className="text-start">Hourly rate (€/hr)</TableHead>
                    <TableHead className="w-[120px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {caregivers.map((caregiver) => {
                    const isEditing = editingId === caregiver.id;
                    return (
                    <TableRow key={caregiver.id}>
                      <TableCell className="font-medium">
                        {isEditing ? (
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                approveEdit();
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                cancelEdit();
                              }
                            }}
                            maxLength={100}
                            autoFocus
                            disabled={isSavingEdit}
                          />
                        ) : (
                          caregiver.name
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Select
                            value={editingType}
                            onValueChange={(v: CaregiverType) => setEditingType(v)}
                            disabled={isSavingEdit}
                          >
                            <SelectTrigger aria-label={t('caregiverType')} className="h-9 w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="private_paid">{t('typePrivatePaid')}</SelectItem>
                              <SelectItem value="family_member">{t('typeFamilyMember')}</SelectItem>
                              <SelectItem value="foreign_caregiver">{t('typeForeignCaregiver')}</SelectItem>
                              <SelectItem value="other">{t('typeOther')}</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <CaregiverTypeBadge
                            type={caregiver.caregiver_type}
                            label={getCaregiverTypeLabel(caregiver.caregiver_type, t)}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={editingRate}
                            onChange={(e) => setEditingRate(Number(e.target.value) || 0)}
                            className="h-9 w-[120px]"
                            disabled={isSavingEdit}
                          />
                        ) : caregiver.caregiver_type === 'family_member' && Number(caregiver.hourly_rate) === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          `€${Number(caregiver.hourly_rate)}/hr`
                        )}
                      </TableCell>
                      <TableCell>
                        <RowActions>
                          {isEditing ? (
                            <RowActionButton
                              action="confirm"
                              label={t('approve')}
                              onClick={approveEdit}
                              disabled={isSavingEdit}
                            />
                          ) : (
                            <RowActionButton
                              action="edit"
                              label={t('edit')}
                              onClick={() => startEdit(caregiver.id, caregiver.name, caregiver.caregiver_type, Number(caregiver.hourly_rate) || 0)}
                            />
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <RowActionButton
                                action="delete"
                                label={t('delete')}
                                disabled={isEditing}
                              />
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('confirmDeleteCaregiver')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {caregiver.name}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteCaregiver(caregiver.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {t('delete')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </RowActions>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}