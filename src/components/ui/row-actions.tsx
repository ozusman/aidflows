import * as React from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type ActionKind = 'edit' | 'delete' | 'confirm' | 'cancel';

const ICONS: Record<ActionKind, React.ComponentType<{ className?: string }>> = {
  edit: Pencil,
  delete: Trash2,
  confirm: Check,
  cancel: X,
};

// Accessibility: icons must meet WCAG AA contrast on light backgrounds.
const STYLES: Record<ActionKind, string> = {
  edit: 'text-foreground/80 hover:bg-hover-light hover:text-foreground',
  delete: 'text-destructive-foreground hover:bg-destructive hover:text-destructive-foreground focus-visible:ring-destructive-foreground',
  confirm: 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
  cancel: 'text-foreground/80 hover:bg-hover-light hover:text-foreground',
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
