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

export default function Caregivers() {
  const { t } = useI18n();
  const { caregivers, isLoading, saveCaregiver, updateCaregiver, deleteCaregiver } = useCaregivers();
  const { toast } = useToast();

  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<CaregiverType>('private_paid');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
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
    const { error } = await updateCaregiver(editingId, trimmed);
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
      await saveCaregiver(trimmedName, newType);
      setNewName('');
      setNewType('private_paid');
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
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 items-end">
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
            <Button onClick={handleAddCaregiver} disabled={isAdding}>
              <Plus className="w-4 h-4 me-2" />
              {t('addNewCaregiver')}
            </Button>
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
                        <Badge variant="secondary">
                          {getCaregiverTypeLabel(caregiver.caregiver_type, t)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <div className="flex items-center gap-1">
                            {isEditing ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    size="icon"
                                    onClick={approveEdit}
                                    disabled={isSavingEdit}
                                    className="h-8 w-8"
                                    aria-label={t('approve')}
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{t('approve')}</TooltipContent>
                              </Tooltip>
                            ) : (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => startEdit(caregiver.id, caregiver.name)}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                aria-label={t('edit')}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={isEditing}
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  aria-label={t('delete')}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
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
                          </div>
                        </TooltipProvider>
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