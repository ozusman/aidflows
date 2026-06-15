import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useShifts } from "@/hooks/useShifts";
import { usePaymentReceipts } from "@/hooks/usePaymentReceipts";
import { useCaregivers } from "@/hooks/useCaregivers";
import { Shift } from "@/types/shift";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Paperclip } from "lucide-react";
import { RowActionButton, RowActions } from "@/components/ui/row-actions";
import { Link } from "react-router-dom";
import { cn, formatHoursToHHMM } from "@/lib/utils";
import { PaymentReceiptsDialog } from "./PaymentReceiptsDialog";

function getCaregiverTypeLabel(type: Shift["caregiverType"], t: (key: any) => string): string {
  const labels = {
    private_paid: t("typePrivatePaid"),
    family_member: t("typeFamilyMember"),
    foreign_caregiver: t("typeForeignCaregiver"),
    other: t("typeOther"),
  };
  return labels[type];
}

function getLocationTypeLabel(type: Shift["locationType"], t: (key: any) => string): string {
  const labels = {
    hospital: t("locationHospital"),
    home: t("locationHome"),
    institution: t("locationInstitution"),
  };
  return labels[type];
}

export function ShiftsList() {
  const { t, isRTL } = useI18n();
  const { shifts, isLoading, deleteShift, updateShift } = useShifts();
  const { getReceiptCountByShift } = usePaymentReceipts();
  const { caregivers } = useCaregivers();

  const caregiverRates = new Map(caregivers.map((c) => [c.name, c.hourly_rate || 0]));

  const [receiptCounts, setReceiptCounts] = useState<Record<string, number>>({});
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Load receipt counts for all shifts
  useEffect(() => {
    const loadCounts = async () => {
      const counts: Record<string, number> = {};
      for (const shift of shifts) {
        counts[shift.id] = await getReceiptCountByShift(shift.id);
      }
      setReceiptCounts(counts);
    };

    if (shifts.length > 0) {
      loadCounts();
    }
  }, [shifts, getReceiptCountByShift]);

  const sortedShifts = [...shifts].sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    return b.startTime.localeCompare(a.startTime);
  });

  const handleBadgeClick = (shift: Shift) => {
    if (shift.paymentStatus === "unpaid") {
      // Toggle to paid and open dialog
      updateShift(shift.id, { paymentStatus: "paid" });
      setSelectedShift({ ...shift, paymentStatus: "paid" });
      setDialogOpen(true);
    } else {
      // Already paid - open dialog to view/manage receipts
      setSelectedShift(shift);
      setDialogOpen(true);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      // Refresh receipt counts when dialog closes
      if (selectedShift) {
        getReceiptCountByShift(selectedShift.id).then((count) => {
          setReceiptCounts((prev) => ({ ...prev, [selectedShift.id]: count }));
        });
      }
      setSelectedShift(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">{t("loading")}</CardContent>
      </Card>
    );
  }

  if (shifts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">{t("noShifts")}</p>
          <Link to="/new-shift">
            <Button>{t("navNewShift")}</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">{t("date")}</TableHead>
                  <TableHead className="text-start">{t("startTime")}</TableHead>
                  <TableHead className="text-start">{t("endTime")}</TableHead>
                  <TableHead className="text-start">{t("caregiver")}</TableHead>
                  <TableHead className="text-start">{t("location")}</TableHead>
                  <TableHead className="text-start">{t("hours")}</TableHead>
                  <TableHead className="text-start">{t("travelCost")}</TableHead>
                  <TableHead className="text-start">{t("parkingCost")}</TableHead>
                  <TableHead className="text-start">{t("paymentAmount")}</TableHead>
                  <TableHead className="text-start">{t("paymentStatus")}</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedShifts.map((shift) => {
                  const receiptCount = receiptCounts[shift.id] || 0;

                  return (
                    <TableRow key={shift.id}>
                      <TableCell className="font-medium">{format(new Date(shift.date), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{shift.startTime}</TableCell>
                      <TableCell>{shift.endTime}</TableCell>
                      <TableCell>
                        <div className="font-medium">{shift.caregiverName}</div>
                      </TableCell>
                      <TableCell>
                        <div>{shift.locationName}</div>
                      </TableCell>
                      <TableCell>{formatHoursToHHMM(shift.totalHours)}</TableCell>
                      <TableCell>
                        {t("currencySymbol")}
                        {(shift.travelCost || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {t("currencySymbol")}
                        {(shift.parkingCost || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {t("currencySymbol")}
                        {(shift.totalHours * (caregiverRates.get(shift.caregiverName) ?? 0) + (shift.travelCost || 0) + (shift.parkingCost || 0)).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={shift.paymentStatus === "paid" ? "default" : "secondary"}
                            className={cn(
                              "cursor-pointer transition-colors",
                              shift.paymentStatus === "paid"
                                ? "bg-success text-success-foreground hover:bg-success/80"
                                : "bg-hover-light text-foreground hover:bg-hover-light/80",
                            )}
                            onClick={() => handleBadgeClick(shift)}
                          >
                            {shift.paymentStatus === "paid" ? t("statusPaid") : t("statusUnpaid")}
                          </Badge>
                          {receiptCount > 0 && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Paperclip className="w-3 h-3" />
                              {receiptCount}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <RowActions>
                          <Link to={`/edit-shift/${shift.id}`}>
                            <RowActionButton action="edit" label={t("edit")} />
                          </Link>
                          <RowActionButton action="delete" label={t("delete")} onClick={() => deleteShift(shift.id)} />
                        </RowActions>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedShift && (
        <PaymentReceiptsDialog open={dialogOpen} onOpenChange={handleDialogClose} shift={selectedShift} />
      )}
    </>
  );
}
