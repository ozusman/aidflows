import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { usePaymentReceipts, PaymentReceipt } from '@/hooks/usePaymentReceipts';
import { Shift } from '@/types/shift';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileText, FileSpreadsheet, Image, Loader2 } from 'lucide-react';
import { RowActionButton } from '@/components/ui/row-actions';
import { cn } from '@/lib/utils';

interface PaymentReceiptsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: Shift;
}

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.pdf,.xlsx,.xls';
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) {
    return <Image className="w-8 h-8 text-primary" />;
  }
  if (fileType === 'application/pdf') {
    return <FileText className="w-8 h-8 text-destructive" />;
  }
  return <FileSpreadsheet className="w-8 h-8 text-success" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Component to handle async image loading
function ReceiptThumbnail({ filePath, fileName, getReceiptUrl }: { 
  filePath: string; 
  fileName: string; 
  getReceiptUrl: (path: string) => Promise<string>;
}) {
  const [url, setUrl] = useState<string>('');

  useEffect(() => {
    getReceiptUrl(filePath).then(setUrl);
  }, [filePath, getReceiptUrl]);

  if (!url) {
    return (
      <div className="w-12 h-12 flex items-center justify-center bg-background rounded">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={fileName}
      className="w-12 h-12 object-cover rounded"
    />
  );
}

export function PaymentReceiptsDialog({ 
  open, 
  onOpenChange, 
  shift 
}: PaymentReceiptsDialogProps) {
  const { t } = useI18n();
  const { 
    isUploading, 
    uploadReceipts, 
    getReceiptsByShift, 
    deleteReceipt, 
    getReceiptUrl 
  } = usePaymentReceipts();

  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const loadReceipts = useCallback(async () => {
    setIsLoading(true);
    const data = await getReceiptsByShift(shift.id);
    setReceipts(data);
    setIsLoading(false);
  }, [shift.id, getReceiptsByShift]);

  useEffect(() => {
    if (open) {
      loadReceipts();
    }
  }, [open, loadReceipts]);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const all = Array.from(files);
    const oversized = all.filter(file => file.size > MAX_FILE_BYTES);
    const validFiles = all.filter(file =>
      ACCEPTED_TYPES.includes(file.type) && file.size <= MAX_FILE_BYTES
    );

    if (oversized.length > 0) {
      toast({
        title: t('fileTooLarge'),
        description: oversized.map(f => f.name).join(', '),
        variant: 'destructive',
      });
    }

    if (validFiles.length === 0) return;

    const uploaded = await uploadReceipts(shift, validFiles);
    setReceipts(prev => [...uploaded, ...prev]);
  };

  const handleDelete = async (receipt: PaymentReceipt) => {
    const success = await deleteReceipt(receipt);
    if (success) {
      setReceipts(prev => prev.filter(r => r.id !== receipt.id));
    }
  };

  const handleDownload = async (receipt: PaymentReceipt) => {
    const url = await getReceiptUrl(receipt.filePath);
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {t('uploadReceipts')}
          </DialogTitle>
        </DialogHeader>

        {/* Upload Area */}
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
            isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
            isUploading && "pointer-events-none opacity-50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <input
            id="file-upload"
            type="file"
            multiple
            accept={ACCEPTED_EXTENSIONS}
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{t('uploading')}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('dragFilesHere')}</p>
              <p className="text-xs text-muted-foreground">JPG, PNG, PDF, Excel</p>
            </div>
          )}
        </div>

        {/* Receipts List */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : receipts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t('noReceiptsUploaded')}
            </p>
          ) : (
            receipts.map((receipt) => (
              <div
                key={receipt.id}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
              >
                {/* Preview/Icon */}
                {receipt.fileType.startsWith('image/') ? (
                  <ReceiptThumbnail 
                    filePath={receipt.filePath} 
                    fileName={receipt.fileName}
                    getReceiptUrl={getReceiptUrl}
                  />
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center bg-background rounded">
                    {getFileIcon(receipt.fileType)}
                  </div>
                )}

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{receipt.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(receipt.fileSize)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-foreground/80 hover:bg-hover-light hover:text-foreground"
                    onClick={() => handleDownload(receipt)}
                    aria-label={t('download') || 'Download'}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <RowActionButton
                    action="delete"
                    label={t('delete')}
                    onClick={() => handleDelete(receipt)}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
