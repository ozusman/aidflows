import * as React from 'react';
import { Pencil, Trash2, Check } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type ActionKind = 'edit' | 'delete' | 'confirm';

const ICONS: Record<ActionKind, React.ComponentType<{ className?: string }>> = {
  edit: Pencil,
  delete: Trash2,
  confirm: Check,
};

const STYLES: Record<ActionKind, string> = {
  edit: 'text-muted-foreground hover:bg-hover-light hover:text-foreground',
  delete: 'text-destructive hover:bg-destructive/10 hover:text-destructive',
  confirm: 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary',
};

export interface RowActionButtonProps
  extends Omit<ButtonProps, 'variant' | 'size' | 'children'> {
  action: ActionKind;
  label: string;
}

export const RowActionButton = React.forwardRef<HTMLButtonElement, RowActionButtonProps>(
  ({ action, label, className, ...props }, ref) => {
    const Icon = ICONS[action];
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              ref={ref}
              type="button"
              variant="ghost"
              size="icon"
              aria-label={label}
              className={cn('h-8 w-8', STYLES[action], className)}
              {...props}
            >
              <Icon className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  },
);
RowActionButton.displayName = 'RowActionButton';

export function RowActions({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex items-center gap-1', className)}>{children}</div>;
}
