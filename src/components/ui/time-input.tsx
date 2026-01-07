import * as React from 'react';
import { cn } from '@/lib/utils';

interface TimeInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

export function TimeInput({ value, onChange, className, ...props }: TimeInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // After typing the hour (positions 0-1), auto-select minutes
    const input = inputRef.current;
    if (input && newValue.length >= 3) {
      // Check if cursor is right after the colon (position 3 means HH: was just completed)
      const cursorPos = input.selectionStart || 0;
      if (cursorPos === 3) {
        // Select the minutes portion (positions 3-5)
        setTimeout(() => {
          input.setSelectionRange(3, 5);
        }, 0);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = inputRef.current;
    if (!input) return;

    // When typing second digit of hour, jump to minutes
    const cursorPos = input.selectionStart || 0;
    if (cursorPos === 2 && /\d/.test(e.key)) {
      // Let the native input handle it, then select minutes
      setTimeout(() => {
        input.setSelectionRange(3, 5);
      }, 0);
    }
  };

  return (
    <input
      ref={inputRef}
      type="time"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  );
}
